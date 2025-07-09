import { NextRequest, NextResponse } from 'next/server';
import { feedbackCache } from '../../lib/services/feedbackCache';
import { getFeedbackService } from '../../lib/services/airtable/feedback-airtable';
import { withAuth } from '@/lib/auth-middleware';
import { Logger } from '@/app/lib/utils/logger';

export const POST = withAuth(async (request: NextRequest, authResult) => {
    const { user, context } = authResult;
    
    // Type guard: user should always be defined when auth is successful
    if (!user) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    const logger = Logger.getInstance().withContext({
        ...context,
        component: 'feedback-api',
        action: 'submit-feedback'
    });

    try {
        const body = await request.json();
        const { runId, rating, comment } = body;

        logger.info('Feedback request received', undefined, {
            runId,
            rating,
            hasComment: !!comment,
            cacheSize: feedbackCache.size()
        });

        logger.debug('Cache diagnostic info', undefined, {
            allCachedRunIds: feedbackCache.getAll().map(data => data.runId)
        });

        if (!runId || !rating) {
            logger.warn('Missing required feedback fields', undefined, {
                runId: !!runId,
                rating: !!rating
            });
            return NextResponse.json(
                { error: 'Missing required fields: runId, rating' },
                { status: 400 }
            );
        }

        if (!['like', 'dislike'].includes(rating)) {
            logger.warn('Invalid rating value provided', undefined, {
                rating,
                validRatings: ['like', 'dislike']
            });
            return NextResponse.json(
                { error: 'Rating must be either "like" or "dislike"' },
                { status: 400 }
            );
        }

        // Get the cached interaction data
        logger.debug('Attempting to retrieve cached data', undefined, {
            runId
        });
        const cachedData = feedbackCache.get(runId);
        
        if (!cachedData) {
            logger.error('Interaction data not found for runId', undefined, undefined, {
                runId,
                availableRunIds: feedbackCache.getAll().map(d => d.runId)
            });
            return NextResponse.json(
                { error: 'Interaction data not found for this runId' },
                { status: 404 }
            );
        }

        // Check if the user is authorized to provide feedback for this interaction
        if (cachedData.userId && cachedData.userId !== user.uid) {
            logger.warn('User attempted to provide feedback for another user\'s interaction', undefined, {
                runId,
                attemptingUserId: user.uid,
                actualUserId: cachedData.userId
            });
            return NextResponse.json(
                { error: 'You are not authorized to provide feedback for this interaction' },
                { status: 403 }
            );
        }

        logger.info('Found cached data for runId', undefined, {
            runId,
            hasUserData: !!cachedData.userId,
            dataKeys: Object.keys(cachedData)
        });

        logger.debug('Cached data details', undefined, {
            cachedData: JSON.stringify(cachedData, null, 2)
        });

        // Convert like/dislike to emoji format expected by Airtable
        const airtableRating = rating === 'like' ? '👍' : '👎';

        // Update the cached data with feedback
        const updatedData = feedbackCache.update(runId, {
            rating: airtableRating,
            comment: comment || null,
            reviewer: user.email || user.uid
        });

        if (!updatedData) {
            logger.error('Failed to update cached data', undefined, undefined, {
                runId,
                rating: airtableRating
            });
            return NextResponse.json(
                { error: 'Failed to update cached data' },
                { status: 500 }
            );
        }

        // Send the complete data to Airtable
        try {
            const airtableResult = await getFeedbackService().logAssistantInteraction(updatedData);
            logger.info('Feedback sent to Airtable successfully', undefined, {
                runId,
                rating: airtableRating,
                airtableId: airtableResult.id
            });
            
            return NextResponse.json({ 
                success: true, 
                message: 'Feedback stored successfully',
                runId,
                airtableId: airtableResult.id
            });
        } catch (airtableError) {
            logger.error('Error sending feedback to Airtable', airtableError, undefined, {
                runId,
                rating: airtableRating,
                fallbackStrategy: 'cache-only'
            });
            // Still return success since we have it cached
            return NextResponse.json({ 
                success: true, 
                message: 'Feedback cached successfully, will retry Airtable sync',
                runId,
                warning: 'Airtable sync failed but data is cached'
            });
        }

    } catch (error) {
        logger.error('Error processing feedback', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});

export const GET = withAuth(async (request: NextRequest, authResult) => {
    const { user, context } = authResult;
    
    // Type guard: user should always be defined when auth is successful
    if (!user) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    const logger = Logger.getInstance().withContext({
        ...context,
        component: 'feedback-api',
        action: 'get-feedback'
    });

    try {
        const { searchParams } = new URL(request.url);
        const runId = searchParams.get('runId');

        if (runId) {
            logger.info('Retrieving feedback for specific runId', undefined, {
                runId
            });
            
            const data = feedbackCache.get(runId);
            if (!data) {
                logger.warn('Feedback data not found for runId', undefined, {
                    runId
                });
                return NextResponse.json(
                    { error: 'Data not found' },
                    { status: 404 }
                );
            }
            
            // Check if the user is authorized to view this interaction
            if (data.userId && data.userId !== user.uid) {
                logger.warn('User attempted to view another user\'s feedback', undefined, {
                    runId,
                    attemptingUserId: user.uid,
                    actualUserId: data.userId
                });
                return NextResponse.json(
                    { error: 'You are not authorized to view this interaction' },
                    { status: 403 }
                );
            }
            
            logger.info('Successfully retrieved feedback data', undefined, {
                runId,
                hasUserData: !!data.userId
            });
            
            return NextResponse.json(data);
        }

        // Return only the user's interactions
        logger.info('Retrieving all feedback data for user');
        
        const allData = feedbackCache.getAll();
        const userInteractions = allData.filter(interaction => 
            !interaction.userId || interaction.userId === user.uid
        );
        
        logger.info('Successfully retrieved user interactions', undefined, {
            totalInteractions: allData.length,
            userInteractions: userInteractions.length
        });
        
        return NextResponse.json({ 
            interactions: userInteractions,
            count: userInteractions.length 
        });

    } catch (error) {
        logger.error('Error retrieving feedback data', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});
import { NextRequest } from 'next/server';
import { feedbackCache } from '../../lib/services/feedbackCache';
import { getFeedbackService } from '../../lib/services/airtable/feedback-airtable';
import { withApiResponse, createApiResponse, AuthResultWithContext } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';

export const POST = withApiResponse('feedback-api', 'submit-feedback')(
    async (request: NextRequest, authResult: AuthResultWithContext) => {
        const { user, context } = authResult;
        const logger = Logger.getInstance();
        
        // Type guard: user should always be defined when auth is successful
        if (!user) {
            const errorResponse = ApiResponseBuilder.unauthorized('Authentication failed', context);
            return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
        }

        try {
            const body = await request.json();
            const { runId, rating, comment } = body;

            logger.info('Feedback request received', context, {
                runId,
                rating,
                hasComment: !!comment,
                cacheSize: feedbackCache.size()
            });

            logger.debug('Cache diagnostic info', context, {
                allCachedRunIds: feedbackCache.getAll().map(data => data.runId)
            });

            if (!runId || !rating) {
                logger.warn('Missing required feedback fields', context, {
                    runId: !!runId,
                    rating: !!rating
                });
                const errorResponse = ApiResponseBuilder.validationError('Missing required fields: runId, rating', context);
                return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
            }

            if (!['like', 'dislike'].includes(rating)) {
                logger.warn('Invalid rating value provided', context, {
                    rating,
                    validRatings: ['like', 'dislike']
                });
                const errorResponse = ApiResponseBuilder.validationError('Rating must be either "like" or "dislike"', context, 'rating');
                return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
            }

            // Get the cached interaction data
            logger.debug('Attempting to retrieve cached data', context, {
                runId
            });
            const cachedData = feedbackCache.get(runId);
            
            if (!cachedData) {
                logger.error('Interaction data not found for runId', new Error('Interaction data not found'), context, {
                    runId,
                    availableRunIds: feedbackCache.getAll().map(d => d.runId)
                });
                const errorResponse = ApiResponseBuilder.notFound('Interaction data not found for this runId', context);
                return createApiResponse(errorResponse, HTTP_STATUS.NOT_FOUND);
            }

            // Check if the user is authorized to provide feedback for this interaction
            if (cachedData.userId && cachedData.userId !== user.uid) {
                logger.warn('User attempted to provide feedback for another user\'s interaction', context, {
                    runId,
                    attemptingUserId: user.uid,
                    actualUserId: cachedData.userId
                });
                const errorResponse = ApiResponseBuilder.forbidden('You are not authorized to provide feedback for this interaction', context);
                return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
            }

            logger.info('Found cached data for runId', context, {
                runId,
                hasUserData: !!cachedData.userId,
                dataKeys: Object.keys(cachedData)
            });

            logger.debug('Cached data details', context, {
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
                logger.error('Failed to update cached data', new Error('Failed to update cached data'), context, {
                    runId,
                    rating: airtableRating
                });
                const errorResponse = ApiResponseBuilder.internalError('Failed to update cached data', context);
                return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }

            // Send the complete data to Airtable
            try {
                const airtableResult = await getFeedbackService().logAssistantInteraction(updatedData);
                logger.info('Feedback sent to Airtable successfully', context, {
                    runId,
                    rating: airtableRating,
                    airtableId: airtableResult.id
                });
                
                const responseData = {
                    success: true,
                    message: 'Feedback stored successfully',
                    runId,
                    airtableId: airtableResult.id
                };
                
                const successResponse = ApiResponseBuilder.success(responseData, context);
                return createApiResponse(successResponse, HTTP_STATUS.OK);
                
            } catch (airtableError) {
                logger.error('Error sending feedback to Airtable', airtableError, context, {
                    runId,
                    rating: airtableRating,
                    fallbackStrategy: 'cache-only'
                });
                // Still return success since we have it cached
                const responseData = {
                    success: true,
                    message: 'Feedback cached successfully, will retry Airtable sync',
                    runId,
                    warning: 'Airtable sync failed but data is cached'
                };
                
                const successResponse = ApiResponseBuilder.success(responseData, context);
                return createApiResponse(successResponse, HTTP_STATUS.OK);
            }

        } catch (error) {
            logger.error('Error processing feedback', error, context);
            const errorResponse = ApiResponseBuilder.internalError('Internal server error', context);
            return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
);

export const GET = withApiResponse('feedback-api', 'get-feedback')(
    async (request: NextRequest, authResult: AuthResultWithContext) => {
        const { user, context } = authResult;
        const logger = Logger.getInstance();
        
        // Type guard: user should always be defined when auth is successful
        if (!user) {
            const errorResponse = ApiResponseBuilder.unauthorized('Authentication failed', context);
            return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
        }

        try {
            const { searchParams } = new URL(request.url);
            const runId = searchParams.get('runId');

            if (runId) {
                logger.info('Retrieving feedback for specific runId', context, {
                    runId
                });
                
                const data = feedbackCache.get(runId);
                if (!data) {
                    logger.warn('Feedback data not found for runId', context, {
                        runId
                    });
                    const errorResponse = ApiResponseBuilder.notFound('Data not found', context);
                    return createApiResponse(errorResponse, HTTP_STATUS.NOT_FOUND);
                }
                
                // Check if the user is authorized to view this interaction
                if (data.userId && data.userId !== user.uid) {
                    logger.warn('User attempted to view another user\'s feedback', context, {
                        runId,
                        attemptingUserId: user.uid,
                        actualUserId: data.userId
                    });
                    const errorResponse = ApiResponseBuilder.forbidden('You are not authorized to view this interaction', context);
                    return createApiResponse(errorResponse, HTTP_STATUS.FORBIDDEN);
                }
                
                logger.info('Successfully retrieved feedback data', context, {
                    runId,
                    hasUserData: !!data.userId
                });
                
                const successResponse = ApiResponseBuilder.success(data, context);
                return createApiResponse(successResponse, HTTP_STATUS.OK);
            }

            // Return only the user's interactions
            logger.info('Retrieving all feedback data for user', context);
            
            const allData = feedbackCache.getAll();
            const userInteractions = allData.filter(interaction => 
                !interaction.userId || interaction.userId === user.uid
            );
            
            logger.info('Successfully retrieved user interactions', context, {
                totalInteractions: allData.length,
                userInteractions: userInteractions.length
            });
            
            const responseData = {
                interactions: userInteractions,
                count: userInteractions.length 
            };
            
            const successResponse = ApiResponseBuilder.success(responseData, context);
            return createApiResponse(successResponse, HTTP_STATUS.OK);

        } catch (error) {
            logger.error('Error retrieving feedback data', error, context);
            const errorResponse = ApiResponseBuilder.internalError('Internal server error', context);
            return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
);
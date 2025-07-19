import { NextRequest } from 'next/server';
import { feedbackCache } from '../../lib/services/feedbackCache';
import { getFeedbackService } from '../../lib/services/airtable/feedback-airtable';
import { withApiResponse, createApiResponse } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';

export const POST = withApiResponse('feedback-api', 'submit-feedback')(
    async (request: NextRequest, context) => {
        const logger = Logger.getInstance();

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
                allCachedRunIds: feedbackCache.getAll().map(data => data.runId),
                cacheSize: feedbackCache.size(),
                requestedRunId: runId
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

            // Convert text rating to emoji for Airtable
            const airtableRating = rating === 'like' ? '👍' : '👎';

            // Retrieve cached data by runId
            const cachedData = feedbackCache.get(runId);
            
            if (!cachedData) {
                logger.warn('No cached data found for runId', context, {
                    runId,
                    availableRunIds: feedbackCache.getAll().map(data => data.runId),
                    cacheSize: feedbackCache.size(),
                    allCachedData: feedbackCache.getAll().map(data => ({
                        runId: data.runId,
                        threadId: data.threadId,
                        timestamp: data.timestamp
                    }))
                });
                
                // For development: Allow feedback submission without cached data
                if (process.env.NODE_ENV === 'development') {
                    logger.warn('Development mode: Creating minimal feedback record without cached data', context, {
                        runId,
                        rating
                    });
                    
                    const minimalAirtableData = {
                        'Thread ID': 'unknown',
                        'Run ID': runId,
                        'User Prompt': 'N/A (cache miss)',
                        'Assistant Response': 'N/A (cache miss)',
                        'Tool Calls': '[]',
                        'Tool Outputs': '[]',
                        'QA Comment': comment || '',
                        'Reviewed By': '',
                        'Rating': airtableRating
                    };
                    
                    try {
                        const feedbackService = getFeedbackService();
                        const airtableResponse = await feedbackService.createRecord('Feedbacks', minimalAirtableData);
                        
                        logger.info('Development feedback submitted successfully (without cache)', context, {
                            runId,
                            airtableRecordId: airtableResponse.id,
                            rating
                        });
                        
                        const responseData = {
                            success: true,
                            airtableRecordId: airtableResponse.id,
                            message: 'Feedback submitted successfully (development mode)',
                            warning: 'Interaction data was not cached'
                        };
                        
                        const successResponse = ApiResponseBuilder.success(responseData, context);
                        return createApiResponse(successResponse, HTTP_STATUS.OK);
                        
                    } catch (airtableError) {
                        logger.error('Failed to submit development feedback to Airtable', airtableError, context, {
                            runId,
                            rating
                        });
                        const errorResponse = ApiResponseBuilder.internalError('Failed to submit feedback', context);
                        return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
                    }
                }
                
                const errorResponse = ApiResponseBuilder.notFound('Cached interaction data not found for this run', context);
                return createApiResponse(errorResponse, HTTP_STATUS.NOT_FOUND);
            }

            logger.info('Retrieved cached data for feedback', context, {
                runId,
                hasUserPrompt: !!cachedData.userPrompt,
                hasAssistantResponse: !!cachedData.assistantResponse,
                threadId: cachedData.threadId
            });

            // Prepare the data for Airtable with feedback
            const airtableData = {
                'Thread ID': cachedData.threadId,
                'Run ID': runId,
                'User Prompt': cachedData.userPrompt,
                'Assistant Response': cachedData.assistantResponse,
                'Tool Calls': JSON.stringify(cachedData.toolCalls || []),
                'Tool Outputs': JSON.stringify(cachedData.toolOutputs || []),
                'QA Comment': comment || '',
                'Reviewed By': '',
                'Rating': airtableRating
            };

            logger.info('Submitting feedback to Airtable', context, {
                runId,
                rating,
                hasComment: !!comment,
                threadId: cachedData.threadId
            });

            // Submit to Airtable
            const feedbackService = getFeedbackService();
            const airtableResponse = await feedbackService.createRecord('Feedbacks', airtableData);

            logger.info('Feedback submitted successfully to Airtable', context, {
                runId,
                airtableRecordId: airtableResponse.id,
                rating
            });

            const responseData = {
                success: true,
                airtableRecordId: airtableResponse.id,
                message: 'Feedback submitted successfully'
            };

            const successResponse = ApiResponseBuilder.success(responseData, context);
            return createApiResponse(successResponse, HTTP_STATUS.OK);

        } catch (error) {
            logger.error('Feedback submission failed', error, context);

            const errorResponse = ApiResponseBuilder.internalError(
                'Failed to submit feedback',
                context
            );
            return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
);
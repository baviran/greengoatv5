import { NextRequest } from 'next/server';
import { getOpenAIService } from '@/app/lib/services/openai';
import { withApiResponse, createApiResponse } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';

export const GET = withApiResponse('messages-api', 'fetch-messages')(
    async (request: NextRequest, context) => {
        const logger = Logger.getInstance();

        try {
            logger.info('Messages request received', context);
            
            // Extract threadId from URL path
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const threadId = pathParts[pathParts.indexOf('threads') + 1];
            
            if (!threadId || typeof threadId !== 'string') {
                logger.warn('Invalid thread ID provided', context, {
                    threadId,
                    threadIdType: typeof threadId
                });
                const errorResponse = ApiResponseBuilder.validationError('Thread ID is required and must be a string', context, 'threadId');
                return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
            }

            logger.info('Fetching messages from thread', context, {
                threadId
            });
            
            const messages = await getOpenAIService().fetchMessagesByThreadId(threadId);
            
            logger.info('Successfully fetched messages', context, {
                threadId,
                messageCount: messages.length
            });
            
            const responseData = { messages };
            const successResponse = ApiResponseBuilder.success(responseData, context);
            return createApiResponse(successResponse, HTTP_STATUS.OK);

        } catch (error) {
            logger.error('Failed to fetch messages', error, context);
            
            const errorResponse = ApiResponseBuilder.internalError('Failed to fetch messages', context);
            return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
);
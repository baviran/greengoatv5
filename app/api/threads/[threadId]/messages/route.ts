import { NextRequest } from 'next/server';
import { getOpenAIService } from '@/app/lib/services/openai';
import { withApiResponse, createApiResponse, AuthResultWithContext } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';

export const GET = withApiResponse('messages-api', 'fetch-messages')(
    async (request: NextRequest, authResult: AuthResultWithContext) => {
        const { user, context: requestContext } = authResult;
        const logger = Logger.getInstance();

        // Type guard: user should always be defined when auth is successful
        if (!user) {
            const errorResponse = ApiResponseBuilder.unauthorized('Authentication failed', requestContext);
            return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
        }

        try {
            logger.info('Messages request received', requestContext);
            
            // Extract threadId from URL path
            const url = new URL(request.url);
            const pathParts = url.pathname.split('/');
            const threadId = pathParts[pathParts.indexOf('threads') + 1];
            
            if (!threadId || typeof threadId !== 'string') {
                logger.warn('Invalid thread ID provided', requestContext, {
                    threadId,
                    threadIdType: typeof threadId
                });
                const errorResponse = ApiResponseBuilder.validationError('Thread ID is required and must be a string', requestContext, 'threadId');
                return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
            }

            logger.info('Fetching messages from thread', requestContext, {
                threadId
            });
            
            const messages = await getOpenAIService().fetchMessagesByThreadId(threadId);
            
            logger.info('Successfully fetched messages', requestContext, {
                threadId,
                messageCount: messages.length
            });
            
            const responseData = { messages };
            const successResponse = ApiResponseBuilder.success(responseData, requestContext);
            return createApiResponse(successResponse, HTTP_STATUS.OK);

        } catch (error) {
            logger.error('Error fetching messages', error, requestContext, {
                threadId: 'extraction-failed'
            });
            const errorResponse = ApiResponseBuilder.internalError('Failed to fetch messages', requestContext);
            return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
);
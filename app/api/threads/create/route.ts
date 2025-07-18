import { NextRequest } from 'next/server';
import { Logger } from '@/app/lib/utils/logger';
import { OpenAIService } from "@/app/lib/services/openai";
import { withApiResponse, createApiResponse } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';

export const POST = withApiResponse('threads-api', 'create-thread')(
    async (req: NextRequest, context) => {
        const logger = Logger.getInstance();

        try {
            logger.info('Creating new thread', context);
            
            const openai = OpenAIService.getInstance();
            const body = await req.json();
            const { assistantId } = body;

            if (!assistantId) {
                logger.warn('Thread creation failed: missing assistant ID', context, {
                    providedFields: Object.keys(body)
                });
                const errorResponse = ApiResponseBuilder.validationError('Assistant ID is required', context, 'assistantId');
                return createApiResponse(errorResponse, HTTP_STATUS.BAD_REQUEST);
            }
            
            logger.info('Creating new thread with assistant ID', context, {
                assistantId: assistantId
            });
            
            try {
                const thread = await openai.createThread();
                logger.info('Successfully created thread', context, {
                    threadId: thread.id,
                    assistantId: assistantId
                });
                
                const responseData = { threadId: thread.id };
                const successResponse = ApiResponseBuilder.success(responseData, context);
                return createApiResponse(successResponse, HTTP_STATUS.OK);
                
            } catch (error) {
                logger.error('Error creating thread with OpenAI', error, context, {
                    assistantId: assistantId
                });
                
                const errorResponse = ApiResponseBuilder.internalError('Failed to create thread', context);
                return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
            
        } catch (error) {
            logger.error('Thread creation request failed', error, context);
            
            const errorResponse = ApiResponseBuilder.internalError('Failed to process thread creation request', context);
            return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
);
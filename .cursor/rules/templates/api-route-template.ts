import { NextRequest } from 'next/server';
import { withApiResponse, AuthResultWithContext } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';
import { ValidationError } from '@/app/lib/errors/app-errors';

// Template for API route handlers
export const GET = withApiResponse('component-name', 'action-name')(
  async (request: NextRequest, authResult: AuthResultWithContext) => {
    const { user, context } = authResult;
    const logger = Logger.getInstance().withContext(context);
    
    logger.info('API request started', { 
      endpoint: request.url,
      method: 'GET'
    });
    
    try {
      // Your business logic here
      const data = await getDataFromService(user.uid, context);
      
      logger.info('API request completed successfully', {
        userId: user.uid,
        dataCount: Array.isArray(data) ? data.length : 1
      });
      
      const response = ApiResponseBuilder.success(data, context);
      return createApiResponse(response, HTTP_STATUS.OK);
      
    } catch (error) {
      logger.error('API request failed', error, {
        userId: user.uid,
        endpoint: request.url
      });
      throw error; // Let ErrorHandler handle it
    }
  }
);

export const POST = withApiResponse('component-name', 'action-name')(
  async (request: NextRequest, authResult: AuthResultWithContext) => {
    const { user, context } = authResult;
    const logger = Logger.getInstance().withContext(context);
    
    logger.info('API request started', { 
      endpoint: request.url,
      method: 'POST'
    });
    
    try {
      // Parse and validate request body
      const requestData = await request.json();
      
      // Validation
      if (!requestData.requiredField) {
        throw new ValidationError('Required field is missing', 'requiredField');
      }
      
      // Your business logic here
      const result = await processDataWithService(requestData, user.uid, context);
      
      logger.info('API request completed successfully', {
        userId: user.uid,
        resultId: result.id
      });
      
      const response = ApiResponseBuilder.success(result, context);
      return createApiResponse(response, HTTP_STATUS.CREATED);
      
    } catch (error) {
      logger.error('API request failed', error, {
        userId: user.uid,
        endpoint: request.url
      });
      throw error;
    }
  }
);

// Example service function (replace with your actual service)
async function getDataFromService(userId: string, context: any) {
  // Your service logic here
  return { id: '123', userId, data: 'example' };
}

async function processDataWithService(data: any, userId: string, context: any) {
  // Your service logic here
  return { id: '456', userId, processed: true };
} 
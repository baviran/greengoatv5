import { NextRequest } from 'next/server';
import { withApiResponse, createApiResponse, AuthResultWithContext } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { Logger } from '@/app/lib/utils/logger';

export const GET = withApiResponse('user-validate-api', 'validate-user')(
  async (request: NextRequest, authResult: AuthResultWithContext) => {
    const { user, context } = authResult;
    const logger = Logger.getInstance();
    
    // Type guard: user should always be defined when auth is successful
    if (!user) {
      const errorResponse = ApiResponseBuilder.unauthorized('Authentication failed', context);
      return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
    
    try {
      logger.info('User validation request processed successfully', context);
      
      // If we reach here, the user is authenticated and validated
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.email, // Use email as display name
        role: user.isAdmin ? 'admin' : 'user',
        status: 'active' // All users in the system are active
      };
      
      const successResponse = ApiResponseBuilder.success(userData, context);
      return createApiResponse(successResponse, HTTP_STATUS.OK);
      
    } catch (error) {
      logger.error('Error in user validation', error, context);
      const errorResponse = ApiResponseBuilder.internalError('Internal server error', context);
      return createApiResponse(errorResponse, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
); 
import { NextRequest } from 'next/server';
import { withApiResponse, createApiResponse, AuthResultWithContext } from '@/app/lib/utils/response-middleware';
import { ApiResponseBuilder, HTTP_STATUS } from '@/app/lib/utils/api-response';
import { userService } from '@/app/lib/services/user-service';
import { Logger } from '@/app/lib/utils/logger';

export const GET = withApiResponse('user-profile-api', 'get-profile')(
  async (req: NextRequest, authResult: AuthResultWithContext) => {
    const { user, context } = authResult;
    const logger = Logger.getInstance();

    // Type guard: user should always be defined when auth is successful
    if (!user) {
      const errorResponse = ApiResponseBuilder.unauthorized('Authentication failed', context);
      return createApiResponse(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
    
    logger.info('User profile API request', context, {
      userId: user.uid,
      email: user.email
    });

    try {
      // Get user data from the service
      const userData = await userService.getUserByEmail(user.email || '');
      
      if (!userData) {
        logger.warn('User not found in database', context, {
          userId: user.uid,
          email: user.email
        });
        
        const response = ApiResponseBuilder.notFound(
          'User profile not found',
          context
        );
        return createApiResponse(response, HTTP_STATUS.NOT_FOUND);
      }
      
      logger.info('User profile retrieved successfully', context, {
        userId: user.uid,
        email: userData.email,
        role: userData.role
      });
      
      const response = ApiResponseBuilder.success(userData, context);
      return createApiResponse(response, HTTP_STATUS.OK);
      
    } catch (error) {
      logger.error('Error retrieving user profile', error as Error, context, {
        userId: user.uid,
        email: user.email
      });
      
      const response = ApiResponseBuilder.internalError(
        'Failed to retrieve user profile',
        context
      );
      return createApiResponse(response, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
); 
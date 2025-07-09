import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, HTTP_STATUS, createRequestContext, RequestContext } from './api-response';
import { withAuth } from '@/lib/auth-middleware';
import { Logger } from './logger';

// Enhanced auth result that includes request context
export interface AuthResultWithContext {
  user: any;
  context: RequestContext;
}

// Handler type for authenticated routes with response context
export type AuthenticatedResponseHandler = (
  req: NextRequest,
  authResult: AuthResultWithContext
) => Promise<NextResponse>;

// Handler type for public routes with response context
export type PublicResponseHandler = (
  req: NextRequest,
  context: RequestContext
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps API routes with unified response handling
 * and authentication
 */
export function withApiResponse(
  component: string,
  action: string,
  requireAuth: boolean = true
) {
  return function (handler: AuthenticatedResponseHandler | PublicResponseHandler) {
    if (requireAuth) {
      return withAuth(async (req: NextRequest, authResult: any) => {
        const { user, context: authContext } = authResult;
        
        // Create request context with auth information
        const requestContext = createRequestContext(
          component,
          action,
          user?.uid,
          user?.email,
          authContext?.requestId
        );
        
        const logger = Logger.getInstance();
        
        try {
          logger.requestStart('API request started', requestContext);
          
          const response = await (handler as AuthenticatedResponseHandler)(req, {
            user,
            context: requestContext
          });
          
          logger.requestEnd('API request completed', requestContext.startTime!, requestContext);
          
          return response;
          
        } catch (error) {
          logger.error('API request failed', error, requestContext);
          
          // Return unified error response
          const errorResponse = ApiResponseBuilder.internalError(
            'Internal server error',
            requestContext
          );
          
          return NextResponse.json(errorResponse, {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR
          });
        }
      });
    } else {
      return async (req: NextRequest) => {
        const requestContext = createRequestContext(component, action);
        const logger = Logger.getInstance();
        
        try {
          logger.requestStart('API request started', requestContext);
          
          const response = await (handler as PublicResponseHandler)(req, requestContext);
          
          logger.requestEnd('API request completed', requestContext.startTime!, requestContext);
          
          return response;
          
        } catch (error) {
          logger.error('API request failed', error, requestContext);
          
          // Return unified error response
          const errorResponse = ApiResponseBuilder.internalError(
            'Internal server error',
            requestContext
          );
          
          return NextResponse.json(errorResponse, {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR
          });
        }
      };
    }
  };
}

/**
 * Helper function to create unified NextResponse from ApiResponse
 */
export function createApiResponse(
  apiResponse: any,
  status: number = HTTP_STATUS.OK
): NextResponse {
  return NextResponse.json(apiResponse, { status });
}

/**
 * Helper function to handle common validation errors
 */
export function validateRequired(
  data: any,
  requiredFields: string[]
): string | null {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  
  return null;
}

/**
 * Helper function to handle pagination parameters
 */
export function extractPaginationParams(req: NextRequest): {
  limit: number;
  offset: number;
} {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  
  return {
    limit: limitParam ? Math.min(parseInt(limitParam), 100) : 50, // Max 100 items
    offset: offsetParam ? parseInt(offsetParam) : 0
  };
}

/**
 * Helper function to create pagination info
 */
export function createPaginationInfo(
  total: number,
  count: number,
  limit: number,
  offset: number
) {
  return {
    total,
    count,
    limit,
    offset,
    hasMore: (offset + limit) < total
  };
} 
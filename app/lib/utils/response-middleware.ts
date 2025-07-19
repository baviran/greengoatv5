import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS, createRequestContext, RequestContext } from './api-response';
import { Logger } from './logger';
import { ErrorHandler } from '../errors/error-handler';

// Handler type for public routes with response context
export type PublicResponseHandler = (
  req: NextRequest,
  context: RequestContext
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps API routes with unified response handling
 */
export function withApiResponse(
  component: string,
  action: string
) {
  return function (handler: PublicResponseHandler) {
    return async (req: NextRequest) => {
      const requestContext = createRequestContext(component, action);
      const logger = Logger.getInstance();
      
      try {
        logger.requestStart('API request started', requestContext);
        
        const response = await handler(req, requestContext);
        
        logger.requestEnd('API request completed', requestContext.startTime!, requestContext);
        
        return response;
        
      } catch (error) {
        logger.error('API request failed', error, requestContext);
        
        // Use the new ErrorHandler for consistent error processing
        const errorHandler = ErrorHandler.getInstance();
        return errorHandler.handleApiError(error as Error, requestContext, req);
      }
    };
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
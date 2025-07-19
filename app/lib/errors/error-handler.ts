import { NextResponse } from 'next/server';
import { ApiResponseBuilder, ErrorCode } from '../utils/api-response';
import { createApiResponse } from '../utils/response-middleware';
import { AppError, isAppError, mapErrorToApiResponse } from './app-errors';
import { Logger } from '../utils/logger';
import { RequestContext } from '../utils/api-response';

// Enhanced error handler that integrates with existing systems
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Process any error and return a unified NextResponse
   * This integrates with the existing ApiResponseBuilder system
   */
  public async handleError(
    error: Error | AppError,
    context: RequestContext,
    fallbackMessage?: string
  ): Promise<NextResponse> {
    try {
      // Use the existing mapErrorToApiResponse function
      const { statusCode, response } = mapErrorToApiResponse(error, context);

      // Create the API response using the existing ApiResponseBuilder
      const apiResponse = ApiResponseBuilder.error(
        response.code as ErrorCode,
        response.message,
        context,
        response.details,
        response.field
      );

      // Return using the existing createApiResponse function
      return createApiResponse(apiResponse, statusCode);

    } catch (handlerError) {
      // If error handler itself fails, use the existing fallback
      this.logger.error('Error handler failed', handlerError, context, {
        originalError: error.message,
        originalStack: error.stack
      });

      const fallbackResponse = ApiResponseBuilder.internalError(
        fallbackMessage || 'An unexpected error occurred',
        context
      );

      return createApiResponse(fallbackResponse, 500);
    }
  }

  /**
   * Handle errors specifically for API routes
   * This wraps the existing middleware error handling
   */
  public async handleApiError(
    error: Error | AppError,
    context: RequestContext,
    req?: any
  ): Promise<NextResponse> {
    // Add request information to context if available
    if (req) {
      const enhancedContext = {
        ...context,
        url: req.url,
        method: req.method,
        userAgent: req.headers?.get('user-agent'),
        ip: req.headers?.get('x-forwarded-for') || req.headers?.get('x-real-ip')
      };

      return this.handleError(error, enhancedContext);
    }

    return this.handleError(error, context);
  }

  /**
   * Handle validation errors with field-specific information
   */
  public async handleValidationError(
    errors: ValidationErrorItem[],
    context: RequestContext
  ): Promise<NextResponse> {
    const firstError = errors[0];
    
    if (firstError) {
      const validationError = new (await import('./app-errors')).ValidationError(
        firstError.message,
        firstError.field,
        { errors }
      );

      return this.handleError(validationError, context);
    }

    // Fallback for empty errors array
    const fallbackError = new (await import('./app-errors')).ValidationError(
      'Validation failed',
      undefined,
      { errors }
    );

    return this.handleError(fallbackError, context);
  }

  /**
   * Handle external service errors with retry logic
   */
  public async handleExternalServiceError(
    serviceName: string,
    originalError: any,
    context: RequestContext,
    retryCount: number = 0
  ): Promise<NextResponse> {
    const { ExternalServiceError } = await import('./app-errors');
    
    const serviceError = new ExternalServiceError(serviceName, originalError, {
      retryCount,
      timestamp: new Date().toISOString()
    });

    return this.handleError(serviceError, context);
  }

  // Authentication error handling removed - public app

  /**
   * Handle resource not found errors
   */
  public async handleNotFoundError(
    resource: string,
    identifier?: string,
    context?: RequestContext
  ): Promise<NextResponse> {
    const { NotFoundError } = await import('./app-errors');
    
    const error = new NotFoundError(resource, identifier);
    
    return this.handleError(error, context!);
  }

  /**
   * Handle business logic errors
   */
  public async handleBusinessLogicError(
    message: string,
    context: RequestContext,
    details?: any
  ): Promise<NextResponse> {
    const { BusinessLogicError } = await import('./app-errors');
    
    const error = new BusinessLogicError(message, details);
    
    return this.handleError(error, context);
  }

  /**
   * Safe error handler that never throws
   * Use this in catch blocks where you can't afford to have the error handler fail
   */
  public safeHandle(
    error: Error | AppError,
    context: RequestContext,
    fallbackMessage?: string
  ): NextResponse {
    try {
      // Return a Promise that resolves to NextResponse
      return NextResponse.json(
        ApiResponseBuilder.internalError(fallbackMessage || 'Internal server error', context),
        { status: 500 }
      );
    } catch {
      // Ultimate fallback - plain JSON response
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        },
        { status: 500 }
      );
    }
  }
}

// Validation error item interface
export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

// Singleton instance for easy access
export const errorHandler = ErrorHandler.getInstance();

// Utility functions that can be used in route handlers
export async function handleError(
  error: Error | AppError,
  context: RequestContext,
  fallbackMessage?: string
): Promise<NextResponse> {
  return errorHandler.handleError(error, context, fallbackMessage);
}

export async function handleApiError(
  error: Error | AppError,
  context: RequestContext,
  req?: any
): Promise<NextResponse> {
  return errorHandler.handleApiError(error, context, req);
}

export async function handleValidationError(
  errors: ValidationErrorItem[],
  context: RequestContext
): Promise<NextResponse> {
  return errorHandler.handleValidationError(errors, context);
}

// Authentication error function removed - public app

export async function handleNotFoundError(
  resource: string,
  identifier?: string,
  context?: RequestContext
): Promise<NextResponse> {
  return errorHandler.handleNotFoundError(resource, identifier, context);
}

export async function handleBusinessLogicError(
  message: string,
  context: RequestContext,
  details?: any
): Promise<NextResponse> {
  return errorHandler.handleBusinessLogicError(message, context, details);
}

// Helper function to check if an error is a known AppError type
export function isKnownError(error: any): error is AppError {
  return isAppError(error);
} 
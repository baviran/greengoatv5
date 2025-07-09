import { Logger } from './logger';

// HTTP Status Code Constants
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// Pagination interface
export interface PaginationInfo {
  total: number;
  count: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  OPENAI_ERROR: 'OPENAI_ERROR',
  AIRTABLE_ERROR: 'AIRTABLE_ERROR',
  FIREBASE_ERROR: 'FIREBASE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Core response interfaces
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  field?: string; // For validation errors
}

export interface ApiResponseMetadata {
  requestId: string;
  timestamp: string;
  duration?: number;
  pagination?: PaginationInfo;
  version?: string;
  [key: string]: any; // Allow additional metadata properties
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: ApiResponseMetadata;
}

// Context interface for request tracking
export interface RequestContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  component: string;
  action: string;
  startTime?: number;
}

// ApiResponseBuilder class
export class ApiResponseBuilder {
  private static logger = Logger.getInstance();
  
  /**
   * Create a successful response
   */
  static success<T>(
    data: T,
    context: RequestContext,
    metadata?: Partial<ApiResponseMetadata>
  ): ApiResponse<T> {
    const responseMetadata = this.buildMetadata(context, metadata);
    
    this.logger.info('API response success', this.extractLogContext(context), {
      responseType: 'success',
      dataSize: this.getDataSize(data)
    });
    
    return {
      success: true,
      data,
      metadata: responseMetadata
    };
  }
  
  /**
   * Create an error response
   */
  static error(
    code: ErrorCode,
    message: string,
    context: RequestContext,
    details?: any,
    field?: string,
    metadata?: Partial<ApiResponseMetadata>
  ): ApiResponse {
    const responseMetadata = this.buildMetadata(context, metadata);
    
    this.logger.error('API response error', new Error(message), this.extractLogContext(context), {
      responseType: 'error',
      errorCode: code,
      errorField: field,
      details
    });
    
    return {
      success: false,
      error: {
        code,
        message,
        details,
        field
      },
      metadata: responseMetadata
    };
  }
  
  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: PaginationInfo,
    context: RequestContext,
    metadata?: Partial<ApiResponseMetadata>
  ): ApiResponse<T[]> {
    const responseMetadata = this.buildMetadata(context, {
      ...metadata,
      pagination
    });
    
    this.logger.info('API response paginated', this.extractLogContext(context), {
      responseType: 'paginated',
      itemCount: data.length,
      totalItems: pagination.total,
      hasMore: pagination.hasMore
    });
    
    return {
      success: true,
      data,
      metadata: responseMetadata
    };
  }
  
  /**
   * Create a validation error response
   */
  static validationError(
    message: string,
    context: RequestContext,
    field?: string,
    details?: any
  ): ApiResponse {
    return this.error(
      ERROR_CODES.VALIDATION_ERROR,
      message,
      context,
      details,
      field
    );
  }
  
  /**
   * Create an unauthorized error response
   */
  static unauthorized(
    message: string = 'Authentication required',
    context: RequestContext,
    details?: any
  ): ApiResponse {
    return this.error(
      ERROR_CODES.UNAUTHENTICATED,
      message,
      context,
      details
    );
  }
  
  /**
   * Create a forbidden error response
   */
  static forbidden(
    message: string = 'Access denied',
    context: RequestContext,
    details?: any
  ): ApiResponse {
    return this.error(
      ERROR_CODES.UNAUTHORIZED,
      message,
      context,
      details
    );
  }
  
  /**
   * Create a not found error response
   */
  static notFound(
    message: string = 'Resource not found',
    context: RequestContext,
    details?: any
  ): ApiResponse {
    return this.error(
      ERROR_CODES.NOT_FOUND,
      message,
      context,
      details
    );
  }
  
  /**
   * Create a conflict error response
   */
  static conflict(
    message: string = 'Resource already exists',
    context: RequestContext,
    details?: any
  ): ApiResponse {
    return this.error(
      ERROR_CODES.ALREADY_EXISTS,
      message,
      context,
      details
    );
  }
  
  /**
   * Create an internal server error response
   */
  static internalError(
    message: string = 'Internal server error',
    context: RequestContext,
    details?: any
  ): ApiResponse {
    return this.error(
      ERROR_CODES.INTERNAL_ERROR,
      message,
      context,
      details
    );
  }
  
  /**
   * Build metadata for the response
   */
  private static buildMetadata(
    context: RequestContext,
    metadata?: Partial<ApiResponseMetadata>
  ): ApiResponseMetadata {
    return {
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      duration: context.startTime ? Date.now() - context.startTime : undefined,
      version: '1.0',
      ...metadata
    };
  }
  
  /**
   * Extract logging context from request context
   */
  private static extractLogContext(context: RequestContext) {
    return {
      userId: context.userId,
      userEmail: context.userEmail,
      component: context.component,
      action: context.action,
      requestId: context.requestId
    };
  }
  
  /**
   * Get data size for logging
   */
  private static getDataSize(data: any): string {
    if (Array.isArray(data)) {
      return `${data.length} items`;
    }
    if (typeof data === 'object' && data !== null) {
      return `${Object.keys(data).length} properties`;
    }
    if (typeof data === 'string') {
      return `${data.length} characters`;
    }
    return typeof data;
  }
}

// Helper function to generate request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to create request context
export function createRequestContext(
  component: string,
  action: string,
  userId?: string,
  userEmail?: string,
  requestId?: string
): RequestContext {
  return {
    requestId: requestId || generateRequestId(),
    userId,
    userEmail,
    component,
    action,
    startTime: Date.now()
  };
} 
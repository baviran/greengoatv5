import { ERROR_CODES, HTTP_STATUS } from '../utils/api-response';
import { Logger } from '../utils/logger';

// Base error class for all application errors
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  public readonly timestamp: Date;
  public readonly details?: any;
  public readonly field?: string;

  constructor(
    message: string,
    details?: any,
    field?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.details = details;
    this.field = field;
    
    // Ensure stack trace is captured
    Error.captureStackTrace(this, this.constructor);
  }

  // Convert to API response format
  toApiResponse() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      field: this.field
    };
  }

  // Log the error with context
  log(context?: any) {
    const logger = Logger.getInstance();
    logger.error(this.message, this, context, {
      errorCode: this.code,
      errorType: this.constructor.name,
      statusCode: this.statusCode,
      field: this.field,
      details: this.details,
      timestamp: this.timestamp.toISOString()
    });
  }
}

// Authentication and Authorization Errors
export class AuthenticationError extends AppError {
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED;
  readonly code = ERROR_CODES.UNAUTHENTICATED;
}

export class AuthorizationError extends AppError {
  readonly statusCode = HTTP_STATUS.FORBIDDEN;
  readonly code = ERROR_CODES.UNAUTHORIZED;
}

export class TokenExpiredError extends AppError {
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED;
  readonly code = ERROR_CODES.TOKEN_EXPIRED;
}

export class InvalidTokenError extends AppError {
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED;
  readonly code = ERROR_CODES.INVALID_TOKEN;
}

// Validation Errors
export class ValidationError extends AppError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;
  readonly code = ERROR_CODES.VALIDATION_ERROR;

  constructor(message: string, field?: string, details?: any) {
    super(message, details, field);
  }
}

export class MissingFieldError extends AppError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;
  readonly code = ERROR_CODES.MISSING_REQUIRED_FIELDS;

  constructor(field: string, details?: any) {
    super(`Missing required field: ${field}`, details, field);
  }
}

export class InvalidFormatError extends AppError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;
  readonly code = ERROR_CODES.INVALID_FORMAT;

  constructor(field: string, expectedFormat: string, details?: any) {
    super(`Invalid format for field '${field}'. Expected: ${expectedFormat}`, details, field);
  }
}

export class InvalidInputError extends AppError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;
  readonly code = ERROR_CODES.INVALID_INPUT;

  constructor(field: string, reason: string, details?: any) {
    super(`Invalid input for field '${field}': ${reason}`, details, field);
  }
}

// Resource Errors
export class NotFoundError extends AppError {
  readonly statusCode = HTTP_STATUS.NOT_FOUND;
  readonly code = ERROR_CODES.NOT_FOUND;

  constructor(resource: string, identifier?: string, details?: any) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, details);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = HTTP_STATUS.CONFLICT;
  readonly code = ERROR_CODES.ALREADY_EXISTS;

  constructor(resource: string, identifier?: string, details?: any) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' already exists`
      : `${resource} already exists`;
    super(message, details);
  }
}

export class ResourceConflictError extends AppError {
  readonly statusCode = HTTP_STATUS.CONFLICT;
  readonly code = ERROR_CODES.RESOURCE_CONFLICT;
}

// System Errors
export class InternalServerError extends AppError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  readonly code = ERROR_CODES.INTERNAL_ERROR;

  constructor(message: string = 'Internal server error', details?: any) {
    super(message, details);
  }
}

export class ServiceUnavailableError extends AppError {
  readonly statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
  readonly code = ERROR_CODES.SERVICE_UNAVAILABLE;

  constructor(service: string, details?: any) {
    super(`Service ${service} is currently unavailable`, details);
  }
}

export class RateLimitError extends AppError {
  readonly statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
  readonly code = ERROR_CODES.RATE_LIMIT_EXCEEDED;

  constructor(limit: number, window: string, details?: any) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, details);
  }
}

// External Service Errors
export class ExternalServiceError extends AppError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  readonly code = ERROR_CODES.EXTERNAL_SERVICE_ERROR;

  constructor(service: string, originalError?: any, details?: any) {
    super(`External service error: ${service}`, { originalError, ...details });
  }
}

export class OpenAIError extends AppError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  readonly code = ERROR_CODES.OPENAI_ERROR;

  constructor(message: string, details?: any) {
    super(`OpenAI API error: ${message}`, details);
  }
}

export class AirtableError extends AppError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  readonly code = ERROR_CODES.AIRTABLE_ERROR;

  constructor(message: string, details?: any) {
    super(`Airtable API error: ${message}`, details);
  }
}

export class FirebaseError extends AppError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  readonly code = ERROR_CODES.FIREBASE_ERROR;

  constructor(message: string, details?: any) {
    super(`Firebase error: ${message}`, details);
  }
}

// Business Logic Errors
export class BusinessLogicError extends AppError {
  readonly statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
  readonly code = ERROR_CODES.VALIDATION_ERROR;

  constructor(message: string, details?: any) {
    super(message, details);
  }
}

// Utility functions for error handling
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function createErrorFromStatusCode(statusCode: number, message: string, details?: any): AppError {
  switch (statusCode) {
    case HTTP_STATUS.UNAUTHORIZED:
      return new AuthenticationError(message, details);
    case HTTP_STATUS.FORBIDDEN:
      return new AuthorizationError(message, details);
    case HTTP_STATUS.NOT_FOUND:
      return new NotFoundError(message, undefined, details);
    case HTTP_STATUS.CONFLICT:
      return new ConflictError(message, undefined, details);
    case HTTP_STATUS.BAD_REQUEST:
      return new ValidationError(message, undefined, details);
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return new RateLimitError(0, 'unknown', details);
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return new ServiceUnavailableError(message, details);
    default:
      return new InternalServerError(message, details);
  }
}

export function mapErrorToApiResponse(error: Error | AppError, context?: any) {
  if (isAppError(error)) {
    // Log the error with context
    error.log(context);
    
    return {
      statusCode: error.statusCode,
      response: error.toApiResponse()
    };
  }
  
  // Handle non-AppError instances
  const logger = Logger.getInstance();
  logger.error('Non-AppError thrown', error, context, {
    errorType: error.constructor.name,
    message: error.message,
    stack: error.stack
  });
  
  // Convert to internal server error
  const internalError = new InternalServerError('Internal server error');
  
  return {
    statusCode: internalError.statusCode,
    response: internalError.toApiResponse()
  };
}

// Export all error types for easy imports
export const AppErrors = {
  // Base
  AppError,
  
  // Auth
  AuthenticationError,
  AuthorizationError,
  TokenExpiredError,
  InvalidTokenError,
  
  // Validation
  ValidationError,
  MissingFieldError,
  InvalidFormatError,
  InvalidInputError,
  
  // Resources
  NotFoundError,
  ConflictError,
  ResourceConflictError,
  
  // System
  InternalServerError,
  ServiceUnavailableError,
  RateLimitError,
  
  // External
  ExternalServiceError,
  OpenAIError,
  AirtableError,
  FirebaseError,
  
  // Business
  BusinessLogicError
}; 
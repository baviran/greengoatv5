import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from './firebase-admin';
import { Logger, LogContext } from '../app/lib/utils/logger';
import { userService } from '../app/lib/services/user-service';
import { ApiResponseBuilder, HTTP_STATUS, generateRequestId, createRequestContext as createApiRequestContext } from '../app/lib/utils/api-response';

const logger = Logger.getInstance();

// Request context type for enhanced logging
export interface RequestContext extends LogContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  startTime: number;
  method: string;
  url: string;
}

// Enhanced auth result with context
export interface AuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    isAdmin: boolean;
  };
  error?: string;
  context: RequestContext;
}

// Create request context from NextRequest
export function createRequestContext(req: NextRequest): RequestContext {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  return {
    requestId,
    startTime,
    method: req.method,
    url: req.url,
    component: 'auth-middleware',
    action: 'authenticate'
  };
}

// Enhanced authentication with context
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  const context = createRequestContext(req);
  
  // Log request start
  logger.requestStart(`${context.method} ${context.url}`, context);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = 'Missing or invalid authorization header';
      logger.warn('Authentication failed: missing auth header', context);
      return { 
        success: false, 
        error, 
        context 
      };
    }

    const token = authHeader.substring(7);
    const authResult = await authAdmin.verifyIdToken(token);
    
    // Add user context
    context.userId = authResult.uid;
    context.userEmail = authResult.email;
    
    logger.info('Token verified successfully', context, {
      uid: authResult.uid,
      email: authResult.email
    });

    // Check if user exists in our system
    const userValidation = await userService.validateUserAccess(authResult.email!);
    
    if (!userValidation.isValid) {
      const error = `User not found or access denied: ${userValidation.error}`;
      logger.warn('User validation failed', context, {
        validationError: userValidation.error
      });
      return { 
        success: false, 
        error, 
        context 
      };
    }

    const user = {
      uid: authResult.uid,
      email: authResult.email!,
      isAdmin: userValidation.user!.role === 'admin'
    };

    logger.info('User authenticated and authorized successfully', context, {
      role: userValidation.user!.role,
      isAdmin: user.isAdmin
    });

    return { 
      success: true, 
      user, 
      context 
    };

  } catch (error) {
    logger.error('Authentication error', error, context);
    return { 
      success: false, 
      error: 'Token verification failed', 
      context 
    };
  }
}

// Middleware wrapper that adds request context to any API handler
export function withRequestContext<T extends any[]>(
  handler: (req: NextRequest, context: RequestContext, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = createRequestContext(req);
    
    try {
      logger.requestStart(`${context.method} ${context.url}`, context);
      const response = await handler(req, context, ...args);
      logger.requestEnd(`${context.method} ${context.url} completed`, context.startTime, context, {
        status: response.status
      });
      return response;
    } catch (error) {
      logger.error(`${context.method} ${context.url} failed`, error, context);
      logger.requestEnd(`${context.method} ${context.url} failed`, context.startTime, context, {
        status: 500
      });
      throw error;
    }
  };
}

// Enhanced auth middleware with context
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, authResult: AuthResult, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await authenticateRequest(req);
    
    if (!authResult.success) {
      logger.requestEnd(`${authResult.context.method} ${authResult.context.url} authentication failed`, 
        authResult.context.startTime, authResult.context, {
        status: 401,
        error: authResult.error
      });
      
      // Use unified response format
      const apiContext = createApiRequestContext(
        'auth-middleware',
        'authenticate',
        authResult.context.userId,
        authResult.context.userEmail,
        authResult.context.requestId
      );
      
      const errorResponse = ApiResponseBuilder.unauthorized(
        authResult.error || 'Authentication failed',
        apiContext
      );
      
      return NextResponse.json(errorResponse, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    try {
      const response = await handler(req, authResult, ...args);
      logger.requestEnd(`${authResult.context.method} ${authResult.context.url} completed`, 
        authResult.context.startTime, authResult.context, {
        status: response.status
      });
      return response;
    } catch (error) {
      logger.error(`${authResult.context.method} ${authResult.context.url} handler failed`, 
        error, authResult.context);
      logger.requestEnd(`${authResult.context.method} ${authResult.context.url} failed`, 
        authResult.context.startTime, authResult.context, {
        status: 500
      });
      
      // Use unified response format for internal errors
      const apiContext = createApiRequestContext(
        'auth-middleware',
        'handle-request',
        authResult.context.userId,
        authResult.context.userEmail,
        authResult.context.requestId
      );
      
      const errorResponse = ApiResponseBuilder.internalError(
        'Internal server error',
        apiContext
      );
      
      return NextResponse.json(errorResponse, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
  };
}

// Legacy functions for backward compatibility
export async function verifyAuth(req: NextRequest) {
  const context = createRequestContext(req);
  
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Auth verification failed: missing auth header', context);
      return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const authResult = await authAdmin.verifyIdToken(token);
    
    logger.info('Token verified successfully', { ...context, userId: authResult.uid });
    return { success: true, user: authResult };
  } catch (error) {
    logger.error('Auth verification failed', error, context);
    return { success: false, error: 'Token verification failed' };
  }
}

export async function verifyAuthWithUserValidation(req: NextRequest) {
  const context = createRequestContext(req);
  
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Enhanced auth verification failed: missing auth header', context);
      return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const authResult = await authAdmin.verifyIdToken(token);
    
    if (!authResult.email) {
      logger.warn('User access denied: no email in token', { ...context, userId: authResult.uid });
      return { success: false, error: 'User token does not contain email' };
    }

    const userValidation = await userService.validateUserAccess(authResult.email);
    
    if (!userValidation.isValid) {
      logger.warn('User access denied: validation failed', { 
        ...context, 
        userId: authResult.uid,
        userEmail: authResult.email
      }, {
        validationError: userValidation.error
      });
      return { success: false, error: userValidation.error };
    }

    logger.info('User authenticated and authorized successfully', { 
      ...context, 
      userId: authResult.uid,
      userEmail: authResult.email
    }, {
      role: userValidation.user!.role
    });

    return { 
      success: true, 
      user: authResult, 
      firestoreUser: userValidation.user 
    };

  } catch (error) {
    logger.error('Enhanced auth verification failed', error, context);
    return { success: false, error: 'Token verification failed' };
  }
}

// Legacy authentication middleware for backward compatibility
export function authMiddleware(handler: (req: NextRequest, user: any, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    const context = createRequestContext(req);
    
    try {
      const authResult = await verifyAuth(req);
      
      if (!authResult.success) {
        logger.warn('Authentication middleware: auth failed', context, {
          error: authResult.error
        });
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      const enhancedContext = { ...context, userId: authResult.user?.uid };
      logger.info('Authentication middleware: auth successful', enhancedContext);
      
      return handler(req, authResult.user, ...args);
    } catch (error) {
      logger.error('Authentication middleware error', error, context);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}

// Legacy enhanced authentication middleware
export function enhancedAuthMiddleware(handler: (req: NextRequest, user: any, firestoreUser: any, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    const context = createRequestContext(req);
    
    try {
      const authResult = await verifyAuthWithUserValidation(req);
      
      if (!authResult.success) {
        logger.warn('Enhanced authentication middleware: auth failed', context, {
          error: authResult.error
        });
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      const enhancedContext = { 
        ...context, 
        userId: authResult.user?.uid,
        userEmail: authResult.user?.email
      };
      logger.info('Enhanced authentication middleware: auth successful', enhancedContext);
      
      return handler(req, authResult.user, authResult.firestoreUser, ...args);
    } catch (error) {
      logger.error('Enhanced authentication middleware error', error, context);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
} 
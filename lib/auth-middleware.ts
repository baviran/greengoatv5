import { NextRequest } from 'next/server';
import { authAdmin } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { userService } from '@/app/lib/services/user-service';
import { User } from '@/app/types/user';

export interface AuthenticatedRequest extends NextRequest {
  user?: DecodedIdToken;
}

export interface AuthResult {
  success: boolean;
  user?: DecodedIdToken;
  error?: string;
}

export interface EnhancedAuthResult {
  success: boolean;
  firebaseUser?: DecodedIdToken;
  firestoreUser?: User;
  error?: string;
  errorType?: 'unauthorized' | 'forbidden' | 'internal';
}

/**
 * Middleware to verify Firebase ID tokens from request headers
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No authorization token provided'
      };
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return {
        success: false,
        error: 'Invalid authorization format'
      };
    }

    // Verify the token with Firebase Admin
    const decodedToken = await authAdmin.verifyIdToken(token);
    
    return {
      success: true,
      user: decodedToken
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

/**
 * Enhanced authentication with user validation
 */
export async function verifyAuthWithUser(request: NextRequest): Promise<EnhancedAuthResult> {
  try {
    // Step 1: Verify Firebase token
    const authResult = await verifyAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return {
        success: false,
        error: authResult.error || 'Authentication required',
        errorType: 'unauthorized'
      };
    }

    // Step 2: Validate user exists in Firestore by email
    const userEmail = authResult.user.email;
    if (!userEmail) {
      console.warn(`🚫 User access denied: ${authResult.user.uid} - No email in token`);
      return {
        success: false,
        error: 'User email not found',
        errorType: 'forbidden'
      };
    }

    const userValidation = await userService.validateUserAccess(userEmail);
    
    if (!userValidation.isValid) {
      console.warn(`🚫 User access denied: ${authResult.user.uid} (${userEmail}) - ${userValidation.error}`);
      return {
        success: false,
        error: userValidation.error || 'Access denied',
        errorType: 'forbidden'
      };
    }

    console.log(`✅ User authenticated and authorized: ${authResult.user.uid} (${userEmail})`);
    
    return {
      success: true,
      firebaseUser: authResult.user,
      firestoreUser: userValidation.user
    };
  } catch (error) {
    console.error('Enhanced auth verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      errorType: 'internal'
    };
  }
}

/**
 * Helper function to get user from request or throw error
 */
export async function requireAuth(request: NextRequest): Promise<DecodedIdToken> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.success || !authResult.user) {
    throw new Error(authResult.error || 'Authentication required');
  }
  
  return authResult.user;
}

/**
 * Enhanced helper function to get validated user from request or throw error
 */
export async function requireAuthWithUser(request: NextRequest): Promise<{
  firebaseUser: DecodedIdToken;
  firestoreUser: User;
}> {
  const authResult = await verifyAuthWithUser(request);
  
  if (!authResult.success || !authResult.firebaseUser || !authResult.firestoreUser) {
    const error = new Error(authResult.error || 'Authentication required');
    (error as any).statusCode = authResult.errorType === 'forbidden' ? 403 : 401;
    throw error;
  }
  
  return {
    firebaseUser: authResult.firebaseUser,
    firestoreUser: authResult.firestoreUser
  };
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: DecodedIdToken, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireAuth(request);
      return await handler(request, user, ...args);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

/**
 * Enhanced middleware wrapper for API routes that require authentication AND user validation
 */
export function withAuthAndUser<T extends any[]>(
  handler: (request: NextRequest, firebaseUser: DecodedIdToken, firestoreUser: User, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const { firebaseUser, firestoreUser } = await requireAuthWithUser(request);
      return await handler(request, firebaseUser, firestoreUser, ...args);
    } catch (error) {
      console.error('Enhanced authentication middleware error:', error);
      
      // Check if error has a custom status code
      const statusCode = (error as any).statusCode || 401;
      const errorMessage = statusCode === 403 ? 'Access denied' : 'Authentication required';
      
      return Response.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
  };
} 
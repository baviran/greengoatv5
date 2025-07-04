import { NextRequest } from 'next/server';
import { authAdmin } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: DecodedIdToken;
}

export interface AuthResult {
  success: boolean;
  user?: DecodedIdToken;
  error?: string;
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
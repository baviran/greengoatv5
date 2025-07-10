'use client';

import React, { useState, useEffect } from 'react';
import { useAppAuth } from '../../lib/store/appStore';
import { SignInButton } from './SignInButton';
import { Logger } from '@/app/lib/utils/logger';
import { withErrorBoundary } from '@/app/components/error-boundary/ErrorBoundary';

const logger = Logger.getInstance().withContext({
  component: 'auth-guard'
});

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  showAutoSignout?: boolean;
}

type UserValidationStatus = 'loading' | 'valid' | 'invalid' | 'error';

// Cache for user validation results to avoid repeated API calls
const userValidationCache = new Map<string, {
  status: UserValidationStatus;
  error: string;
  timestamp: number;
}>();

const VALIDATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const AuthGuardComponent: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  requireAuth = true,
  showAutoSignout = true
}) => {
  const { user, isLoading: loading, isInitialized } = useAppAuth();
  
  // Clear validation cache when user changes
  React.useEffect(() => {
    if (user?.uid) {
      // Clear any cached validation errors for this user
      userValidationCache.delete(user.uid);
    }
  }, [user?.uid]);
  
  // Helper functions for auth operations
  const getIdToken = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      
      logger.debug('Getting ID token', undefined, {
        hasCurrentUser: !!currentUser,
        currentUserUid: currentUser?.uid
      });
      
      if (currentUser) {
        const token = await currentUser.getIdToken(true);
        logger.debug('ID token retrieved', undefined, {
          hasToken: !!token,
          tokenLength: token ? token.length : 0
        });
        return token;
      }
      
      logger.debug('No current user for ID token');
      return null;
    } catch (error) {
      logger.error('Error getting ID token', error);
      return null;
    }
  };
  
  const signOut = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      await auth.signOut();
    } catch (error) {
      logger.error('Error signing out', error);
    }
  };
  const [userValidationStatus, setUserValidationStatus] = useState<UserValidationStatus>('loading');
  const [validationError, setValidationError] = useState<string>('');

  // Check user validation in Firestore when user changes
  useEffect(() => {
    const checkUserValidation = async () => {
      // Wait for auth store to be initialized before proceeding
      if (!isInitialized) {
        setUserValidationStatus('loading');
        return;
      }

      if (!user) {
        setUserValidationStatus('loading');
        return;
      }

      // Check cache first
      const cached = userValidationCache.get(user.uid);
      if (cached && (Date.now() - cached.timestamp) < VALIDATION_CACHE_DURATION) {
        setUserValidationStatus(cached.status);
        setValidationError(cached.error);
        return;
      }

      // Add a delay to allow Firebase auth to fully restore session
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        const token = await getIdToken();
        if (!token) {
          // Retry once after a short delay
          setTimeout(async () => {
            try {
              const retryToken = await getIdToken();
              if (retryToken) {
                // If we get a token on retry, try validation again
                const retryResponse = await fetch('/api/user/validate', {
                  headers: {
                    'Authorization': `Bearer ${retryToken}`
                  }
                });
                
                if (retryResponse.ok) {
                  const successResult = {
                    status: 'valid' as UserValidationStatus,
                    error: '',
                    timestamp: Date.now()
                  };
                  userValidationCache.set(user.uid, successResult);
                  setUserValidationStatus('valid');
                  setValidationError('');
                  return;
                }
              }
            } catch (retryError) {
              logger.error('Retry validation error', retryError);
            }
            
            // If retry still fails, show error
            const errorResult = {
              status: 'error' as UserValidationStatus,
              error: 'Failed to get authentication token',
              timestamp: Date.now()
            };
            userValidationCache.set(user.uid, errorResult);
            setUserValidationStatus('error');
            setValidationError('Failed to get authentication token');
          }, 2000); // Wait 2 seconds before retry
          
          return;
        }

        // Make a simple API call to check user validation
        const response = await fetch('/api/user/validate', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        let result: { status: UserValidationStatus; error: string; timestamp: number };

        if (response.ok) {
          result = {
            status: 'valid',
            error: '',
            timestamp: Date.now()
          };
        } else if (response.status === 403) {
          result = {
            status: 'invalid',
            error: 'Access denied: Your account is not authorized to use this application',
            timestamp: Date.now()
          };
        } else {
          result = {
            status: 'error',
            error: 'Failed to validate user access',
            timestamp: Date.now()
          };
        }

        // Cache the result
        userValidationCache.set(user.uid, result);
        setUserValidationStatus(result.status);
        setValidationError(result.error);

      } catch (error) {
        logger.error('User validation error', error, undefined, {
          userId: user?.uid,
          userEmail: user?.email,
          action: 'validate-user-access'
        });
        
        const errorResult = {
          status: 'error' as UserValidationStatus,
          error: 'Failed to validate user access',
          timestamp: Date.now()
        };
        userValidationCache.set(user.uid, errorResult);
        setUserValidationStatus('error');
        setValidationError('Failed to validate user access');
      }
    };

    if (user && requireAuth && isInitialized) {
      // Check cache and show cached result immediately if valid
      const cached = userValidationCache.get(user.uid);
      if (cached && (Date.now() - cached.timestamp) < VALIDATION_CACHE_DURATION) {
        setUserValidationStatus(cached.status);
        setValidationError(cached.error);
      } else {
        checkUserValidation();
      }
    } else if (!user || !isInitialized) {
      setUserValidationStatus('loading');
    }
  }, [user, requireAuth, isInitialized]); // Added isInitialized to dependencies

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      logger.error('Error signing out', error, undefined, {
        userId: user?.uid,
        userEmail: user?.email,
        action: 'sign-out'
      });
    }
  };

  // Show loading while Firebase auth is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show sign-in prompt if no user
  if (requireAuth && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-32 p-6">
        {fallback || (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4 text-center">
              Please sign in to access this feature
            </p>
            <SignInButton />
          </>
        )}
      </div>
    );
  }

  // Show loading while validating user in Firestore
  if (requireAuth && user && userValidationStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show access denied for unauthorized users
  if (requireAuth && user && userValidationStatus === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-32 p-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Access Denied</h2>
        <p className="text-gray-600 mb-4 text-center">
          {validationError || 'Your account is not authorized to access this application.'}
        </p>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Contact your administrator to request access.
        </p>
        {showAutoSignout && (
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>
    );
  }

  // Show error state
  if (requireAuth && user && userValidationStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-32 p-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Validation Error</h2>
        <p className="text-gray-600 mb-4 text-center">
          {validationError || 'Unable to validate your access. Please try again.'}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Retry
          </button>
          {showAutoSignout && (
            <button
              onClick={handleSignOut}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    );
  }

  // User is authenticated and validated
  return <>{children}</>;
};

// Wrap with error boundary
export const AuthGuard = withErrorBoundary(AuthGuardComponent, {
  onError: (error, errorInfo) => {
    logger.error('AuthGuard error boundary triggered', error, {
      component: 'auth-guard',
      action: 'auth-error'
    }, {
      errorInfo: errorInfo.componentStack
    });
  }
}); 
'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/auth-context';
import { SignInButton } from './SignInButton';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  showAutoSignout?: boolean;
}

type UserValidationStatus = 'loading' | 'valid' | 'invalid' | 'error';

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  requireAuth = true,
  showAutoSignout = true
}) => {
  const { user, loading, signOut, getIdToken } = useAuthContext();
  const [userValidationStatus, setUserValidationStatus] = useState<UserValidationStatus>('loading');
  const [validationError, setValidationError] = useState<string>('');

  // Check user validation in Firestore when user changes
  useEffect(() => {
    const checkUserValidation = async () => {
      if (!user) {
        setUserValidationStatus('loading');
        return;
      }

      try {
        const token = await getIdToken();
        if (!token) {
          setUserValidationStatus('error');
          setValidationError('Failed to get authentication token');
          return;
        }

        // Make a simple API call to check user validation
        const response = await fetch('/api/user/validate', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setUserValidationStatus('valid');
          setValidationError('');
        } else if (response.status === 403) {
          setUserValidationStatus('invalid');
          setValidationError('Access denied: Your account is not authorized to use this application');
        } else {
          setUserValidationStatus('error');
          setValidationError('Failed to validate user access');
        }
      } catch (error) {
        console.error('User validation error:', error);
        setUserValidationStatus('error');
        setValidationError('Failed to validate user access');
      }
    };

    if (user && requireAuth) {
      checkUserValidation();
    } else if (!user) {
      setUserValidationStatus('loading');
    }
  }, [user, requireAuth, getIdToken]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
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
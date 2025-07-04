'use client';

import React from 'react';
import { useAuthContext } from '@/context/auth-context';
import { SignInButton } from './SignInButton';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  requireAuth = true 
}) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  return <>{children}</>;
}; 
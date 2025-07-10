'use client';

import React from 'react';
import { useAppAuth } from '../../lib/store/appStore';
import { Icon } from '@/app/components/icons';
import { UserProfile } from './UserProfile';

interface SignInButtonProps {
  className?: string;
  variant?: 'default' | 'outline';
}

export const SignInButton: React.FC<SignInButtonProps> = ({ 
  className = '', 
  variant = 'default' 
}) => {
  const { user, isAuthenticated, isLoading: loading, error } = useAppAuth();

  // If user is authenticated, show their profile instead
  if (isAuthenticated && user) {
    return <UserProfile className={className} />;
  }
  
  // Helper function for Google sign in
  const signInWithGoogle = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const baseStyles = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors";
  const variantStyles = {
    default: "bg-primary hover:bg-primary/90 text-primary-foreground",
    outline: "border border-border hover:bg-muted text-foreground"
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className={`${baseStyles} ${variantStyles[variant]} ${className} ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        dir="rtl"
      >
        {loading ? (
          <Icon name="loader2" className="w-5 h-5 animate-spin" />
        ) : (
          <Icon name="google" className="w-5 h-5" />
        )}
        <span>{loading ? 'מתחבר...' : 'התחבר עם Google'}</span>
      </button>
      {error && (
        <p className="text-red-500 text-sm max-w-xs text-center" dir="rtl">
          {error}
        </p>
      )}
    </div>
  );
}; 
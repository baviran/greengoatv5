'use client';

import React from 'react';
import { useAppAuth } from '../../lib/store/appStore';
import { Icon } from '@/app/components/icons';
import { UserProfile } from './UserProfile';
import { Logger } from '@/app/lib/utils/logger';

interface SignInButtonProps {
  className?: string;
  variant?: 'default' | 'outline';
}

export const SignInButton: React.FC<SignInButtonProps> = ({ 
  className = '', 
  variant = 'default' 
}) => {
  const { user, isAuthenticated, isLoading: loading, error } = useAppAuth();
  const logger = Logger.getInstance();

  // If user is authenticated, show their profile instead
  if (isAuthenticated && user) {
    return <UserProfile className={className} />;
  }
  
  // Helper function for Google sign in with environment-aware strategy
  const signInWithGoogle = async () => {
    const context = {
      component: 'sign-in-button',
      action: 'google-sign-in'
    };

    try {
      const { auth } = await import('@/lib/firebase');
      const { signInWithRedirect, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      logger.info('Sign-in button clicked', context, {
        environment: isProduction ? 'Production' : 'Development',
        strategy: isProduction ? 'Redirect' : 'Popup',
        currentUser: auth.currentUser?.uid || 'None',
        currentUrl: window.location.href,
        domain: window.location.hostname,
        expectedAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      });
      
      if (isProduction) {
        // In production, use redirect to avoid COOP issues
        logger.info('Using redirect authentication for production', context, {
          firebaseConfig: {
            apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
          }
        });
        
        await signInWithRedirect(auth, provider);
        logger.info('Redirect initiated successfully', context);
      } else {
        // In development, use popup for better developer experience
        logger.info('Using popup authentication for development', context);
        try {
          const result = await signInWithPopup(auth, provider);
          logger.info('Popup authentication successful', context, {
            userEmail: result.user.email,
            userDetails: {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              emailVerified: result.user.emailVerified
            }
          });
                  } catch (popupError: any) {
            logger.warn('Popup authentication failed, trying redirect as fallback', context, {
              errorCode: popupError.code,
              errorMessage: popupError.message
            });
            await signInWithRedirect(auth, provider);
          }
      }
    } catch (error: any) {
      logger.error('Error signing in with Google', error, context, {
        errorCode: error.code,
        errorMessage: error.message
      });
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "group relative flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] text-base min-w-[160px]";
    
    if (variant === 'outline') {
      return `${baseStyles} bg-card border-2 border-border text-card-foreground hover:border-accent hover:bg-muted`;
    }
    
    // Default variant using your custom color tokens
    return `${baseStyles} bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary hover:border-primary/90 focus:ring-4 focus:ring-accent/30`;
  };

  const getLoadingStyles = () => {
    return loading ? 'opacity-60 cursor-not-allowed transform-none hover:scale-100' : '';
  };

  const getIconStyles = () => {
    return `w-5 h-5 transition-transform duration-200 ${loading ? 'animate-spin' : 'group-hover:scale-110'}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className={`${getButtonStyles()} ${getLoadingStyles()} ${className}`}
        dir="rtl"
        aria-label="התחבר עם Google"
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <Icon name="loader2" className={getIconStyles()} />
          ) : (
            <div className="bg-card rounded-full p-1 shadow-sm">
              <Icon name="google" className="w-4 h-4 text-card-foreground" />
            </div>
          )}
          <span className="font-semibold tracking-wide">
            {loading ? 'מתחבר...' : 'התחבר'}
          </span>
        </div>
      </button>
      
      {error && (
        <div className="bg-muted border border-border rounded-lg p-3 max-w-xs">
          <p className="text-foreground text-sm text-center font-medium" dir="rtl">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}; 
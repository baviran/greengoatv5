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
  
  // Helper function for Google sign in with environment-aware strategy
  const signInWithGoogle = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      const { signInWithRedirect, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      console.log('🔐 Sign-in button clicked');
      console.log('🏢 Environment:', isProduction ? 'Production' : 'Development');
      console.log('🎯 Authentication strategy:', isProduction ? 'Redirect' : 'Popup');
      console.log('🔧 Current Firebase user:', auth.currentUser?.uid || 'None');
      console.log('🌐 Current URL:', window.location.href);
      console.log('🏠 Current domain:', window.location.hostname);
      console.log('🔗 Expected auth domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
      
      if (isProduction) {
        // In production, use redirect to avoid COOP issues
        console.log('🔄 Using redirect authentication for production');
        console.log('🔧 Firebase config check:', {
          apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        });
        
        await signInWithRedirect(auth, provider);
        console.log('✅ Redirect initiated successfully');
      } else {
        // In development, use popup for better developer experience
        console.log('🪟 Using popup authentication for development');
        try {
          const result = await signInWithPopup(auth, provider);
          console.log('✅ Popup authentication successful:', result.user.email);
          console.log('🎫 User details:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified
          });
        } catch (popupError: any) {
          console.warn('❌ Popup authentication failed, trying redirect as fallback:', popupError);
          console.log('🔧 Popup error details:', {
            code: popupError.code,
            message: popupError.message
          });
          await signInWithRedirect(auth, provider);
        }
      }
    } catch (error: any) {
      console.error('💥 Error signing in with Google:', error);
      console.log('🔧 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
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
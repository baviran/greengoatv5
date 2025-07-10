'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithRedirect, signInWithPopup, signOut, AuthError, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Logger } from '@/app/lib/utils/logger';

const logger = Logger.getInstance();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      logger.info('AuthContext: Firebase auth state changed', {
        component: 'auth-context',
        action: 'auth-state-change'
      }, {
        hasUser: !!user,
        userId: user?.uid,
        email: user?.email
      });
      
      setUser(user);
      setLoading(false);
    });
    
    // Handle redirect result on app initialization - PRIORITY
    const handleRedirectResult = async () => {
      try {
        logger.info('AuthContext: Checking for redirect result', {
          component: 'auth-context',
          action: 'check-redirect-result'
        });
        
        const result = await getRedirectResult(auth);
        if (result) {
          logger.info('AuthContext: Google sign-in successful via redirect', {
            component: 'auth-context',
            action: 'sign-in-redirect-success',
            userId: result.user.uid,
            userEmail: result.user.email || undefined
          });
          
          // Clear any existing errors
          setError(null);
          setLoading(false);
        } else {
          logger.info('AuthContext: No redirect result found', {
            component: 'auth-context',
            action: 'no-redirect-result'
          });
        }
      } catch (error) {
        const authError = error as AuthError;
        logger.error('AuthContext: Google sign-in redirect error', authError, {
          component: 'auth-context',
          action: 'sign-in-redirect-error'
        });
        
        setError(authError.message);
        setLoading(false);
      }
    };

    // Handle redirect result immediately
    handleRedirectResult();
    
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // In production, use redirect to avoid COOP issues
        logger.info('Using redirect authentication for production', {
          component: 'auth-context',
          action: 'sign-in-redirect'
        });
        await signInWithRedirect(auth, googleProvider);
      } else {
        // In development, use popup for better developer experience
        logger.info('Using popup authentication for development', {
          component: 'auth-context',
          action: 'sign-in-popup'
        });
        
        try {
          const result = await signInWithPopup(auth, googleProvider);
          
          logger.info('Google sign-in successful via popup', {
            component: 'auth-context',
            action: 'sign-in-popup-success',
            userId: result.user.uid,
            userEmail: result.user.email || undefined
          });
        } catch (popupError) {
          // Fallback to redirect if popup fails in development
          logger.warn('Popup authentication failed, trying redirect as fallback', {
            component: 'auth-context',
            action: 'sign-in-fallback'
          }, { popupError });
          
          await signInWithRedirect(auth, googleProvider);
        }
      }
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      logger.error('Google sign-in error', authError, {
        component: 'auth-context',
        action: 'sign-in'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const userId = user?.uid;
      const userEmail = user?.email || undefined;
      
      await signOut(auth);
      
      logger.info('User signed out successfully', {
        component: 'auth-context',
        action: 'sign-out',
        userId,
        userEmail
      });
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      logger.error('Sign-out error', authError, {
        component: 'auth-context',
        action: 'sign-out',
        userId: user?.uid,
        userEmail: user?.email || undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken(true);
    } catch (error) {
      logger.error('Error getting ID token', error, {
        component: 'auth-context',
        action: 'get-id-token',
        userId: user?.uid,
        userEmail: user?.email || undefined
      });
      return null;
    }
  };

  const value = { 
    user, 
    loading, 
    error, 
    signInWithGoogle, 
    signOut: handleSignOut, 
    getIdToken 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  return useContext(AuthContext);
};
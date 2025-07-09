'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut, AuthError } from 'firebase/auth';
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
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      
      logger.info('Google sign-in successful', {
        component: 'auth-context',
        action: 'sign-in',
        userId: result.user.uid,
        userEmail: result.user.email || undefined
      });
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
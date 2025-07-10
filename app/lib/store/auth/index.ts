// Auth domain exports
export * from './authStore';
export * from './userStore';

// Re-export types for convenience
export type { 
  AuthState, 
  AuthActions, 
  UserState, 
  UserActions, 
  UserContext, 
  UserProfile, 
  UserPreferences 
} from '../types';

import { useAuthStore } from './authStore';
import { useUserStore } from './userStore';

// Composite auth selectors
export const compositeAuthSelectors = {
  // Get complete auth state
  getAuthState: () => {
    return {
      auth: useAuthStore.getState(),
      user: useUserStore.getState()
    };
  },
  
  // Check if user is ready (authenticated and profile loaded)
  isUserReady: () => {
    const authState = useAuthStore.getState();
    const userState = useUserStore.getState();
    
    return authState.isAuthenticated && 
           authState.isInitialized && 
           userState.isInitialized;
  },
  
  // Get complete user info
  getCompleteUserInfo: () => {
    const authState = useAuthStore.getState();
    const userState = useUserStore.getState();
    
    return {
      auth: authState.user,
      profile: userState.profile,
      preferences: userState.preferences,
      isReady: authState.isAuthenticated && userState.isInitialized
    };
  }
};

// Composite auth actions
export const compositeAuthActions = {
  // Complete sign out (both auth and user stores)
  signOut: async () => {
    await useAuthStore.getState().signOut();
    useUserStore.getState().reset();
  },
  
  // Initialize auth domain
  initialize: () => {
    useAuthStore.getState().initialize();
    useUserStore.getState().initialize();
  },
  
  // Complete reset of auth domain
  reset: () => {
    useAuthStore.getState().reset();
    useUserStore.getState().reset();
  }
};

// Composite hooks for auth domain
export const useAuthDomain = () => {
  return {
    auth: useAuthStore(),
    user: useUserStore(),
    actions: compositeAuthActions,
    selectors: compositeAuthSelectors
  };
};

// Shorthand hooks for common auth operations
export const useAuth = () => {
  return useAuthStore();
};

export const useUser = () => {
  return useUserStore();
}; 
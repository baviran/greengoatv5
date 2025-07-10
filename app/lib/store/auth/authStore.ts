import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AuthState, AuthActions, UserContext } from '../types';
import { Logger } from '../../utils/logger';
import { StorePersistence, persistenceConfigs } from '../persistence';
import { eventEmitter, createStoreEvent, monitorStorePerformance } from '../utils';

const logger = Logger.getInstance().withContext({
  component: 'auth-store'
});

const persistence = StorePersistence.getInstance();

// Default state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  lastUpdated: 0
};

// Auth store implementation
const authStoreImpl = create<AuthState & AuthActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Base actions
    initialize: () => {
      if (get().isInitialized) return;
      
      logger.info('Initializing auth store');
      
      const persistedState = persistence.getPersistedState(persistenceConfigs.auth);
      
      if (persistedState) {
        set({
          ...persistedState,
          isInitialized: true,
          lastUpdated: Date.now()
        });
      } else {
        set({
          isInitialized: true,
          lastUpdated: Date.now()
        });
      }
      
      // Emit initialization event
      eventEmitter.emit(createStoreEvent('auth:initialized', get(), 'auth-store'));
    },

    reset: () => {
      logger.info('Resetting auth store');
      
      set({
        ...initialState,
        isInitialized: true,
        lastUpdated: Date.now()
      });
      
      // Clear persisted state
      persistence.clearPersistedState(persistenceConfigs.auth);
      
      // Emit reset event
      eventEmitter.emit(createStoreEvent('auth:reset', null, 'auth-store'));
    },

    // Auth-specific actions
    setUser: (user: UserContext | null) => {
      const previousUser = get().user;
      
      logger.info('Setting user', undefined, {
        hasUser: !!user,
        userId: user?.uid,
        wasAuthenticated: !!previousUser
      });
      
      const newState = {
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      };
      
      set(newState);
      
      // Persist state
      persistence.persistState(persistenceConfigs.auth, { ...get() });
      
      // Emit user change event
      eventEmitter.emit(createStoreEvent('auth:user-changed', {
        user,
        previousUser,
        isAuthenticated: !!user
      }, 'auth-store'));
      
      // If user logged out, clear user-specific data
      if (!user && previousUser) {
        persistence.clearUserData(previousUser.uid);
        eventEmitter.emit(createStoreEvent('auth:user-logged-out', {
          previousUser
        }, 'auth-store'));
      }
    },

    updateToken: (token: string) => {
      const user = get().user;
      if (!user) {
        logger.warn('Attempted to update token without user');
        return;
      }
      
      logger.debug('Updating user token', undefined, {
        userId: user.uid,
        hasToken: !!token
      });
      
      const updatedUser = { ...user, token };
      
      set({
        user: updatedUser,
        lastUpdated: Date.now()
      });
      
      // Persist state
      persistence.persistState(persistenceConfigs.auth, { ...get() });
      
      // Emit token update event
      eventEmitter.emit(createStoreEvent('auth:token-updated', {
        userId: user.uid,
        hasToken: !!token
      }, 'auth-store'));
    },

    setLoading: (loading: boolean) => {
      set({
        isLoading: loading,
        lastUpdated: Date.now()
      });
    },

    setError: (error: string | null) => {
      if (error) {
        logger.error('Auth error set', new Error(error), undefined, {
          hasError: !!error
        });
      } else {
        logger.info('Auth error cleared', undefined, {
          hasError: !!error
        });
      }
      
      set({
        error,
        isLoading: false,
        lastUpdated: Date.now()
      });
      
      // Emit error event
      if (error) {
        eventEmitter.emit(createStoreEvent('auth:error', { error }, 'auth-store'));
      }
    },

    signOut: async () => {
      const user = get().user;
      
      logger.info('Signing out user', undefined, {
        userId: user?.uid
      });
      
      set({
        isLoading: true,
        lastUpdated: Date.now()
      });
      
      try {
        // Import Firebase auth to sign out
        if (typeof window !== 'undefined') {
          const { auth } = await import('@/lib/firebase');
          await auth.signOut();
        }
        
        // Clear user data
        if (user) {
          persistence.clearUserData(user.uid);
        }
        
        // Reset state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        });
        
        // Clear persisted state
        persistence.clearPersistedState(persistenceConfigs.auth);
        
        // Emit sign out event
        eventEmitter.emit(createStoreEvent('auth:signed-out', {
          previousUser: user
        }, 'auth-store'));
        
        logger.info('User signed out successfully', undefined, {
          userId: user?.uid
        });
        
      } catch (error) {
        logger.error('Sign out failed', error as Error, undefined, {
          userId: user?.uid
        });
        
        set({
          error: 'Sign out failed',
          isLoading: false,
          lastUpdated: Date.now()
        });
        
        throw error;
      }
    }
  }))
);

// Add performance monitoring (now fixed)
const authStore = monitorStorePerformance('auth-store')(authStoreImpl);

// Export the auth store BEFORE any subscriptions or initialization
export const useAuthStore = authStore;
export default authStore;

// Subscribe to auth state changes for additional side effects
authStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated, previousIsAuthenticated) => {
    if (isAuthenticated !== previousIsAuthenticated) {
      logger.info('Authentication state changed', undefined, {
        isAuthenticated,
        previousIsAuthenticated
      });
    }
  }
);

// Selectors for performance optimization
export const authSelectors = {
  user: (state: AuthState & AuthActions) => state.user,
  isAuthenticated: (state: AuthState & AuthActions) => state.isAuthenticated,
  isLoading: (state: AuthState & AuthActions) => state.isLoading,
  error: (state: AuthState & AuthActions) => state.error,
  isInitialized: (state: AuthState & AuthActions) => state.isInitialized,
  
  // Computed selectors
  userDisplayName: (state: AuthState & AuthActions) => 
    state.user?.displayName || state.user?.email || 'Unknown User',
  
  hasValidToken: (state: AuthState & AuthActions) => 
    !!state.user?.token,
  
  userId: (state: AuthState & AuthActions) => 
    state.user?.uid
};

// Helper hooks for specific auth data
export const useAuthUser = () => useAuthStore(authSelectors.user);
export const useIsAuthenticated = () => useAuthStore(authSelectors.isAuthenticated);
export const useAuthLoading = () => useAuthStore(authSelectors.isLoading);
export const useAuthError = () => useAuthStore(authSelectors.error);
export const useUserId = () => useAuthStore(authSelectors.userId);

// Auth store actions hook
export const useAuthActions = () => useAuthStore((state) => ({
  initialize: state.initialize,
  reset: state.reset,
  setUser: state.setUser,
  updateToken: state.updateToken,
  setLoading: state.setLoading,
  setError: state.setError,
  signOut: state.signOut
}));

// Initialize auth store on module load
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure Firebase is ready
  setTimeout(() => {
    authStore.getState().initialize();
    
    // Set up Firebase auth listener to sync auth state
    const setupFirebaseAuthListener = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        // Listen for auth state changes
        onAuthStateChanged(auth, (firebaseUser) => {
          const authState = authStore.getState();
          
          if (firebaseUser) {
            // User is signed in
            const user = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              token: null // Will be updated separately
            };
            
            logger.info('Firebase user authenticated', undefined, {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName
            });
            
            authState.setUser(user);
          } else {
            // User is signed out
            logger.info('Firebase user signed out');
            authState.setUser(null);
          }
        });
        
        logger.info('Firebase auth listener set up successfully');
      } catch (error) {
        logger.error('Failed to set up Firebase auth listener', error);
      }
    };
    
    setupFirebaseAuthListener();
  }, 100);
} 
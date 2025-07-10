import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { UserState, UserActions, UserProfile, UserPreferences } from '../types';
import { Logger } from '../../utils/logger';
import { StorePersistence, persistenceConfigs } from '../persistence';
import { eventEmitter, createStoreEvent, monitorStorePerformance } from '../utils';

const logger = Logger.getInstance().withContext({
  component: 'user-store'
});

const persistence = StorePersistence.getInstance();

// Helper function to get auth state without circular dependency
const getAuthUser = () => {
  // Import dynamically to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const authModule = require('./authStore');
  return authModule.useAuthStore.getState().user;
};

// Default user preferences
const defaultPreferences: UserPreferences = {
  theme: 'light',
  notifications: true,
  autoSave: true,
  fontSize: 'medium',
  language: 'en'
};

// Default state
const initialState: UserState = {
  profile: null,
  preferences: defaultPreferences,
  isLoading: false,
  error: null,
  isInitialized: false,
  lastUpdated: 0
};

// User store implementation
const userStoreImpl = create<UserState & UserActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Base actions
    initialize: () => {
      if (get().isInitialized) return;
      
      logger.info('Initializing user store');
      
      const authUser = getAuthUser();
      const persistedState = persistence.getPersistedState(
        persistenceConfigs.user, 
        authUser?.uid
      );
      
             if (persistedState) {
         set({
           ...persistedState,
           preferences: { ...defaultPreferences, ...(persistedState as any).preferences },
           isInitialized: true,
           lastUpdated: Date.now()
         });
      } else {
        set({
          preferences: defaultPreferences,
          isInitialized: true,
          lastUpdated: Date.now()
        });
      }
      
      // Emit initialization event
      eventEmitter.emit(createStoreEvent('user:initialized', get(), 'user-store'));
    },

    reset: () => {
      logger.info('Resetting user store');
      
      const authUser = getAuthUser();
      
      set({
        ...initialState,
        preferences: defaultPreferences,
        isInitialized: true,
        lastUpdated: Date.now()
      });
      
      // Clear persisted state
      if (authUser) {
        persistence.clearPersistedState(persistenceConfigs.user, authUser.uid);
      }
      
      // Emit reset event
      eventEmitter.emit(createStoreEvent('user:reset', null, 'user-store'));
    },

    // User-specific actions
    setProfile: (profile: UserProfile | null) => {
      const previousProfile = get().profile;
      
      logger.info('Setting user profile', undefined, {
        hasProfile: !!profile,
        userId: profile?.uid,
        wasSet: !!previousProfile
      });
      
      set({
        profile,
        error: null,
        lastUpdated: Date.now()
      });
      
      // Persist state
      const authUser = getAuthUser();
      if (authUser) {
        persistence.persistState(persistenceConfigs.user, { ...get() }, authUser.uid);
      }
      
      // Emit profile change event
      eventEmitter.emit(createStoreEvent('user:profile-changed', {
        profile,
        previousProfile
      }, 'user-store'));
    },

    updatePreferences: (preferences: Partial<UserPreferences>) => {
      const currentPreferences = get().preferences;
      const newPreferences = { ...currentPreferences, ...preferences };
      
      logger.info('Updating user preferences', undefined, {
        updatedKeys: Object.keys(preferences),
        userId: get().profile?.uid
      });
      
      set({
        preferences: newPreferences,
        lastUpdated: Date.now()
      });
      
      // Persist state
      const authUser = getAuthUser();
      if (authUser) {
        persistence.persistState(persistenceConfigs.user, { ...get() }, authUser.uid);
      }
      
      // Emit preferences change event
      eventEmitter.emit(createStoreEvent('user:preferences-changed', {
        preferences: newPreferences,
        previousPreferences: currentPreferences,
        updatedKeys: Object.keys(preferences)
      }, 'user-store'));
    },

    setLoading: (loading: boolean) => {
      set({
        isLoading: loading,
        lastUpdated: Date.now()
      });
    },

    setError: (error: string | null) => {
      if (error) {
        logger.error('User error set', new Error(error), undefined, {
          hasError: !!error
        });
      } else {
        logger.info('User error cleared', undefined, {
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
        eventEmitter.emit(createStoreEvent('user:error', { error }, 'user-store'));
      }
    },

    syncProfile: async () => {
      const authUser = getAuthUser();
      
      if (!authUser) {
        logger.warn('Cannot sync profile without authenticated user');
        return;
      }
      
      logger.info('Syncing user profile via API', undefined, {
        userId: authUser.uid
      });
      
      set({
        isLoading: true,
        lastUpdated: Date.now()
      });
      
      try {
        // Get Firebase auth token
        let authToken = authUser.token;
        if (!authToken && typeof window !== 'undefined') {
          const { auth } = await import('@/lib/firebase');
          const firebaseUser = auth.currentUser;
          if (firebaseUser) {
            authToken = await firebaseUser.getIdToken();
          }
        }
        
        // Call API endpoint to sync profile data
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const { data: userData } = await response.json();
        
        // Convert user data to profile format
        const profile: UserProfile | null = userData ? {
          uid: authUser.uid,
          email: userData.email,
          displayName: authUser.displayName || undefined,
          photoURL: authUser.photoURL || undefined,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          promptCount: 0,
          subscription: {
            tier: 'free'
          }
        } : null;
        
        set({
          profile,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        });
        
        // Persist state
        persistence.persistState(persistenceConfigs.user, { ...get() }, authUser.uid);
        
        // Emit sync success event
        eventEmitter.emit(createStoreEvent('user:profile-synced', {
          profile,
          userId: authUser.uid
        }, 'user-store'));
        
        logger.info('User profile synced successfully', undefined, {
          userId: authUser.uid
        });
        
      } catch (error) {
        logger.error('Profile sync failed', error as Error, undefined, {
          userId: authUser.uid
        });
        
        set({
          error: 'Failed to sync profile',
          isLoading: false,
          lastUpdated: Date.now()
        });
        
        // Emit sync error event
        eventEmitter.emit(createStoreEvent('user:profile-sync-error', {
          error: error as Error,
          userId: authUser.uid
        }, 'user-store'));
        
        throw error;
      }
    }
  }))
);

// Add performance monitoring (now fixed)
const userStore = monitorStorePerformance('user-store')(userStoreImpl);

// Export the user store BEFORE any subscriptions or initialization
export const useUserStore = userStore;
export default userStore;

// Subscribe to auth changes to reset user store when user changes
eventEmitter.on('auth:user-changed', (event) => {
  const { user, previousUser } = event.payload;
  
  if (user?.uid !== previousUser?.uid) {
    // Different user or user logged out
    userStore.getState().reset();
    
    // Initialize for new user
    if (user) {
      userStore.getState().initialize();
    }
  }
});

// Subscribe to user preferences changes for additional side effects
userStore.subscribe(
  (state) => state.preferences.theme,
  (theme, previousTheme) => {
    if (theme !== previousTheme) {
      logger.info('Theme preference changed', undefined, {
        theme,
        previousTheme
      });
      
      // Emit theme change event for UI stores to pick up
      eventEmitter.emit(createStoreEvent('user:theme-changed', {
        theme,
        previousTheme
      }, 'user-store'));
    }
  }
);

// Selectors for performance optimization
export const userSelectors = {
  profile: (state: UserState & UserActions) => state.profile,
  preferences: (state: UserState & UserActions) => state.preferences,
  isLoading: (state: UserState & UserActions) => state.isLoading,
  error: (state: UserState & UserActions) => state.error,
  isInitialized: (state: UserState & UserActions) => state.isInitialized,
  
  // Computed selectors
  displayName: (state: UserState & UserActions) => 
    state.profile?.displayName || state.profile?.email || 'Unknown User',
  
  subscriptionTier: (state: UserState & UserActions) => 
    state.profile?.subscription?.tier || 'free',
  
     hasValidSubscription: (state: UserState & UserActions) => {
     const sub = state.profile?.subscription;
     return sub ? sub.tier !== 'free' && (
       !sub.expiresAt || new Date() < sub.expiresAt
     ) : false;
   },
  
  promptsRemaining: (state: UserState & UserActions) => 
    state.profile?.promptCount || 0,
  
  theme: (state: UserState & UserActions) => 
    state.preferences.theme,
  
  fontSize: (state: UserState & UserActions) => 
    state.preferences.fontSize,
  
  notificationsEnabled: (state: UserState & UserActions) => 
    state.preferences.notifications
};

// Helper hooks for specific user data
export const useUserProfile = () => useUserStore(userSelectors.profile);
export const useUserPreferences = () => useUserStore(userSelectors.preferences);
export const useUserLoading = () => useUserStore(userSelectors.isLoading);
export const useUserError = () => useUserStore(userSelectors.error);
export const useUserTheme = () => useUserStore(userSelectors.theme);
export const useUserDisplayName = () => useUserStore(userSelectors.displayName);
export const useSubscriptionTier = () => useUserStore(userSelectors.subscriptionTier);
export const usePromptsRemaining = () => useUserStore(userSelectors.promptsRemaining);

// User store actions hook
export const useUserActions = () => useUserStore((state) => ({
  initialize: state.initialize,
  reset: state.reset,
  setProfile: state.setProfile,
  updatePreferences: state.updatePreferences,
  setLoading: state.setLoading,
  setError: state.setError,
  syncProfile: state.syncProfile
}));

// Initialize user store when auth is ready
eventEmitter.on('auth:initialized', () => {
  userStore.getState().initialize();
}); 
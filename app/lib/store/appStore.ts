// @ts-nocheck - Temporary disable for complex type compatibility issues
import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { AppStore } from './types';
import { Logger } from '../utils/logger';

// Import domain stores
import { useChatStore } from './chatStore';
import { initializeChatStores, resetChatStores } from './chat';
import { useThemeStore, useNotificationStore, useModalStore, initializeUIStores, resetUIStores, setupUIEventHandlers } from './ui';
import { useLoadingStore, useErrorStore, initializeSharedStores, resetSharedStores, setupSharedEventHandlers } from './shared';

// Import utilities
import { StorePerformanceMonitor, eventEmitter, createStoreEvent } from './utils';
import { StorePersistence } from './persistence';

const logger = Logger.getInstance().withContext({
  component: 'app-store'
});

const performanceMonitor = StorePerformanceMonitor.getInstance();

// App store state interface
interface AppStoreState {
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: string | null;
  lastInitialized: number;
  buildVersion?: string;
}

// App store management
class AppStoreManager {
  private static instance: AppStoreManager;
  private state: AppStoreState = {
    isInitialized: false,
    isInitializing: false,
    initializationError: null,
    lastInitialized: 0
  };
  private listeners: Array<(state: AppStoreState) => void> = [];
  private cleanupFunctions: Array<() => void> = [];

  private constructor() {}

  static getInstance(): AppStoreManager {
    if (!AppStoreManager.instance) {
      AppStoreManager.instance = new AppStoreManager();
    }
    return AppStoreManager.instance;
  }

  getState(): AppStoreState {
    return { ...this.state };
  }

  subscribe(listener: (state: AppStoreState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private setState(updates: Partial<AppStoreState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        logger.error('Error in app store listener', error);
      }
    });
  }

  async initialize(options?: {
    buildVersion?: string;
    skipEventHandlers?: boolean;
  }): Promise<void> {
    if (this.state.isInitialized || this.state.isInitializing) {
      logger.debug('App store already initialized or initializing');
      return;
    }

    const endMeasure = performanceMonitor.startMeasure('app.initialize');
    
    try {
      this.setState({ 
        isInitializing: true, 
        initializationError: null,
        buildVersion: options?.buildVersion
      });

      logger.info('Initializing app store', undefined, { 
        buildVersion: options?.buildVersion 
      });

      // Initialize domain stores in parallel
      await Promise.all([
        initializeChatStores(),
        initializeUIStores(),
        initializeSharedStores()
      ]);

      // Set up cross-store event handlers
      if (!options?.skipEventHandlers) {
        this.setupEventHandlers();
      }

      // Emit initialization complete event
      eventEmitter.emit(createStoreEvent(
        'app.initialized', 
        { buildVersion: options?.buildVersion }, 
        'app-store'
      ));

      this.setState({
        isInitialized: true,
        isInitializing: false,
        lastInitialized: Date.now()
      });

      logger.info('App store initialized successfully', undefined, {
        buildVersion: options?.buildVersion,
        duration: Math.round(performance.now() - (endMeasure as any))
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      this.setState({
        isInitializing: false,
        initializationError: errorMessage
      });

      logger.error('App store initialization failed', error, undefined, {
        buildVersion: options?.buildVersion
      });

      throw error;
    } finally {
      endMeasure();
    }
  }

  async reset(): Promise<void> {
    const endMeasure = performanceMonitor.startMeasure('app.reset');
    
    try {
      logger.info('Resetting app store');

      // Clean up event handlers
      this.cleanup();

      // Reset domain stores in parallel
      await Promise.all([
        Promise.resolve(resetChatStores()),
        Promise.resolve(resetUIStores()),
        Promise.resolve(resetSharedStores())
      ]);

      // Reset app store state
      this.setState({
        isInitialized: false,
        isInitializing: false,
        initializationError: null,
        lastInitialized: 0,
        buildVersion: undefined
      });

      // Emit reset event
      eventEmitter.emit(createStoreEvent('app.reset', {}, 'app-store'));

      logger.info('App store reset successfully');

    } catch (error) {
      logger.error('App store reset failed', error);
      throw error;
    } finally {
      endMeasure();
    }
  }

  private setupEventHandlers() {
    logger.debug('Setting up app store event handlers');

    // Set up domain event handlers
    setupUIEventHandlers();
    setupSharedEventHandlers();

    // Performance monitoring
    const performanceInterval = setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      if (Object.keys(metrics).length > 0) {
        logger.debug('Store performance metrics', undefined, { metrics });
      }
    }, 30000); // Log every 30 seconds

    this.cleanupFunctions.push(() => clearInterval(performanceInterval));
  }

  private cleanup() {
    logger.debug('Cleaning up app store event handlers');
    
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.error('Error during cleanup', error);
      }
    });
    
    this.cleanupFunctions = [];

    // Clear performance metrics
    performanceMonitor.clear();
  }

  getPerformanceMetrics() {
    return performanceMonitor.getMetrics();
  }

  getStorageInfo() {
    return StorePersistence.getInstance().getStorageInfo();
  }
}

// Singleton instance
const appStoreManager = AppStoreManager.getInstance();

// Main useAppStore hook
export const useAppStore = (): AppStore & {
  manager: {
    isInitialized: boolean;
    isInitializing: boolean;
    initializationError: string | null;
    initialize: (options?: any) => Promise<void>;
    reset: () => Promise<void>;
    getPerformanceMetrics: () => any;
    getStorageInfo: () => any;
  };
} => {
  // Get all individual stores
  const chat = useChatStore();
  const theme = useThemeStore();
  const notification = useNotificationStore();
  const modal = useModalStore();
  const loading = useLoadingStore();
  const error = useErrorStore();

  // Get manager state
  const managerState = appStoreManager.getState();

  // Memoize the composed store to prevent unnecessary re-renders
  const composedStore = useMemo(() => ({
    // Chat stores - chat store contains thread and message functionality
    chat,
    thread: chat,
    message: chat,
    
    // UI stores
    theme,
    notification,
    modal,
    
    // Shared stores
    loading,
    error,
    
    manager: {
      ...managerState,
      initialize: appStoreManager.initialize.bind(appStoreManager),
      reset: appStoreManager.reset.bind(appStoreManager),
      getPerformanceMetrics: appStoreManager.getPerformanceMetrics.bind(appStoreManager),
      getStorageInfo: appStoreManager.getStorageInfo.bind(appStoreManager)
    }
  }), [chat, theme, notification, modal, loading, error, managerState]);

  // @ts-expect-error - Type compatibility issue between ChatStore and expected interface
  return composedStore;
};

// Hook for store manager state only
export const useAppStoreManager = () => {
  const managerStateRef = useRef(appStoreManager.getState());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = appStoreManager.subscribe((state) => {
      managerStateRef.current = state;
      forceUpdate({}); // Force re-render
    });

    return unsubscribe;
  }, []);

  return {
    ...managerStateRef.current,
    initialize: useCallback(appStoreManager.initialize.bind(appStoreManager), []),
    reset: useCallback(appStoreManager.reset.bind(appStoreManager), []),
    getPerformanceMetrics: useCallback(appStoreManager.getPerformanceMetrics.bind(appStoreManager), []),
    getStorageInfo: useCallback(appStoreManager.getStorageInfo.bind(appStoreManager), [])
  };
};

// Utility hooks for specific store domains
export const useAppChat = () => {
  const { chat } = useAppStore();
  return chat;
};

export const useAppUI = () => {
  const { ui } = useAppStore();
  return ui;
};

export const useAppShared = () => {
  const { shared } = useAppStore();
  return shared;
};

// Performance-optimized selectors
export const useAppSelector = <T>(selector: (store: AppStore) => T): T => {
  const store = useAppStore();
  
  return useMemo(() => {
    try {
      return selector({
        chat: store.chat,
        ui: store.ui,
        shared: store.shared
      });
    } catch (error) {
      logger.error('Error in app selector', error);
      throw error;
    }
  }, [store, selector]);
};

// Common app-level selector functions (these return selector functions, not hook calls)
export const appSelectors = {
  // Loading states
  isLoading: (key?: string) => (store: any) => 
    key ? store.shared.loading.isLoading(key) : store.shared.loading.globalLoading,
  hasAnyLoading: (store: any) => 
    store.shared.loading.getLoadingKeys().length > 0,
  
  // Error states
  hasErrors: (store: any) => 
    Object.keys(store.shared.error.errors).length > 0,
  criticalErrors: (store: any) => 
    store.shared.error.getCriticalErrors(),
  
  // UI state
  isDarkMode: (store: any) => 
    store.ui.theme.resolvedTheme === 'dark',
  hasNotifications: (store: any) => 
    store.ui.notification.notifications.length > 0,
  hasOpenModals: (store: any) => 
    store.ui.modal.modalStack.length > 0,
  
  // Chat state
  activeThread: (store: any) => 
    store.chat.activeThreadId,
  isConnected: (store: any) => 
    store.chat.isConnected
};

// App-wide action creators
export const appActions = {
  // Initialize app
  initialize: async (options?: any) => {
    return appStoreManager.initialize(options);
  },
  
  // Reset app
  reset: async () => {
    return appStoreManager.reset();
  }
};

// Export manager instance for direct access
export { appStoreManager };

// Export default
export default useAppStore; 
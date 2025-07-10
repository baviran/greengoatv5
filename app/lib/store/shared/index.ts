import { useLoadingStore } from './loadingStore';
import { useErrorStore } from './errorStore';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'shared-domain'
});

// Export individual stores
export { useLoadingStore, useErrorStore };

// Export utilities
export { withLoadingState, useLoadingHelpers } from './loadingStore';
export { withErrorHandling, useErrorHelpers } from './errorStore';

// Composite shared store interface
export interface SharedStore {
  loading: ReturnType<typeof useLoadingStore>;
  error: ReturnType<typeof useErrorStore>;
}

// Hook to get all shared stores
export const useSharedStore = (): SharedStore => {
  const loading = useLoadingStore();
  const error = useErrorStore();

  return {
    loading,
    error
  };
};

// Initialize all shared stores
export const initializeSharedStores = async () => {
  const startTime = performance.now();
  
  try {
    logger.info('Initializing shared stores');
    
    // Initialize stores in parallel
    const stores = {
      loading: useLoadingStore.getState(),
      error: useErrorStore.getState()
    };
    
    // Initialize loading store
    stores.loading.initialize();
    
    // Initialize error store
    stores.error.initialize();
    
    const duration = performance.now() - startTime;
    
    logger.info('Shared stores initialized', undefined, {
      duration: Math.round(duration),
      stores: Object.keys(stores)
    });
    
  } catch (error) {
    logger.error('Failed to initialize shared stores', error);
    throw error;
  }
};

// Reset all shared stores
export const resetSharedStores = () => {
  const startTime = performance.now();
  
  try {
    logger.info('Resetting shared stores');
    
    const stores = {
      loading: useLoadingStore.getState(),
      error: useErrorStore.getState()
    };
    
    // Reset all stores
    stores.loading.reset();
    stores.error.reset();
    
    const duration = performance.now() - startTime;
    
    logger.info('Shared stores reset', undefined, {
      duration: Math.round(duration),
      stores: Object.keys(stores)
    });
    
  } catch (error) {
    logger.error('Failed to reset shared stores', error);
    throw error;
  }
};

// Shared utilities and helpers
export const sharedHelpers = {
  // Loading helpers
  loading: {
    set: (key: string, loading: boolean) => useLoadingStore.getState().setLoading(key, loading),
    get: (key: string) => useLoadingStore.getState().isLoading(key),
    clear: (key: string) => useLoadingStore.getState().clearLoading(key),
    clearAll: () => useLoadingStore.getState().clearAllLoading(),
    setGlobal: (loading: boolean) => useLoadingStore.getState().setGlobalLoading(loading),
    isGlobal: () => useLoadingStore.getState().globalLoading,
    getActive: () => useLoadingStore.getState().getLoadingKeys(),
    hasAny: () => useLoadingStore.getState().getLoadingKeys().length > 0,
    withLoading: <T>(key: string, fn: () => Promise<T>) => useLoadingStore.getState().withLoading(key, fn)
  },
  
  // Error helpers
  error: {
    set: (key: string, error: string, options?: any) => useErrorStore.getState().setError(key, error, options),
    get: (key: string) => useErrorStore.getState().hasError(key),
    clear: (key: string) => useErrorStore.getState().clearError(key),
    clearAll: () => useErrorStore.getState().clearAllErrors(),
    setGlobal: (error: string | null, options?: any) => useErrorStore.getState().setGlobalError(error, options),
    isGlobal: () => !!useErrorStore.getState().globalError,
    getInfo: (key: string) => useErrorStore.getState().getErrorInfo(key),
    getStats: () => useErrorStore.getState().getErrorStats(),
    getCritical: () => useErrorStore.getState().getCriticalErrors(),
    getByCategory: (category: any) => useErrorStore.getState().getErrorsByCategory(category),
    getBySeverity: (severity: any) => useErrorStore.getState().getErrorsBySeverity(severity)
  }
};

// React hook for shared helpers
export const useSharedHelpers = () => {
  return sharedHelpers;
};

// Selectors for common shared state
export const sharedSelectors = {
  // Loading selectors
  hasLoading: () => useLoadingStore.getState().getLoadingKeys().length > 0,
  isGlobalLoading: () => useLoadingStore.getState().globalLoading,
  loadingCount: () => useLoadingStore.getState().getLoadingKeys().length,
  activeLoadingKeys: () => useLoadingStore.getState().getLoadingKeys(),
  
  // Error selectors
  hasErrors: () => Object.keys(useErrorStore.getState().errors).length > 0,
  isGlobalError: () => !!useErrorStore.getState().globalError,
  errorCount: () => Object.keys(useErrorStore.getState().errors).length,
  criticalErrorCount: () => useErrorStore.getState().getCriticalErrors().length,
  recentErrorCount: () => useErrorStore.getState().getErrorStats().recentErrors
};

// React hook for shared selectors
export const useSharedSelectors = () => {
  return sharedSelectors;
};

// Combined loading and error handling
export const withLoadingAndErrorHandling = <T extends any[], R>(
  key: string,
  fn: (...args: T) => Promise<R>,
  options?: {
    errorCategory?: any;
    errorSeverity?: any;
    recoverable?: boolean;
  }
) => {
  return async (...args: T): Promise<R> => {
    const loadingStore = useLoadingStore.getState();
    const errorStore = useErrorStore.getState();
    
    try {
      // Clear any existing error
      errorStore.clearError(key);
      
      // Start loading
      loadingStore.setLoading(key, true);
      
      // Execute function
      const result = await fn(...args);
      
      return result;
      
    } catch (error) {
      // Handle error
      const errorMessage = error instanceof Error ? error.message : String(error);
      errorStore.setError(key, errorMessage, {
        category: options?.errorCategory,
        severity: options?.errorSeverity,
        recoverable: options?.recoverable
      });
      
      throw error;
      
    } finally {
      // Always stop loading
      loadingStore.setLoading(key, false);
    }
  };
};

// Cross-store shared event handlers
export const setupSharedEventHandlers = () => {
  // Loading state changes
  useLoadingStore.subscribe(
    (state: any) => state.loadingQueue.length,
    (count: number) => {
      logger.debug('Loading queue changed', undefined, { count });
      
      // Could trigger UI updates, progress indicators, etc.
    }
  );
  
  // Error state changes
  useErrorStore.subscribe(
    (state: any) => Object.keys(state.errors).length,
    (count: number) => {
      logger.debug('Error count changed', undefined, { count });
      
      // Could trigger notifications, alerts, etc.
    }
  );
  
  // Global loading changes
  useLoadingStore.subscribe(
    (state: any) => state.globalLoading,
    (loading: boolean) => {
      logger.debug('Global loading changed', undefined, { loading });
      
      // Could disable interactions, show global spinner, etc.
    }
  );
  
  // Global error changes
  useErrorStore.subscribe(
    (state: any) => state.globalError,
    (error: string | null) => {
      logger.debug('Global error changed', undefined, { hasError: !!error });
      
      // Could show error overlay, redirect, etc.
    }
  );
};

// Export default shared store composition
const sharedStoreComposition = {
  useSharedStore,
  initializeSharedStores,
  resetSharedStores,
  sharedHelpers,
  sharedSelectors,
  setupSharedEventHandlers,
  withLoadingAndErrorHandling
};

export default sharedStoreComposition; 
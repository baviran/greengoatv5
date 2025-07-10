import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BaseState, BaseActions, LoadingState, LoadingActions } from '../types';
import { StorePerformanceMonitor } from '../utils';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'loading-store'
});

interface LoadingStoreState extends BaseState, LoadingState {
  loadingQueue: string[];
  requestCounts: Record<string, number>;
  loadingHistory: Array<{
    key: string;
    startTime: number;
    endTime?: number;
    duration?: number;
  }>;
  maxHistorySize: number;
}

interface LoadingStoreActions extends BaseActions, LoadingActions {
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  getLoadingKeys: () => string[];
  getRequestCount: (key: string) => number;
  getAverageLoadingTime: (key: string) => number;
  getLoadingHistory: (key?: string) => any[];
  withLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
}

type LoadingStore = LoadingStoreState & LoadingStoreActions;

// Performance monitoring
const performanceMonitor = StorePerformanceMonitor.getInstance();

export const useLoadingStore = create<LoadingStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // Base state
      isInitialized: false,
      lastUpdated: Date.now(),
      
      // Loading state
      globalLoading: false,
      loadingStates: {},
      loadingQueue: [],
      requestCounts: {},
      loadingHistory: [],
      maxHistorySize: 100,
      
      // Base actions
      initialize: () => {
        const endMeasure = performanceMonitor.startMeasure('loading.initialize');
        
        try {
          logger.info('Initializing loading store');
          
          set({
            isInitialized: true,
            lastUpdated: Date.now()
          });
          
          logger.info('Loading store initialized');
          
        } catch (error) {
          logger.error('Failed to initialize loading store', error);
          set({ isInitialized: true, lastUpdated: Date.now() });
        } finally {
          endMeasure();
        }
      },
      
      reset: () => {
        set({
          globalLoading: false,
          loadingStates: {},
          loadingQueue: [],
          requestCounts: {},
          loadingHistory: [],
          lastUpdated: Date.now()
        });
        
        logger.info('Loading store reset');
      },
      
      // Loading actions
      setGlobalLoading: (loading: boolean) => {
        const endMeasure = performanceMonitor.startMeasure('loading.setGlobalLoading');
        
        try {
          const state = get();
          
          if (state.globalLoading === loading) {
            return; // No change needed
          }
          
          set({ globalLoading: loading, lastUpdated: Date.now() });
          
          logger.info('Global loading state changed', undefined, { loading });
          
        } finally {
          endMeasure();
        }
      },
      
      setLoading: (key: string, loading: boolean) => {
        const endMeasure = performanceMonitor.startMeasure('loading.setLoading');
        
        try {
          const state = get();
          const currentLoading = state.loadingStates[key] || false;
          
          if (currentLoading === loading) {
            return; // No change needed
          }
          
          const newLoadingStates = { ...state.loadingStates };
          let newLoadingQueue = [...state.loadingQueue];
          const newRequestCounts = { ...state.requestCounts };
          let newLoadingHistory = [...state.loadingHistory];
          
          if (loading) {
            // Start loading
            newLoadingStates[key] = true;
            
            if (!newLoadingQueue.includes(key)) {
              newLoadingQueue.push(key);
            }
            
            // Track request count
            newRequestCounts[key] = (newRequestCounts[key] || 0) + 1;
            
            // Add to history
            newLoadingHistory.push({
              key,
              startTime: Date.now()
            });
            
            // Trim history if needed
            if (newLoadingHistory.length > state.maxHistorySize) {
              newLoadingHistory = newLoadingHistory.slice(-state.maxHistorySize);
            }
            
          } else {
            // Stop loading
            delete newLoadingStates[key];
            newLoadingQueue = newLoadingQueue.filter(k => k !== key);
            
            // Update history with end time
            const historyEntry = newLoadingHistory
              .reverse()
              .find(h => h.key === key && !h.endTime);
            
            if (historyEntry) {
              historyEntry.endTime = Date.now();
              historyEntry.duration = historyEntry.endTime - historyEntry.startTime;
            }
            
            newLoadingHistory.reverse();
          }
          
          set({
            loadingStates: newLoadingStates,
            loadingQueue: newLoadingQueue,
            requestCounts: newRequestCounts,
            loadingHistory: newLoadingHistory,
            lastUpdated: Date.now()
          });
          
          logger.debug('Loading state changed', undefined, { 
            key, 
            loading, 
            queueSize: newLoadingQueue.length,
            requestCount: newRequestCounts[key] || 0
          });
          
        } finally {
          endMeasure();
        }
      },
      
      isLoading: (key: string) => {
        const state = get();
        return state.loadingStates[key] || false;
      },
      
      clearLoading: (key: string) => {
        const endMeasure = performanceMonitor.startMeasure('loading.clearLoading');
        
        try {
          const state = get();
          
          if (!state.loadingStates[key]) {
            return; // Already cleared
          }
          
          const newLoadingStates = { ...state.loadingStates };
          delete newLoadingStates[key];
          
          const newLoadingQueue = state.loadingQueue.filter(k => k !== key);
          
          set({
            loadingStates: newLoadingStates,
            loadingQueue: newLoadingQueue,
            lastUpdated: Date.now()
          });
          
          logger.debug('Loading cleared', undefined, { key, queueSize: newLoadingQueue.length });
          
        } finally {
          endMeasure();
        }
      },
      
      clearAllLoading: () => {
        const endMeasure = performanceMonitor.startMeasure('loading.clearAllLoading');
        
        try {
          const state = get();
          const clearedKeys = Object.keys(state.loadingStates);
          
          set({
            loadingStates: {},
            loadingQueue: [],
            lastUpdated: Date.now()
          });
          
          logger.info('All loading states cleared', undefined, { 
            clearedCount: clearedKeys.length,
            clearedKeys
          });
          
        } finally {
          endMeasure();
        }
      },
      
      getLoadingKeys: () => {
        const state = get();
        return Object.keys(state.loadingStates);
      },
      
      getRequestCount: (key: string) => {
        const state = get();
        return state.requestCounts[key] || 0;
      },
      
      getAverageLoadingTime: (key: string) => {
        const state = get();
        const keyHistory = state.loadingHistory.filter(h => h.key === key && h.duration);
        if (keyHistory.length === 0) return 0;
        
        const totalTime = keyHistory.reduce((sum, h) => sum + (h.duration || 0), 0);
        return Math.round(totalTime / keyHistory.length);
      },
      
      getLoadingHistory: (key?: string) => {
        const state = get();
        if (key) {
          return state.loadingHistory.filter(h => h.key === key);
        }
        return state.loadingHistory;
      },
      
      withLoading: async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
        const store = get();
        const endMeasure = performanceMonitor.startMeasure(`loading.withLoading.${key}`);
        
        try {
          // Start loading
          store.setLoading(key, true);
          
          logger.debug('Starting async operation with loading', undefined, { key });
          
          // Execute the async function
          const result = await fn();
          
          logger.debug('Async operation completed', undefined, { key });
          
          return result;
          
        } catch (error) {
          logger.error('Async operation failed', error, undefined, { key });
          throw error;
          
        } finally {
          // Always stop loading
          store.setLoading(key, false);
          endMeasure();
        }
      }
    })
  )
);

// React hook for loading utilities
export const useLoadingHelpers = () => {
  const store = useLoadingStore();
  
  return {
    setLoading: store.setLoading,
    isLoading: store.isLoading,
    clearLoading: store.clearLoading,
    withLoading: store.withLoading,
    setGlobalLoading: store.setGlobalLoading,
    isGlobalLoading: () => store.globalLoading,
    getActiveLoadingKeys: () => store.getLoadingKeys(),
    hasAnyLoading: () => store.getLoadingKeys().length > 0
  };
};

// Higher-order function to wrap async operations with loading
export const withLoadingState = <T extends any[], R>(
  key: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const store = useLoadingStore.getState();
    return store.withLoading(key, () => fn(...args));
  };
};

// Export default
export default useLoadingStore; 
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BaseState, BaseActions, ErrorState, ErrorActions } from '../types';
import { StorePerformanceMonitor, eventEmitter, createStoreEvent } from '../utils';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'error-store'
});

interface ErrorInfo {
  key: string;
  message: string;
  error?: Error;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'auth' | 'business' | 'system' | 'unknown';
  timestamp: number;
  metadata?: Record<string, any>;
  userId?: string;
  recovered?: boolean;
  recoveryAttempts?: number;
  maxRecoveryAttempts?: number;
}

interface ErrorStoreState extends BaseState, ErrorState {
  errorHistory: ErrorInfo[];
  errorCounts: Record<string, number>;
  errorCategories: Record<string, number>;
  maxHistorySize: number;
  autoRecovery: boolean;
  errorThresholds: Record<string, number>;
}

interface ErrorStoreActions extends BaseActions {
  setError: (key: string, error: string, options?: {
    severity?: ErrorInfo['severity'];
    category?: ErrorInfo['category'];
    metadata?: Record<string, any>;
    recoverable?: boolean;
  }) => void;
  setGlobalError: (error: string | null, options?: {
    severity?: ErrorInfo['severity'];
    category?: ErrorInfo['category'];
    metadata?: Record<string, any>;
  }) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  hasError: (key: string) => boolean;
  getCriticalErrors: () => ErrorInfo[];
  getErrorInfo: (key: string) => ErrorInfo | null;
  getErrorsByCategory: (category: ErrorInfo['category']) => ErrorInfo[];
  getErrorsBySeverity: (severity: ErrorInfo['severity']) => ErrorInfo[];
  getErrorHistory: (key?: string) => ErrorInfo[];
  markAsRecovered: (key: string) => void;
  attemptRecovery: (key: string) => Promise<boolean>;
  setAutoRecovery: (enabled: boolean) => void;
  getErrorStats: () => {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentErrors: number;
  };
}

type ErrorStore = ErrorStoreState & ErrorStoreActions;

// Performance monitoring
const performanceMonitor = StorePerformanceMonitor.getInstance();

// Helper functions
const categorizeError = (error: string | Error): ErrorInfo['category'] => {
  const errorText = typeof error === 'string' ? error : error.message;
  const lowerText = errorText.toLowerCase();
  
  if (lowerText.includes('network') || lowerText.includes('fetch') || lowerText.includes('timeout')) {
    return 'network';
  }
  if (lowerText.includes('validation') || lowerText.includes('invalid') || lowerText.includes('required')) {
    return 'validation';
  }
  if (lowerText.includes('auth') || lowerText.includes('unauthorized') || lowerText.includes('forbidden')) {
    return 'auth';
  }
  if (lowerText.includes('business') || lowerText.includes('rule') || lowerText.includes('constraint')) {
    return 'business';
  }
  if (lowerText.includes('system') || lowerText.includes('internal') || lowerText.includes('server')) {
    return 'system';
  }
  
  return 'unknown';
};

const determineSeverity = (error: string | Error, category: ErrorInfo['category']): ErrorInfo['severity'] => {
  if (category === 'system' || category === 'auth') {
    return 'high';
  }
  if (category === 'network') {
    return 'medium';
  }
  if (category === 'validation') {
    return 'low';
  }
  
  return 'medium';
};

const shouldAttemptRecovery = (errorInfo: ErrorInfo): boolean => {
  if (!errorInfo.maxRecoveryAttempts) return false;
  if ((errorInfo.recoveryAttempts || 0) >= errorInfo.maxRecoveryAttempts) return false;
  
  // Only attempt recovery for certain categories
  const recoverableCategories: ErrorInfo['category'][] = ['network', 'system'];
  return recoverableCategories.includes(errorInfo.category);
};

export const useErrorStore = create<ErrorStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // Base state
      isInitialized: false,
      lastUpdated: Date.now(),
      
      // Error state
      errors: {},
      globalError: null,
      errorHistory: [],
      errorCounts: {},
      errorCategories: {},
      maxHistorySize: 200,
      autoRecovery: true,
      errorThresholds: {
        network: 3,
        validation: 10,
        auth: 1,
        business: 5,
        system: 2,
        unknown: 5
      },
      
      // Base actions
      initialize: () => {
        const endMeasure = performanceMonitor.startMeasure('error.initialize');
        
        try {
          logger.info('Initializing error store');
          
          set({
            isInitialized: true,
            lastUpdated: Date.now()
          });
          
          logger.info('Error store initialized');
          
        } catch (error) {
          logger.error('Failed to initialize error store', error);
          set({ isInitialized: true, lastUpdated: Date.now() });
        } finally {
          endMeasure();
        }
      },
      
      reset: () => {
        set({
          errors: {},
          globalError: null,
          errorHistory: [],
          errorCounts: {},
          errorCategories: {},
          lastUpdated: Date.now()
        });
        
        logger.info('Error store reset');
      },
      
      // Error actions
      setError: (key: string, error: string, options = {}) => {
        const endMeasure = performanceMonitor.startMeasure('error.setError');
        
        try {
          const state = get();
          const category = options.category || categorizeError(error);
          const severity = options.severity || determineSeverity(error, category);
          
          const errorInfo: ErrorInfo = {
            key,
            message: error,
            severity,
            category,
            timestamp: Date.now(),
            metadata: options.metadata,
            recovered: false,
            recoveryAttempts: 0,
            maxRecoveryAttempts: options.recoverable ? 3 : 0
          };
          
          // Update error state
          const newErrors = { ...state.errors, [key]: error };
          const newErrorCounts = { ...state.errorCounts };
          const newErrorCategories = { ...state.errorCategories };
          
          // Track counts
          newErrorCounts[key] = (newErrorCounts[key] || 0) + 1;
          newErrorCategories[category] = (newErrorCategories[category] || 0) + 1;
          
          // Add to history
          let newErrorHistory = [...state.errorHistory, errorInfo];
          
          // Trim history if needed
          if (newErrorHistory.length > state.maxHistorySize) {
            newErrorHistory = newErrorHistory.slice(-state.maxHistorySize);
          }
          
          set({
            errors: newErrors,
            errorCounts: newErrorCounts,
            errorCategories: newErrorCategories,
            errorHistory: newErrorHistory,
            lastUpdated: Date.now()
          });
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent(
            'error.occurred',
            { key, error: errorInfo },
            'error-store'
          ));
          
          // Attempt auto-recovery if enabled
          if (state.autoRecovery && shouldAttemptRecovery(errorInfo)) {
            setTimeout(() => {
              get().attemptRecovery(key);
            }, 1000 * Math.pow(2, errorInfo.recoveryAttempts || 0)); // Exponential backoff
          }
          
          logger.error('Error recorded', undefined, undefined, {
            key,
            category,
            severity,
            message: error,
            count: newErrorCounts[key],
            metadata: options.metadata
          });
          
        } finally {
          endMeasure();
        }
      },
      
      setGlobalError: (error: string | null, options = {}) => {
        const endMeasure = performanceMonitor.startMeasure('error.setGlobalError');
        
        try {
          const state = get();
          
          set({
            globalError: error,
            lastUpdated: Date.now()
          });
          
          if (error) {
            const category = options.category || categorizeError(error);
            const severity = options.severity || determineSeverity(error, category);
            
            const errorInfo: ErrorInfo = {
              key: 'global',
              message: error,
              severity,
              category,
              timestamp: Date.now(),
              metadata: options.metadata,
              recovered: false,
              recoveryAttempts: 0
            };
            
            // Add to history
            let newErrorHistory = [...state.errorHistory, errorInfo];
            
            // Trim history if needed
            if (newErrorHistory.length > state.maxHistorySize) {
              newErrorHistory = newErrorHistory.slice(-state.maxHistorySize);
            }
            
            set({ errorHistory: newErrorHistory });
            
            // Emit event for cross-store communication
            eventEmitter.emit(createStoreEvent(
              'error.globalOccurred',
              { error: errorInfo },
              'error-store'
            ));
            
            logger.error('Global error set', undefined, undefined, {
              category,
              severity,
              message: error,
              metadata: options.metadata
            });
          } else {
            logger.info('Global error cleared');
          }
          
        } finally {
          endMeasure();
        }
      },
      
      clearError: (key: string) => {
        const endMeasure = performanceMonitor.startMeasure('error.clearError');
        
        try {
          const state = get();
          
          if (!state.errors[key]) {
            return; // Already cleared
          }
          
          const newErrors = { ...state.errors };
          delete newErrors[key];
          
          set({
            errors: newErrors,
            lastUpdated: Date.now()
          });
          
          // Mark as recovered in history
          const newErrorHistory = state.errorHistory.map(errorInfo => 
            errorInfo.key === key && !errorInfo.recovered
              ? { ...errorInfo, recovered: true }
              : errorInfo
          );
          
          set({ errorHistory: newErrorHistory });
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent(
            'error.cleared',
            { key },
            'error-store'
          ));
          
          logger.info('Error cleared', undefined, { key });
          
        } finally {
          endMeasure();
        }
      },
      
      clearAllErrors: () => {
        const endMeasure = performanceMonitor.startMeasure('error.clearAllErrors');
        
        try {
          const state = get();
          const clearedKeys = Object.keys(state.errors);
          
          // Mark all as recovered in history
          const newErrorHistory = state.errorHistory.map(errorInfo => 
            !errorInfo.recovered
              ? { ...errorInfo, recovered: true }
              : errorInfo
          );
          
          set({
            errors: {},
            globalError: null,
            errorHistory: newErrorHistory,
            lastUpdated: Date.now()
          });
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent(
            'error.allCleared',
            { clearedCount: clearedKeys.length },
            'error-store'
          ));
          
          logger.info('All errors cleared', undefined, { 
            clearedCount: clearedKeys.length,
            clearedKeys
          });
          
        } finally {
          endMeasure();
        }
      },
      
      hasError: (key: string) => {
        const state = get();
        return !!state.errors[key];
      },
      
      getErrorInfo: (key: string) => {
        const state = get();
        return state.errorHistory
          .reverse()
          .find(errorInfo => errorInfo.key === key && !errorInfo.recovered) || null;
      },
      
      getErrorsByCategory: (category: ErrorInfo['category']) => {
        const state = get();
        return state.errorHistory.filter(errorInfo => 
          errorInfo.category === category && !errorInfo.recovered
        );
      },
      
      getErrorsBySeverity: (severity: ErrorInfo['severity']) => {
        const state = get();
        return state.errorHistory.filter(errorInfo => 
          errorInfo.severity === severity && !errorInfo.recovered
        );
      },
      
      getCriticalErrors: () => {
        const state = get();
        return state.errorHistory.filter(errorInfo => 
          errorInfo.severity === 'critical' && !errorInfo.recovered
        );
      },
      
      getErrorHistory: (key?: string) => {
        const state = get();
        if (key) {
          return state.errorHistory.filter(errorInfo => errorInfo.key === key);
        }
        return state.errorHistory;
      },
      
      markAsRecovered: (key: string) => {
        const state = get();
        const newErrorHistory = state.errorHistory.map(errorInfo => 
          errorInfo.key === key && !errorInfo.recovered
            ? { ...errorInfo, recovered: true }
            : errorInfo
        );
        
        set({ errorHistory: newErrorHistory, lastUpdated: Date.now() });
        
        logger.info('Error marked as recovered', undefined, { key });
      },
      
      attemptRecovery: async (key: string) => {
        const endMeasure = performanceMonitor.startMeasure('error.attemptRecovery');
        
        try {
          const state = get();
          const errorInfo = state.errorHistory
            .reverse()
            .find(e => e.key === key && !e.recovered);
          
          if (!errorInfo || !shouldAttemptRecovery(errorInfo)) {
            return false;
          }
          
          logger.info('Attempting error recovery', undefined, { 
            key, 
            attempt: (errorInfo.recoveryAttempts || 0) + 1,
            maxAttempts: errorInfo.maxRecoveryAttempts
          });
          
          // Update recovery attempts
          const newErrorHistory = state.errorHistory.map(e => 
            e === errorInfo
              ? { ...e, recoveryAttempts: (e.recoveryAttempts || 0) + 1 }
              : e
          );
          
          set({ errorHistory: newErrorHistory });
          
          // Emit recovery attempt event
          eventEmitter.emit(createStoreEvent(
            'error.recoveryAttempted',
            { key, attempt: (errorInfo.recoveryAttempts || 0) + 1 },
            'error-store'
          ));
          
          // Simulate recovery logic (in real app, this would be specific to error type)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // For now, just clear the error (in real app, would retry the failed operation)
          get().clearError(key);
          
          logger.info('Error recovery succeeded', undefined, { key });
          
          return true;
          
        } catch (error) {
          logger.error('Error recovery failed', error, undefined, { key });
          return false;
        } finally {
          endMeasure();
        }
      },
      
      setAutoRecovery: (enabled: boolean) => {
        set({ autoRecovery: enabled, lastUpdated: Date.now() });
        logger.info('Auto recovery setting changed', undefined, { enabled });
      },
      
      getErrorStats: () => {
        const state = get();
        const recentThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes
        
        const activeErrors = state.errorHistory.filter(e => !e.recovered);
        const recentErrors = activeErrors.filter(e => e.timestamp > recentThreshold);
        
        const byCategory = activeErrors.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const bySeverity = activeErrors.reduce((acc, e) => {
          acc[e.severity] = (acc[e.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          total: activeErrors.length,
          byCategory,
          bySeverity,
          recentErrors: recentErrors.length
        };
      }
    })
  )
);

// React hook for error utilities
export const useErrorHelpers = () => {
  const store = useErrorStore();
  
  return {
    setError: store.setError,
    clearError: store.clearError,
    hasError: store.hasError,
    getErrorInfo: store.getErrorInfo,
    setGlobalError: store.setGlobalError,
    clearAllErrors: store.clearAllErrors,
    isGlobalError: () => !!store.globalError,
    getErrorStats: store.getErrorStats,
    getCriticalErrors: store.getCriticalErrors
  };
};

// Higher-order function to wrap operations with error handling
export const withErrorHandling = <T extends any[], R>(
  key: string,
  fn: (...args: T) => Promise<R>,
  options?: {
    category?: ErrorInfo['category'];
    severity?: ErrorInfo['severity'];
    recoverable?: boolean;
  }
) => {
  return async (...args: T): Promise<R> => {
    const store = useErrorStore.getState();
    
    try {
      // Clear any existing error for this key
      store.clearError(key);
      
      return await fn(...args);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      store.setError(key, errorMessage, {
        category: options?.category,
        severity: options?.severity,
        recoverable: options?.recoverable,
        metadata: { args, timestamp: Date.now() }
      });
      
      throw error;
    }
  };
};

// Export default
export default useErrorStore; 
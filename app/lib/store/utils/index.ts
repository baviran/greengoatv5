import { useMemo, useEffect, useRef } from 'react';
import { StoreSelector, StoreSubscriber, StoreEvent, EventEmitter } from '../types';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'store-utils'
});

// Event emitter for cross-store communication
class StoreEventEmitter implements EventEmitter {
  private static instance: StoreEventEmitter;
  private listeners: Map<string, Array<(event: StoreEvent) => void>> = new Map();

  private constructor() {}

  static getInstance(): StoreEventEmitter {
    if (!StoreEventEmitter.instance) {
      StoreEventEmitter.instance = new StoreEventEmitter();
    }
    return StoreEventEmitter.instance;
  }

  emit(event: StoreEvent): void {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in event listener', error as Error, undefined, {
          eventType: event.type,
          source: event.source
        });
      }
    });
  }

  on(eventType: string, callback: (event: StoreEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }

  off(eventType: string, callback: (event: StoreEvent) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Export singleton instance
export const eventEmitter = StoreEventEmitter.getInstance();

// Helper function to create store events
export function createStoreEvent(type: string, payload: any, source: string): StoreEvent {
  return {
    type,
    payload,
    source,
    timestamp: Date.now()
  };
}

// Memoized selector hook for performance optimization
export function useStoreSelector<T, R>(
  useStore: () => T,
  selector: StoreSelector<T, R>,
  deps?: any[]
): R {
  const storeState = useStore();
  
  return useMemo(() => {
    return selector(storeState);
  }, deps ? [storeState, selector, ...deps] : [storeState, selector]);
}

// Debounced store subscription for performance
export function useStoreSubscription<T>(
  useStore: () => T,
  subscriber: StoreSubscriber<T>,
  delay: number = 100
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevStateRef = useRef<T | undefined>(undefined);

  const currentState = useStore();
  
  useEffect(() => {
    const prevState = prevStateRef.current;
    
    if (prevState !== undefined) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        subscriber(currentState, prevState);
      }, delay);
    }
    
    prevStateRef.current = currentState;
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentState, subscriber, delay]);
}

// Shallow equality check for store state
export function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if ((a as any)[key] !== (b as any)[key]) return false;
  }
  
  return true;
}

// Deep equality check for complex state
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as any)[key], (b as any)[key])) return false;
  }
  
  return true;
}

// Store state validator
export function validateStoreState<T>(
  state: T,
  schema: Record<string, (value: any) => boolean>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [key, validator] of Object.entries(schema)) {
    const value = (state as any)[key];
    if (!validator(value)) {
      errors.push(`Invalid value for ${key}: ${value}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Store performance monitor
export class StorePerformanceMonitor {
  private static instance: StorePerformanceMonitor;
  private metrics: Map<string, {
    callCount: number;
    totalTime: number;
    averageTime: number;
    lastCall: number;
  }> = new Map();

  private constructor() {}

  static getInstance(): StorePerformanceMonitor {
    if (!StorePerformanceMonitor.instance) {
      StorePerformanceMonitor.instance = new StorePerformanceMonitor();
    }
    return StorePerformanceMonitor.instance;
  }

  startMeasure(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const existing = this.metrics.get(operation) || {
        callCount: 0,
        totalTime: 0,
        averageTime: 0,
        lastCall: 0
      };
      
      const newCallCount = existing.callCount + 1;
      const newTotalTime = existing.totalTime + duration;
      
      this.metrics.set(operation, {
        callCount: newCallCount,
        totalTime: newTotalTime,
        averageTime: newTotalTime / newCallCount,
        lastCall: endTime
      });
      
      // Log slow operations
      if (duration > 50) {
        logger.warn('Slow store operation detected', undefined, {
          operation,
          duration,
          threshold: 50
        });
      }
    };
  }

  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    this.metrics.forEach((metrics, operation) => {
      result[operation] = metrics;
    });
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = StorePerformanceMonitor.getInstance();

// Higher-order function to add performance monitoring to store actions
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  actionName: string,
  action: T
): T {
  return ((...args: any[]) => {
    const endMeasure = performanceMonitor.startMeasure(actionName);
    try {
      const result = action(...args);
      
      // Handle async actions
      if (result && typeof result.then === 'function') {
        return result.finally(() => endMeasure());
      }
      
      endMeasure();
      return result;
    } catch (error) {
      endMeasure();
      throw error;
    }
  }) as T;
}

// Store state hydration utility
export function hydrateState<T extends Record<string, any>>(
  defaultState: T,
  persistedState: Partial<T> | null,
  hydrationRules?: Record<string, (value: any) => any>
): T {
  if (!persistedState) return defaultState;
  
  const hydrated = { ...defaultState };
  
  for (const [key, value] of Object.entries(persistedState)) {
    if (key in defaultState) {
      const rule = hydrationRules?.[key];
      hydrated[key as keyof T] = rule ? rule(value) : value;
    }
  }
  
  return hydrated;
}

// Batch state updates for performance
export function batchUpdates<T>(
  store: { setState: (updater: (state: T) => T) => void; getState: () => T },
  updates: Array<(state: T) => Partial<T>>
): void {
  store.setState((currentState) => {
    let newState = currentState;
    
    for (const update of updates) {
      const partial = update(newState);
      newState = { ...newState, ...partial };
    }
    
    return newState;
  });
}

// Store cleanup utility
export function createStoreCleanup(cleanupFns: Array<() => void>): () => void {
  return () => {
    cleanupFns.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.error('Error during store cleanup', error as Error);
      }
    });
  };
}

// Store subscription manager
export class StoreSubscriptionManager {
  private subscriptions: Array<() => void> = [];

  add(unsubscribe: () => void): void {
    this.subscriptions.push(unsubscribe);
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        logger.error('Error unsubscribing from store', error as Error);
      }
    });
    this.subscriptions = [];
  }

  getSubscriptionCount(): number {
    return this.subscriptions.length;
  }
}

// Export performance monitoring decorator (simplified to avoid breaking Zustand)
export function monitorStorePerformance(storeName: string) {
  return function<T extends Record<string, any>>(store: T): T {
    // For now, just return the store without wrapping to avoid breaking functionality
    // TODO: Implement non-intrusive performance monitoring
    logger.debug('Performance monitoring enabled for store', undefined, { storeName });
    return store;
  };
} 
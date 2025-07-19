import { PersistenceConfig } from '../types';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'store-persistence'
});

export class StorePersistence {
  private static instance: StorePersistence;
  private storage: Storage;
  private prefix: string;

  private constructor() {
    this.storage = typeof window !== 'undefined' ? localStorage : {} as Storage;
    this.prefix = 'gg_store_';
  }

  static getInstance(): StorePersistence {
    if (!StorePersistence.instance) {
      StorePersistence.instance = new StorePersistence();
    }
    return StorePersistence.instance;
  }

  /**
   * Generate storage key based on config
   */
  private generateKey(config: PersistenceConfig): string {
    return `${this.prefix}${config.key}_v${config.version}`;
  }

  /**
   * Get persisted state from storage
   */
  getPersistedState<T>(config: PersistenceConfig): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const key = this.generateKey(config);
      const stored = this.storage.getItem(key);
      
      if (!stored) return null;

      let parsedState = JSON.parse(stored);
      
      // Handle migration if needed
      if (config.migrate && typeof config.migrate === 'function') {
        parsedState = config.migrate(parsedState, config.version);
      }

      // Apply whitelist if specified
      if (config.whitelist && config.whitelist.length > 0) {
        const filteredState: any = {};
        config.whitelist.forEach(key => {
          if (key in parsedState) {
            filteredState[key] = parsedState[key];
          }
        });
        return filteredState as T;
      }

      // Apply blacklist if specified
      if (config.blacklist && config.blacklist.length > 0) {
        const filteredState = { ...parsedState };
        config.blacklist.forEach(key => {
          delete filteredState[key];
        });
        return filteredState as T;
      }

      return parsedState as T;

    } catch (error) {
      logger.error('Failed to get persisted state', error, undefined, {
        configKey: config.key,
        version: config.version
      });
      return null;
    }
  }

  /**
   * Persist state to storage
   */
  persistState<T>(config: PersistenceConfig, state: T): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const key = this.generateKey(config);
      let stateToStore = state;

      // Apply whitelist if specified
      if (config.whitelist && config.whitelist.length > 0) {
        const filteredState: any = {};
        config.whitelist.forEach(key => {
          if (state && typeof state === 'object' && key in state) {
            filteredState[key] = (state as any)[key];
          }
        });
        stateToStore = filteredState as T;
      }

      // Apply blacklist if specified
      if (config.blacklist && config.blacklist.length > 0) {
        const filteredState = { ...state };
        config.blacklist.forEach(key => {
          if (filteredState && typeof filteredState === 'object') {
            delete (filteredState as any)[key];
          }
        });
        stateToStore = filteredState;
      }

      this.storage.setItem(key, JSON.stringify(stateToStore));
      
      logger.debug('State persisted successfully', undefined, {
        configKey: config.key,
        version: config.version,
        dataSize: JSON.stringify(stateToStore).length
      });

      return true;

    } catch (error) {
      logger.error('Failed to persist state', error, undefined, {
        configKey: config.key,
        version: config.version
      });
      return false;
    }
  }

  /**
   * Remove persisted state from storage
   */
  removePersistedState(config: PersistenceConfig): void {
    if (typeof window === 'undefined') return;

    try {
      const key = this.generateKey(config);
      this.storage.removeItem(key);
      
      logger.debug('Persisted state removed', undefined, {
        configKey: config.key,
        version: config.version
      });

    } catch (error) {
      logger.error('Failed to remove persisted state', error, undefined, {
        configKey: config.key,
        version: config.version
      });
    }
  }

  /**
   * Clear all persisted states with optional prefix filter
   */
  clearAllPersistedStates(prefixFilter?: string): void {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove: string[] = [];
      const fullPrefix = prefixFilter ? `${this.prefix}${prefixFilter}` : this.prefix;

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(fullPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.storage.removeItem(key));
      
      logger.info('Cleared persisted states', undefined, {
        removedCount: keysToRemove.length,
        prefixFilter: prefixFilter || 'all'
      });

    } catch (error) {
      logger.error('Failed to clear persisted states', error, undefined, {
        prefixFilter: prefixFilter || 'all'
      });
    }
  }

  /**
   * Get storage information
   */
  getStorageInfo(): {
    prefix: string;
    totalKeys: number;
    appKeys: number;
    totalSize: number;
    appSize: number;
  } {
    if (typeof window === 'undefined') {
      return {
        prefix: this.prefix,
        totalKeys: 0,
        appKeys: 0,
        totalSize: 0,
        appSize: 0
      };
    }

    let totalKeys = 0;
    let appKeys = 0;
    let totalSize = 0;
    let appSize = 0;

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          totalKeys++;
          const value = this.storage.getItem(key) || '';
          const size = key.length + value.length;
          totalSize += size;

          if (key.startsWith(this.prefix)) {
            appKeys++;
            appSize += size;
          }
        }
      }
    } catch (error) {
      logger.error('Failed to get storage info', error);
    }

    return {
      prefix: this.prefix,
      totalKeys,
      appKeys,
      totalSize,
      appSize
    };
  }
}

// Default persistence configurations for different stores
export const persistenceConfigs = {
  // Theme store persistence
  theme: {
    key: 'theme',
    version: 1,
    whitelist: ['theme']
  } as PersistenceConfig,

  // Notification store persistence
  notification: {
    key: 'notification',
    version: 1,
    whitelist: ['isEnabled']
  } as PersistenceConfig,

  // Chat store persistence
  chat: {
    key: 'chat',
    version: 1,
    blacklist: ['isLoading', 'isSending', 'error']
  } as PersistenceConfig,

  // Generic store persistence with migration example
  migrated: {
    key: 'migrated_store',
    version: 2,
    migrate: (persistedState: any, version: number) => {
      if (version < 2) {
        // Handle migration from v1 to v2
        return {
          ...persistedState,
          migratedAt: Date.now()
        };
      }
      return persistedState;
    }
  } as PersistenceConfig
};

// Export singleton instance
export const storePersistence = StorePersistence.getInstance();

// Convenience functions
export function getPersistedState<T>(config: PersistenceConfig): T | null {
  return storePersistence.getPersistedState<T>(config);
}

export function persistState<T>(config: PersistenceConfig, state: T): boolean {
  return storePersistence.persistState(config, state);
}

export function removePersistedState(config: PersistenceConfig): void {
  storePersistence.removePersistedState(config);
}

export function clearAllPersistedStates(prefixFilter?: string): void {
  storePersistence.clearAllPersistedStates(prefixFilter);
}


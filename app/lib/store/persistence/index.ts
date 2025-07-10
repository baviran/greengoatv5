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
   * Generate storage key based on config and user context
   */
  private generateKey(config: PersistenceConfig, userId?: string): string {
    const baseKey = `${this.prefix}${config.key}_v${config.version}`;
    return config.userSpecific && userId ? `${baseKey}_${userId}` : baseKey;
  }

  /**
   * Get persisted state from storage
   */
  getPersistedState<T>(config: PersistenceConfig, userId?: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const key = this.generateKey(config, userId);
      const stored = this.storage.getItem(key);
      
      if (!stored) return null;

      const parsedData = JSON.parse(stored);
      
      // Check if migration is needed
      if (parsedData.version !== config.version && config.migrate) {
        logger.info('Migrating persisted state', undefined, {
          key,
          fromVersion: parsedData.version,
          toVersion: config.version
        });
        
        const migratedData = config.migrate(parsedData.state, parsedData.version);
        this.persistState(config, migratedData, userId);
        return migratedData;
      }

      return parsedData.state;
    } catch (error) {
      logger.error('Error getting persisted state', error as Error, undefined, {
        key: config.key,
        userId,
        userSpecific: config.userSpecific
      });
      return null;
    }
  }

  /**
   * Persist state to storage
   */
  persistState<T>(config: PersistenceConfig, state: T, userId?: string): void {
    if (typeof window === 'undefined') return;

    try {
      const key = this.generateKey(config, userId);
      let stateToStore = state;

      // Apply whitelist/blacklist filtering
      if (config.whitelist || config.blacklist) {
        stateToStore = this.filterState(state, config.whitelist, config.blacklist);
      }

      const dataToStore = {
        version: config.version,
        state: stateToStore,
        timestamp: Date.now()
      };

      this.storage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      logger.error('Error persisting state', error as Error, undefined, {
        key: config.key,
        userId,
        userSpecific: config.userSpecific
      });
    }
  }

  /**
   * Filter state based on whitelist/blacklist
   */
  private filterState<T>(state: T, whitelist?: string[], blacklist?: string[]): T {
    if (!state || typeof state !== 'object') return state;

    const filtered: any = {};
    const keys = Object.keys(state);

    for (const key of keys) {
      const shouldInclude = whitelist ? whitelist.includes(key) : true;
      const shouldExclude = blacklist ? blacklist.includes(key) : false;

      if (shouldInclude && !shouldExclude) {
        filtered[key] = (state as any)[key];
      }
    }

    return filtered as T;
  }

  /**
   * Clear persisted state
   */
  clearPersistedState(config: PersistenceConfig, userId?: string): void {
    if (typeof window === 'undefined') return;

    try {
      const key = this.generateKey(config, userId);
      this.storage.removeItem(key);
    } catch (error) {
      logger.error('Error clearing persisted state', error as Error, undefined, {
        key: config.key,
        userId,
        userSpecific: config.userSpecific
      });
    }
  }

  /**
   * Clear all persisted states for a user
   */
  clearUserData(userId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(this.storage);
      const userKeys = keys.filter(key => 
        key.startsWith(this.prefix) && key.endsWith(`_${userId}`)
      );

      userKeys.forEach(key => this.storage.removeItem(key));
      
      logger.info('Cleared user data from storage', undefined, {
        userId,
        keysCleared: userKeys.length
      });
    } catch (error) {
      logger.error('Error clearing user data', error as Error, undefined, {
        userId
      });
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { usedSpace: number; totalSpace: number; keys: string[] } {
    if (typeof window === 'undefined') {
      return { usedSpace: 0, totalSpace: 0, keys: [] };
    }

    try {
      const keys = Object.keys(this.storage);
      const storeKeys = keys.filter(key => key.startsWith(this.prefix));
      
      let usedSpace = 0;
      storeKeys.forEach(key => {
        const value = this.storage.getItem(key);
        if (value) {
          usedSpace += key.length + value.length;
        }
      });

      return {
        usedSpace,
        totalSpace: 10 * 1024 * 1024, // 10MB typical localStorage limit
        keys: storeKeys
      };
    } catch (error) {
      logger.error('Error getting storage info', error as Error);
      return { usedSpace: 0, totalSpace: 0, keys: [] };
    }
  }
}

// Default persistence configs for each store
export const persistenceConfigs: Record<string, PersistenceConfig> = {
  auth: {
    key: 'auth',
    version: 1,
    whitelist: ['user', 'isAuthenticated'],
    userSpecific: false
  },
  user: {
    key: 'user',
    version: 1,
    whitelist: ['preferences'],
    userSpecific: true
  },
  thread: {
    key: 'threads',
    version: 2,
    whitelist: ['threads', 'activeThreadId'],
    userSpecific: true,
    migrate: (persistedState: any, version: number) => {
      // Migration logic for threads
      if (version === 1) {
        return {
          ...persistedState,
          threads: persistedState.threads?.map((thread: any) => ({
            ...thread,
            metadata: thread.metadata || {}
          })) || []
        };
      }
      return persistedState;
    }
  },
  theme: {
    key: 'theme',
    version: 1,
    whitelist: ['theme'],
    userSpecific: false
  },
  notification: {
    key: 'notifications',
    version: 1,
    whitelist: ['isEnabled'],
    userSpecific: true
  },
  modal: {
    key: 'modal',
    version: 1,
    blacklist: ['activeModal', 'modalData', 'modalStack'],
    userSpecific: false
  }
};

// Utility function to create persistence middleware
export function createPersistenceMiddleware<T>(
  config: PersistenceConfig,
  getUserId: () => string | undefined
) {
  const persistence = StorePersistence.getInstance();

  return (storeInitializer: any) => (set: any, get: any, api: any) => {
    const store = storeInitializer(
      (...args: any[]) => {
        set(...args);
        // Persist state after each update
        const currentState = get();
        const userId = getUserId();
        persistence.persistState(config, currentState, userId);
      },
      get,
      api
    );

    // Load persisted state on initialization
    const userId = getUserId();
    const persistedState = persistence.getPersistedState<T>(config, userId);
    
    if (persistedState) {
      set(persistedState);
    }

    return store;
  };
}


import { useThemeStore } from './themeStore';
import { useNotificationStore } from './notificationStore';
import { useModalStore } from './modalStore';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'ui-domain'
});

// Export individual stores
export { useThemeStore, useNotificationStore, useModalStore };

// Export utilities
// Note: Individual store utilities are available via the store instances

// Composite UI store interface
export interface UIStore {
  theme: ReturnType<typeof useThemeStore>;
  notification: ReturnType<typeof useNotificationStore>;
  modal: ReturnType<typeof useModalStore>;
}

// Hook to get all UI stores
export const useUIStore = (): UIStore => {
  const theme = useThemeStore();
  const notification = useNotificationStore();
  const modal = useModalStore();

  return {
    theme,
    notification,
    modal
  };
};

// Initialize all UI stores
export const initializeUIStores = async (userId?: string) => {
  const startTime = performance.now();
  
  try {
    logger.info('Initializing UI stores', undefined, { userId });
    
    // Initialize stores in parallel
    const stores = {
      theme: useThemeStore.getState(),
      notification: useNotificationStore.getState(),
      modal: useModalStore.getState()
    };
    
    // Initialize each store
    stores.theme.initialize();
    stores.notification.initialize();
    stores.modal.initialize();
    
    const duration = performance.now() - startTime;
    
    logger.info('UI stores initialized', undefined, {
      userId,
      duration: Math.round(duration),
      stores: Object.keys(stores)
    });
    
  } catch (error) {
    logger.error('Failed to initialize UI stores', error, undefined, { userId });
    throw error;
  }
};

// Reset all UI stores
export const resetUIStores = () => {
  const startTime = performance.now();
  
  try {
    logger.info('Resetting UI stores');
    
    const stores = {
      theme: useThemeStore.getState(),
      notification: useNotificationStore.getState(),
      modal: useModalStore.getState()
    };
    
    // Reset all stores
    stores.theme.reset();
    stores.notification.reset();
    stores.modal.reset();
    
    const duration = performance.now() - startTime;
    
    logger.info('UI stores reset', undefined, {
      duration: Math.round(duration),
      stores: Object.keys(stores)
    });
    
  } catch (error) {
    logger.error('Failed to reset UI stores', error);
    throw error;
  }
};

// Cross-store UI event handlers
export const setupUIEventHandlers = () => {
  logger.debug('Setting up UI event handlers');
  
  // Theme change handlers
  useThemeStore.subscribe(
    (state) => state.theme,
    (theme) => {
      logger.debug('Theme changed', undefined, { theme });
      
      // Update document class for theme
      if (typeof document !== 'undefined') {
        document.documentElement.className = theme === 'dark' ? 'dark' : '';
      }
    }
  );
  
  // Notification handlers
  useNotificationStore.subscribe(
    (state) => state.notifications.length,
    (count) => {
      logger.debug('Notification count changed', undefined, { count });
    }
  );
  
  // Modal handlers
  useModalStore.subscribe(
    (state) => state.modalStack.length,
    (stackLength) => {
      logger.debug('Modal stack changed', undefined, { stackLength });
      
      // Handle body scroll lock
      if (typeof document !== 'undefined') {
        document.body.style.overflow = stackLength > 0 ? 'hidden' : '';
      }
    }
  );
};

// UI utilities and helpers
export const uiHelpers = {
  // Theme helpers
  theme: {
    toggle: () => useThemeStore.getState().toggleTheme(),
    setDark: () => useThemeStore.getState().setTheme('dark'),
    setLight: () => useThemeStore.getState().setTheme('light'),
    isDark: () => useThemeStore.getState().theme === 'dark',
    isLight: () => useThemeStore.getState().theme === 'light'
  },
  
  // Notification helpers
  notification: {
    success: (title: string, message: string, duration?: number) => 
      useNotificationStore.getState().addSuccessNotification(title, message, duration),
    error: (title: string, message: string, duration?: number) => 
      useNotificationStore.getState().addErrorNotification(title, message, duration),
    info: (title: string, message: string, duration?: number) => 
      useNotificationStore.getState().addInfoNotification(title, message, duration),
    warning: (title: string, message: string, duration?: number) => 
      useNotificationStore.getState().addWarningNotification(title, message, duration),
    clear: (id: string) => useNotificationStore.getState().removeNotification(id),
    clearAll: () => useNotificationStore.getState().clearAll()
  },
  
  // Modal helpers
  modal: {
    open: (modalId: string, data?: any) => useModalStore.getState().openModal(modalId, data),
    close: (modalId: string) => useModalStore.getState().closeModal(modalId),
    closeAll: () => useModalStore.getState().closeAllModals(),
    isOpen: (modalId: string) => useModalStore.getState().isModalOpen(modalId),
    getActive: () => useModalStore.getState().activeModal,
    getStack: () => useModalStore.getState().modalStack
  }
};

// React hook for UI helpers
export const useUIHelpers = () => {
  return uiHelpers;
};

// UI selectors
export const uiSelectors = {
  // Theme selectors
  isDarkMode: () => useThemeStore.getState().theme === 'dark',
  currentTheme: () => useThemeStore.getState().theme,
  
  // Notification selectors
  hasNotifications: () => useNotificationStore.getState().notifications.length > 0,
  notificationCount: () => useNotificationStore.getState().notifications.length,
  unreadCount: () => useNotificationStore.getState().notifications.filter(n => !n.isRead).length,
  
  // Modal selectors
  hasOpenModals: () => useModalStore.getState().modalStack.length > 0,
  activeModal: () => useModalStore.getState().activeModal,
  modalCount: () => useModalStore.getState().modalStack.length
};

// React hook for UI selectors
export const useUISelectors = () => {
  return uiSelectors;
}; 
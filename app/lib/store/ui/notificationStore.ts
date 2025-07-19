import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BaseState, BaseActions, NotificationState, NotificationActions, Notification } from '../types';
import { StorePersistence } from '../persistence';
import { StorePerformanceMonitor, eventEmitter, createStoreEvent } from '../utils';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'notification-store'
});

interface NotificationStoreState extends BaseState, NotificationState {
  maxNotifications: number;
  defaultDuration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  soundEnabled: boolean;
}

interface NotificationStoreActions extends BaseActions, NotificationActions {
  setMaxNotifications: (max: number) => void;
  setDefaultDuration: (duration: number) => void;
  setPosition: (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => void;
  setSoundEnabled: (enabled: boolean) => void;
  addSuccessNotification: (title: string, message: string, duration?: number) => void;
  addErrorNotification: (title: string, message: string, duration?: number) => void;
  addWarningNotification: (title: string, message: string, duration?: number) => void;
  addInfoNotification: (title: string, message: string, duration?: number) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
  getNotificationsByType: (type: 'info' | 'success' | 'warning' | 'error') => Notification[];
}

type NotificationStore = NotificationStoreState & NotificationStoreActions;

// Persistence and performance monitoring
const persistence = StorePersistence.getInstance();
const performanceMonitor = StorePerformanceMonitor.getInstance();

const persistenceConfig = {
  key: 'notification_preferences',
  version: 1,
  userSpecific: true,
  whitelist: ['isEnabled', 'maxNotifications', 'defaultDuration', 'position', 'soundEnabled']
};

// Helper functions
const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const playNotificationSound = (type: 'info' | 'success' | 'warning' | 'error') => {
  if (typeof window === 'undefined') return;
  
  // Simple audio feedback using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different notification types
    const frequencies = {
      info: 440,
      success: 523,
      warning: 392,
      error: 311
    };
    
    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch {
    // Ignore audio errors
  }
};

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // Base state
      isInitialized: false,
      lastUpdated: Date.now(),
      
      // Notification state
      notifications: [],
      isEnabled: true,
      maxNotifications: 10,
      defaultDuration: 5000,
      position: 'top-right',
      soundEnabled: true,
      
      // Base actions
      initialize: () => {
        const endMeasure = performanceMonitor.startMeasure('notification.initialize');
        
        try {
          logger.info('Initializing notification store');
          
          // Load persisted preferences
          const persistedData = persistence.getPersistedState<Partial<NotificationStoreState>>(
            persistenceConfig
          );
          
          if (persistedData) {
            set({
              isEnabled: persistedData.isEnabled ?? true,
              maxNotifications: persistedData.maxNotifications ?? 10,
              defaultDuration: persistedData.defaultDuration ?? 5000,
              position: persistedData.position ?? 'top-right',
              soundEnabled: persistedData.soundEnabled ?? true,
              isInitialized: true,
              lastUpdated: Date.now()
            });
          } else {
            set({
              isInitialized: true,
              lastUpdated: Date.now()
            });
          }
          
          logger.info('Notification store initialized', undefined, {
            isEnabled: get().isEnabled,
            maxNotifications: get().maxNotifications,
            position: get().position,
            hadPersistedData: !!persistedData
          });
          
        } catch (initError) {
          logger.error('Failed to initialize notification store', initError);
          set({ isInitialized: true, lastUpdated: Date.now() });
        } finally {
          endMeasure();
        }
      },
      
      reset: () => {
        set({
          notifications: [],
          isEnabled: true,
          maxNotifications: 10,
          defaultDuration: 5000,
          position: 'top-right',
          soundEnabled: true,
          lastUpdated: Date.now()
        });
        
        // Clear persisted preferences
        persistence.removePersistedState(persistenceConfig);
        
        logger.info('Notification store reset to defaults');
      },
      
      // Notification actions
      setEnabled: (enabled: boolean) => {
        const endMeasure = performanceMonitor.startMeasure('notification.setEnabled');
        
        try {
          set({ isEnabled: enabled, lastUpdated: Date.now() });
          
          // Persist setting
          const state = get();
          persistence.persistState(persistenceConfig, {
            isEnabled: enabled,
            maxNotifications: state.maxNotifications,
            defaultDuration: state.defaultDuration,
            position: state.position,
            soundEnabled: state.soundEnabled
          });
          
          logger.info('Notification enabled state updated', undefined, { enabled });
          
        } finally {
          endMeasure();
        }
      },
      
      setMaxNotifications: (max: number) => {
        const endMeasure = performanceMonitor.startMeasure('notification.setMaxNotifications');
        
        try {
          const state = get();
          let notifications = state.notifications;
          
          // Trim notifications if exceeding new max
          if (notifications.length > max) {
            notifications = notifications.slice(-max);
          }
          
          set({ 
            maxNotifications: max, 
            notifications,
            lastUpdated: Date.now() 
          });
          
          // Persist setting
          persistence.persistState(persistenceConfig, {
            isEnabled: state.isEnabled,
            maxNotifications: max,
            defaultDuration: state.defaultDuration,
            position: state.position,
            soundEnabled: state.soundEnabled
          });
          
          logger.info('Max notifications updated', undefined, { max, trimmed: state.notifications.length - notifications.length });
          
        } finally {
          endMeasure();
        }
      },
      
      setDefaultDuration: (duration: number) => {
        const endMeasure = performanceMonitor.startMeasure('notification.setDefaultDuration');
        
        try {
          const state = get();
          set({ defaultDuration: duration, lastUpdated: Date.now() });
          
          // Persist setting
          persistence.persistState(persistenceConfig, {
            isEnabled: state.isEnabled,
            maxNotifications: state.maxNotifications,
            defaultDuration: duration,
            position: state.position,
            soundEnabled: state.soundEnabled
          });
          
          logger.info('Default duration updated', undefined, { duration });
          
        } finally {
          endMeasure();
        }
      },
      
      setPosition: (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
        const endMeasure = performanceMonitor.startMeasure('notification.setPosition');
        
        try {
          const state = get();
          set({ position, lastUpdated: Date.now() });
          
          // Persist setting
          persistence.persistState(persistenceConfig, {
            isEnabled: state.isEnabled,
            maxNotifications: state.maxNotifications,
            defaultDuration: state.defaultDuration,
            position: position,
            soundEnabled: state.soundEnabled
          });
          
          logger.info('Position updated', undefined, { position });
          
        } finally {
          endMeasure();
        }
      },
      
      setSoundEnabled: (enabled: boolean) => {
        const endMeasure = performanceMonitor.startMeasure('notification.setSoundEnabled');
        
        try {
          const state = get();
          set({ soundEnabled: enabled, lastUpdated: Date.now() });
          
          // Persist setting
          persistence.persistState(persistenceConfig, {
            isEnabled: state.isEnabled,
            maxNotifications: state.maxNotifications,
            defaultDuration: state.defaultDuration,
            position: state.position,
            soundEnabled: enabled
          });
          
          logger.info('Sound enabled state updated', undefined, { enabled });
          
        } finally {
          endMeasure();
        }
      },
      
      addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
        const endMeasure = performanceMonitor.startMeasure('notification.addNotification');
        
        try {
          const state = get();
          
          // Don't add if notifications are disabled
          if (!state.isEnabled) {
            logger.debug('Notification skipped - notifications disabled', undefined, { 
              title: notification.title,
              type: notification.type 
            });
            return;
          }
          
          const newNotification: Notification = {
            id: generateNotificationId(),
            createdAt: new Date(),
            isRead: false,
            duration: notification.duration ?? state.defaultDuration,
            ...notification
          };
          
          let notifications = [...state.notifications, newNotification];
          
          // Trim to max notifications (keep newest)
          if (notifications.length > state.maxNotifications) {
            notifications = notifications.slice(-state.maxNotifications);
          }
          
          set({ notifications, lastUpdated: Date.now() });
          
          // Play sound if enabled
          if (state.soundEnabled) {
            playNotificationSound(notification.type);
          }
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent('notification.added', newNotification, 'notification-store'));
          
          // Auto-remove after duration (if duration > 0)
          if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, newNotification.duration);
          }
          
          logger.info('Notification added', undefined, {
            id: newNotification.id,
            type: notification.type,
            title: notification.title,
            duration: newNotification.duration
          });
          
        } finally {
          endMeasure();
        }
      },
      
      removeNotification: (id: string) => {
        const endMeasure = performanceMonitor.startMeasure('notification.removeNotification');
        
        try {
          const state = get();
          const notifications = state.notifications.filter(n => n.id !== id);
          
          set({ notifications, lastUpdated: Date.now() });
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent('notification.removed', { id }, 'notification-store'));
          
          logger.debug('Notification removed', undefined, { id });
          
        } finally {
          endMeasure();
        }
      },
      
      markAsRead: (id: string) => {
        const endMeasure = performanceMonitor.startMeasure('notification.markAsRead');
        
        try {
          const state = get();
          const notifications = state.notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
          );
          
          set({ notifications, lastUpdated: Date.now() });
          
          logger.debug('Notification marked as read', undefined, { id });
          
        } finally {
          endMeasure();
        }
      },
      
      clearAll: () => {
        const endMeasure = performanceMonitor.startMeasure('notification.clearAll');
        
        try {
          const state = get();
          const clearedCount = state.notifications.length;
          
          set({ notifications: [], lastUpdated: Date.now() });
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent('notification.cleared', { count: clearedCount }, 'notification-store'));
          
          logger.info('All notifications cleared', undefined, { count: clearedCount });
          
        } finally {
          endMeasure();
        }
      },
      
      // Convenience methods
      addSuccessNotification: (title: string, message: string, duration?: number) => {
        get().addNotification({ type: 'success', title, message, duration });
      },
      
      addErrorNotification: (title: string, message: string, duration?: number) => {
        get().addNotification({ type: 'error', title, message, duration });
      },
      
      addWarningNotification: (title: string, message: string, duration?: number) => {
        get().addNotification({ type: 'warning', title, message, duration });
      },
      
      addInfoNotification: (title: string, message: string, duration?: number) => {
        get().addNotification({ type: 'info', title, message, duration });
      },
      
      markAllAsRead: () => {
        const endMeasure = performanceMonitor.startMeasure('notification.markAllAsRead');
        
        try {
          const state = get();
          const notifications = state.notifications.map(n => ({ ...n, isRead: true }));
          
          set({ notifications, lastUpdated: Date.now() });
          
          logger.info('All notifications marked as read', undefined, { count: notifications.length });
          
        } finally {
          endMeasure();
        }
      },
      
      getUnreadCount: () => {
        const state = get();
        return state.notifications.filter(n => !n.isRead).length;
      },
      
      getNotificationsByType: (type: 'info' | 'success' | 'warning' | 'error') => {
        const state = get();
        return state.notifications.filter(n => n.type === type);
      }
    })
  )
);

// Export default
export default useNotificationStore; 
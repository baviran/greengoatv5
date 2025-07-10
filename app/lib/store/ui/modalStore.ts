import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BaseState, BaseActions, ModalState, ModalActions } from '../types';
import { StorePerformanceMonitor, eventEmitter, createStoreEvent } from '../utils';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'modal-store'
});

interface ModalConfig {
  id: string;
  component: string;
  data?: any;
  options?: {
    closable?: boolean;
    backdrop?: boolean;
    keyboard?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    position?: 'center' | 'top' | 'bottom';
    animation?: 'fade' | 'slide' | 'zoom';
    zIndex?: number;
  };
  onClose?: () => void;
  onOpen?: () => void;
}

interface ModalStoreState extends BaseState, ModalState {
  modals: ModalConfig[];
  isAnimating: boolean;
  defaultOptions: ModalConfig['options'];
}

interface ModalStoreActions extends BaseActions, ModalActions {
  registerModal: (config: ModalConfig) => void;
  unregisterModal: (modalId: string) => void;
  closeModal: (modalId?: string) => void;
  openModal: (modalId: string, data?: any, options?: ModalConfig['options']) => void;
  setDefaultOptions: (options: ModalConfig['options']) => void;
  getModalConfig: (modalId: string) => ModalConfig | null;
  isModalOpen: (modalId: string) => boolean;
  getTopModal: () => ModalConfig | null;
  closeAllModals: () => void;
  setAnimating: (animating: boolean) => void;
}

type ModalStore = ModalStoreState & ModalStoreActions;

// Performance monitoring
const performanceMonitor = StorePerformanceMonitor.getInstance();

// Helper functions
const generateModalId = (): string => {
  return `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};



const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    // Get the store instance and close the top modal
    const store = useModalStore.getState();
    const topModal = store.getTopModal();
    if (topModal && topModal.options?.keyboard !== false) {
      store.closeModal(topModal.id);
    }
  }
};

// Set up global keyboard event listener
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', handleEscapeKey);
}

export const useModalStore = create<ModalStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // Base state
      isInitialized: false,
      lastUpdated: Date.now(),
      
      // Modal state
      activeModal: null,
      modalData: {},
      modalStack: [],
      modals: [],
      isAnimating: false,
      defaultOptions: {
        closable: true,
        backdrop: true,
        keyboard: true,
        size: 'md',
        position: 'center',
        animation: 'fade',
        zIndex: 1000
      },
      
      // Base actions
      initialize: () => {
        const endMeasure = performanceMonitor.startMeasure('modal.initialize');
        
        try {
          logger.info('Initializing modal store');
          
          set({
            isInitialized: true,
            lastUpdated: Date.now()
          });
          
          logger.info('Modal store initialized');
          
        } catch (error) {
          logger.error('Failed to initialize modal store', error);
          set({ isInitialized: true, lastUpdated: Date.now() });
        } finally {
          endMeasure();
        }
      },
      
      reset: () => {
        const state = get();
        
        // Close all modals first
        state.modalStack.forEach(modalId => {
          const modal = state.modals.find(m => m.id === modalId);
          if (modal?.onClose) {
            modal.onClose();
          }
        });
        
        set({
          activeModal: null,
          modalData: {},
          modalStack: [],
          modals: [],
          isAnimating: false,
          lastUpdated: Date.now()
        });
        
        logger.info('Modal store reset');
      },
      
      // Modal registration
      registerModal: (config: ModalConfig) => {
        const endMeasure = performanceMonitor.startMeasure('modal.registerModal');
        
        try {
          const state = get();
          const existingIndex = state.modals.findIndex(m => m.id === config.id);
          
          let modals;
          if (existingIndex >= 0) {
            // Update existing modal
            modals = [...state.modals];
            modals[existingIndex] = {
              ...modals[existingIndex],
              ...config,
              options: { ...state.defaultOptions, ...config.options }
            };
          } else {
            // Add new modal
            modals = [...state.modals, {
              ...config,
              options: { ...state.defaultOptions, ...config.options }
            }];
          }
          
          set({ modals, lastUpdated: Date.now() });
          
          logger.info('Modal registered', undefined, {
            modalId: config.id,
            component: config.component,
            isUpdate: existingIndex >= 0
          });
          
        } finally {
          endMeasure();
        }
      },
      
      unregisterModal: (modalId: string) => {
        const endMeasure = performanceMonitor.startMeasure('modal.unregisterModal');
        
        try {
          const state = get();
          
          // Close modal if it's open
          if (state.modalStack.includes(modalId)) {
            get().closeModal(modalId);
          }
          
          // Remove from modals
          const modals = state.modals.filter(m => m.id !== modalId);
          set({ modals, lastUpdated: Date.now() });
          
          logger.info('Modal unregistered', undefined, { modalId });
          
        } finally {
          endMeasure();
        }
      },
      
      // Modal operations
      openModal: (modalId: string, data?: any, options?: ModalConfig['options']) => {
        const endMeasure = performanceMonitor.startMeasure('modal.openModal');
        
        try {
          const state = get();
          const modal = state.modals.find(m => m.id === modalId);
          
          if (!modal) {
            logger.warn('Attempted to open unregistered modal', undefined, { modalId });
            return;
          }
          
          // Don't open if already open
          if (state.modalStack.includes(modalId)) {
            logger.debug('Modal already open', undefined, { modalId });
            return;
          }
          
          // Merge modal data
          const modalData = {
            ...state.modalData,
            [modalId]: { ...modal.data, ...data }
          };
          
          // Update modal options if provided
          if (options) {
            const modals = state.modals.map(m => 
              m.id === modalId 
                ? { ...m, options: { ...m.options, ...options } }
                : m
            );
            set({ modals });
          }
          
          // Add to stack
          const modalStack = [...state.modalStack, modalId];
          
          set({
            activeModal: modalId,
            modalData,
            modalStack,
            lastUpdated: Date.now()
          });
          
          // Call onOpen callback
          if (modal.onOpen) {
            modal.onOpen();
          }
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent('modal.opened', { modalId, data }, 'modal-store'));
          
          logger.info('Modal opened', undefined, {
            modalId,
            stackSize: modalStack.length,
            hasData: !!data
          });
          
        } finally {
          endMeasure();
        }
      },
      
      closeModal: (modalId?: string) => {
        const endMeasure = performanceMonitor.startMeasure('modal.closeModal');
        
        try {
          const state = get();
          
          // If no modalId provided, close the top modal
          const targetModalId = modalId || state.activeModal;
          
          if (!targetModalId) {
            logger.debug('No modal to close');
            return;
          }
          
          const modal = state.modals.find(m => m.id === targetModalId);
          
          if (!state.modalStack.includes(targetModalId)) {
            logger.debug('Attempted to close non-open modal', undefined, { modalId: targetModalId });
            return;
          }
          
          // Remove from stack
          const modalStack = state.modalStack.filter(id => id !== targetModalId);
          
          // Clear modal data
          const modalData = { ...state.modalData };
          delete modalData[targetModalId];
          
          // Update active modal to the top of remaining stack
          const activeModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
          
          set({
            activeModal,
            modalData,
            modalStack,
            lastUpdated: Date.now()
          });
          
          // Call onClose callback
          if (modal?.onClose) {
            modal.onClose();
          }
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent('modal.closed', { modalId: targetModalId }, 'modal-store'));
          
          logger.info('Modal closed', undefined, {
            modalId: targetModalId,
            stackSize: modalStack.length,
            newActiveModal: activeModal
          });
          
        } finally {
          endMeasure();
        }
      },
      
      closeAllModals: () => {
        const endMeasure = performanceMonitor.startMeasure('modal.closeAllModals');
        
        try {
          const state = get();
          const closedModals = [...state.modalStack];
          
          // Call onClose for all modals
          closedModals.forEach(modalId => {
            const modal = state.modals.find(m => m.id === modalId);
            if (modal?.onClose) {
              modal.onClose();
            }
          });
          
          set({
            activeModal: null,
            modalData: {},
            modalStack: [],
            lastUpdated: Date.now()
          });
          
          // Emit event for cross-store communication
          eventEmitter.emit(createStoreEvent('modal.allClosed', { count: closedModals.length }, 'modal-store'));
          
          logger.info('All modals closed', undefined, { count: closedModals.length });
          
        } finally {
          endMeasure();
        }
      },
      
      setModalData: (modalId: string, data: any) => {
        const endMeasure = performanceMonitor.startMeasure('modal.setModalData');
        
        try {
          const state = get();
          const modalData = {
            ...state.modalData,
            [modalId]: { ...state.modalData[modalId], ...data }
          };
          
          set({ modalData, lastUpdated: Date.now() });
          
          logger.debug('Modal data updated', undefined, { modalId, hasData: !!data });
          
        } finally {
          endMeasure();
        }
      },
      
      setDefaultOptions: (options: ModalConfig['options']) => {
        const endMeasure = performanceMonitor.startMeasure('modal.setDefaultOptions');
        
        try {
          const state = get();
          const defaultOptions = { ...state.defaultOptions, ...options };
          
          set({ defaultOptions, lastUpdated: Date.now() });
          
          logger.info('Default modal options updated', undefined, { options });
          
        } finally {
          endMeasure();
        }
      },
      
      setAnimating: (animating: boolean) => {
        set({ isAnimating: animating, lastUpdated: Date.now() });
      },
      
      // Utility methods
      getModalConfig: (modalId: string) => {
        const state = get();
        return state.modals.find(m => m.id === modalId) || null;
      },
      
      isModalOpen: (modalId: string) => {
        const state = get();
        return state.modalStack.includes(modalId);
      },
      
      getTopModal: () => {
        const state = get();
        if (state.modalStack.length === 0) return null;
        
        const topModalId = state.modalStack[state.modalStack.length - 1];
        return state.modals.find(m => m.id === topModalId) || null;
      }
    })
  )
);

// Helper functions for components
export const createModalId = (name: string): string => {
  return `${name}_${generateModalId()}`;
};

export const useModalHelpers = () => {
  const store = useModalStore();
  
  return {
    openModal: store.openModal,
    closeModal: store.closeModal,
    isOpen: store.isModalOpen,
    getConfig: store.getModalConfig,
    setData: store.setModalData
  };
};

// Export default
export default useModalStore; 
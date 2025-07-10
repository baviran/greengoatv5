import { useChatStore as useMainChatStore } from '../chatStore';
import { Logger } from '../../utils/logger';

const logger = Logger.getInstance().withContext({
  component: 'chat-domain'
});

// Re-export the main chat store
export { useChatStore } from '../chatStore';

// Export for backward compatibility
export const useChat = () => {
  return useMainChatStore();
};

// Initialize chat stores
export const initializeChatStores = async (userId?: string) => {
  const startTime = performance.now();
  
  try {
    logger.info('Initializing chat stores', undefined, { userId });
    
    const chatStore = useMainChatStore.getState();
    
    // Initialize chat store with user context
    if (typeof chatStore.initializeStore === 'function') {
      chatStore.initializeStore(userId ? { uid: userId } : null);
    }
    
    const duration = performance.now() - startTime;
    
    logger.info('Chat stores initialized', undefined, {
      userId,
      duration: Math.round(duration)
    });
    
  } catch (error) {
    logger.error('Failed to initialize chat stores', error, undefined, { userId });
    throw error;
  }
};

// Reset chat stores
export const resetChatStores = () => {
  const startTime = performance.now();
  
  try {
    logger.info('Resetting chat stores');
    
    const chatStore = useMainChatStore.getState();
    
    // Clear chat data
    if (typeof chatStore.clearChat === 'function') {
      chatStore.clearChat();
    }
    
    const duration = performance.now() - startTime;
    
    logger.info('Chat stores reset', undefined, {
      duration: Math.round(duration)
    });
    
  } catch (error) {
    logger.error('Failed to reset chat stores', error);
    throw error;
  }
};

// Cross-store chat event handlers
export const setupChatEventHandlers = () => {
  logger.debug('Setting up chat event handlers');
  
  // Active thread handlers
  useMainChatStore.subscribe(
    (state) => {
      logger.debug('Active thread changed', undefined, { 
        threadId: state.activeThreadId,
        isLoading: state.isLoading,
        isSending: state.isSending
      });
    }
  );
};

// Chat utilities and helpers
export const chatHelpers = {
  // Thread helpers
  createThread: (title?: string) => useMainChatStore.getState().createNewThread(title),
  setActiveThread: (threadId: string) => useMainChatStore.getState().setActiveThread(threadId),
  getActiveThread: () => useMainChatStore.getState().activeThreadId,
  
  // Message helpers
  sendMessage: (content: string, threadId?: string) => {
    const chatStore = useMainChatStore.getState();
    const targetThreadId = threadId || chatStore.activeThreadId;
    if (targetThreadId) {
      return chatStore.sendMessage(targetThreadId, content);
    }
    throw new Error('No active thread to send message to');
  },
  
  // Connection helpers
  isOnline: () => !useMainChatStore.getState().error,
  getError: () => useMainChatStore.getState().error
};

// React hook for chat helpers
export const useChatHelpers = () => {
  return chatHelpers;
};

// Chat selectors
export const chatSelectors = {
  // Thread selectors
  activeThreadId: () => useMainChatStore.getState().activeThreadId,
  hasActiveThread: () => !!useMainChatStore.getState().activeThreadId,
  threadCount: () => useMainChatStore.getState().threads?.length || 0,
  
  // Message selectors
  activeThreadMessages: () => {
    const chatStore = useMainChatStore.getState();
    if (!chatStore.activeThreadId) return [];
    return chatStore.messagesByThread?.[chatStore.activeThreadId] || [];
  },
  
  // Connection selectors
  hasError: () => !!useMainChatStore.getState().error,
  isSending: () => useMainChatStore.getState().isSending || false,
  isLoading: () => useMainChatStore.getState().isLoading || false
};

// React hook for chat selectors
export const useChatSelectors = () => {
  return chatSelectors;
}; 
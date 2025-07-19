import React from "react";
import { create } from "zustand";
import { Message, Thread } from "@/app/types/chat";
import { Logger } from "@/app/lib/utils/logger";

const logger = Logger.getInstance().withContext({
  component: 'chat-store'
});

// Local storage keys
const STORAGE_KEY_PREFIX = "greengoat_chat_";
const STORAGE_VERSION = "v2";

// Storage interfaces
interface StoredChatData {
  threads: Thread[];
  lastUpdated: number;
}

// Helper functions for local storage
const getStorageKey = (assistantId: string) => {
  return `${STORAGE_KEY_PREFIX}${assistantId}_${STORAGE_VERSION}`;
};

const getStoredThreads = (assistantId: string): Thread[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = getStorageKey(assistantId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const data: StoredChatData = JSON.parse(stored);
      return data.threads || [];
    }
  } catch (error) {
    logger.error('Failed to load threads from storage', error);
  }
  return [];
};

const storeThreads = (assistantId: string, threads: Thread[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getStorageKey(assistantId);
    const data: StoredChatData = {
      threads,
      lastUpdated: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
    logger.debug('Threads stored successfully', undefined, {
      assistantId,
      threadCount: threads.length
    });
  } catch (error) {
    logger.error('Failed to store threads', error);
  }
};

const clearOldStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('greengoat_chat_') && !key.includes('_v2')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      logger.info('Cleared old storage format', undefined, { removedKeys: keysToRemove.length });
    }
  } catch (error) {
    logger.error('Failed to clear old storage', error);
  }
};

// Store interfaces
interface ChatState {
  // Thread and message data
  messagesByThread: Record<string, Message[]>;
  activeThreadId: string | null;
  threads: Thread[];
  
  // UI state
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  
  // Configuration
  defaultAssistantId: string;
  
  // Initialization state
  isInitialized: boolean;
}

interface ChatActions {
  // Initialization
  initializeStore: () => void;
  
  // Thread management
  setActiveThread: (threadId: string | null) => void;
  addThread: (thread: Thread) => void;
  updateThread: (threadId: string, updates: Partial<Thread>) => void;
  deleteThread: (threadId: string) => void;
  createNewThread: (title?: string) => Promise<string>;
  
  // Message management
  addMessage: (threadId: string, message: Message) => void;
  getMessagesForThread: (threadId: string) => Message[];
  loadMessagesForThread: (threadId: string) => Promise<void>;
  sendMessage: (content: string, threadId?: string) => Promise<void>;
  
  // UI state management
  setIsLoading: (isLoading: boolean) => void;
  setIsSending: (isSending: boolean) => void;
  setError: (error: string | null) => void;
  
  // Feedback
  submitFeedback: (messageId: string, thumbsUp: boolean, comment?: string) => Promise<void>;
  
  // Utility
  clearChat: () => void;
  syncWithLocalStorage: () => void;
  getUserThreads: () => Thread[];
}

export type ChatStore = ChatState & ChatActions;

const DEFAULT_ASSISTANT_ID = "asst_4OCphfGQ5emHha8ERVPYOjl6";

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messagesByThread: {},
  activeThreadId: null,
  threads: [],
  isLoading: false,
  isSending: false,
  defaultAssistantId: DEFAULT_ASSISTANT_ID,
  error: null,
  isInitialized: false,

  // Initialization
  initializeStore: () => {
    if (get().isInitialized) return;
    
    logger.info('Initializing chat store');
    
    // Clear old storage format
    clearOldStorage();
    
    const state = get();
    const storedThreads = getStoredThreads(state.defaultAssistantId);
    
    set({
      threads: storedThreads,
      messagesByThread: {},
      isInitialized: true
    });

    logger.info('Chat store initialized successfully', undefined, {
      threadsLoaded: storedThreads.length,
      hasActiveThread: storedThreads.length > 0
    });
  },

  // Thread management
  setActiveThread: (threadId: string | null) => {
    logger.debug('Setting active thread', undefined, { threadId });
    set({ activeThreadId: threadId, error: null });
    
    if (threadId) {
      get().loadMessagesForThread(threadId);
    }
  },

  addThread: (thread: Thread) => {
    const threads = [thread, ...get().threads];
    set({ threads });
    
    const state = get();
    storeThreads(state.defaultAssistantId, threads);
    
    logger.info('Thread added', undefined, {
      threadId: thread.id,
      title: thread.title,
      totalThreads: threads.length
    });
  },

  updateThread: (threadId: string, updates: Partial<Thread>) => {
    const threads = get().threads.map(thread => 
      thread.id === threadId ? { ...thread, ...updates } : thread
    );
    set({ threads });
    
    const state = get();
    storeThreads(state.defaultAssistantId, threads);
    
    logger.debug('Thread updated', undefined, { threadId, updates });
  },

  deleteThread: (threadId: string) => {
    const threads = get().threads.filter(thread => thread.id !== threadId);
    const messagesByThread = { ...get().messagesByThread };
    delete messagesByThread[threadId];
    
    set({ 
      threads, 
      messagesByThread,
      activeThreadId: get().activeThreadId === threadId ? null : get().activeThreadId
    });
    
    const state = get();
    storeThreads(state.defaultAssistantId, threads);
    
    logger.info('Thread deleted', undefined, { threadId, remainingThreads: threads.length });
  },

  createNewThread: async (title?: string): Promise<string> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch('/api/threads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || 'New Conversation',
          assistantId: get().defaultAssistantId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.threadId) {
        throw new Error(data.error?.message || 'Failed to create thread');
      }

      const newThread: Thread = {
        id: data.data.threadId,
        title: title || 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      get().addThread(newThread);
      
      logger.info('Thread created successfully', undefined, {
        threadId: newThread.id,
        title: newThread.title
      });

      return newThread.id;
    } catch (error) {
      logger.error('Failed to create thread', error);
      set({ error: 'Failed to create new conversation' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Message management
  addMessage: (threadId: string, message: Message) => {
    const messagesByThread = { ...get().messagesByThread };
    if (!messagesByThread[threadId]) {
      messagesByThread[threadId] = [];
    }
    messagesByThread[threadId] = [...messagesByThread[threadId], message];
    set({ messagesByThread });
    
         logger.debug('Message added', undefined, {
       threadId,
       messageId: message.id,
       sender: message.sender
     });
  },

  getMessagesForThread: (threadId: string): Message[] => {
    return get().messagesByThread[threadId] || [];
  },

  loadMessagesForThread: async (threadId: string): Promise<void> => {
    if (get().messagesByThread[threadId]) {
      return; // Already loaded
    }

    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load messages');
      }

      const messages = data.data?.messages || [];
      const messagesByThread = { ...get().messagesByThread };
      messagesByThread[threadId] = messages;
      set({ messagesByThread });

      logger.info('Messages loaded for thread', undefined, {
        threadId,
        messageCount: messages.length
      });
    } catch (error) {
      logger.error('Failed to load messages for thread', error, undefined, { threadId });
      set({ error: 'Failed to load messages' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string, threadId?: string): Promise<void> => {
    try {
      set({ isSending: true, error: null });

      let currentThreadId = threadId || get().activeThreadId;
      
      // Create new thread if none exists
      if (!currentThreadId) {
        currentThreadId = await get().createNewThread();
        get().setActiveThread(currentThreadId);
      }

             // Add user message immediately
       const userMessage: Message = {
         id: `user_${Date.now()}`,
         sender: 'user',
         text: content,
         timestamp: new Date().toISOString(),
         threadId: currentThreadId
       };
      
      get().addMessage(currentThreadId, userMessage);

      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          threadId: currentThreadId,
          assistantId: get().defaultAssistantId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

             // Add assistant response
       if (data.data?.response) {
         const assistantMessage: Message = {
           id: `assistant_${Date.now()}`,
           sender: 'assistant', 
           text: data.data.response,
           timestamp: new Date().toISOString(),
           threadId: currentThreadId,
           runId: data.data.runId
         };
        
        get().addMessage(currentThreadId, assistantMessage);
      }

      // Update thread title if this was the first message
      const thread = get().threads.find(t => t.id === currentThreadId);
      if (thread && thread.title === 'New Conversation') {
        const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        get().updateThread(currentThreadId, { title: newTitle });
      }

      logger.info('Message sent successfully', undefined, {
        threadId: currentThreadId,
        messageLength: content.length
      });
    } catch (error) {
      logger.error('Failed to send message', error);
      set({ error: 'Failed to send message' });
      throw error;
    } finally {
      set({ isSending: false });
    }
  },

  // Feedback
  submitFeedback: async (messageId: string, thumbsUp: boolean, comment?: string): Promise<void> => {
    try {
      // Find the message to get runId
      const state = get();
      let message: Message | undefined;
      
      for (const threadMessages of Object.values(state.messagesByThread)) {
        message = threadMessages.find(m => m.id === messageId);
        if (message) break;
      }
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      if (!message.runId) {
        throw new Error('Cannot submit feedback: message has no runId');
      }
      
      const rating = thumbsUp ? 'like' : 'dislike';
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          runId: message.runId,
          rating,
          comment
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to submit feedback');
      }

      logger.info('Feedback submitted successfully', undefined, {
        messageId,
        runId: message.runId,
        rating,
        hasComment: !!comment
      });
    } catch (error) {
      logger.error('Failed to submit feedback', error);
      throw error;
    }
  },

  // UI state management
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setIsSending: (isSending: boolean) => set({ isSending }),
  setError: (error: string | null) => set({ error }),

  // Utility functions
  clearChat: () => {
    set({
      messagesByThread: {},
      activeThreadId: null,
      threads: [],
      error: null
    });
    
    const state = get();
    storeThreads(state.defaultAssistantId, []);
    
    logger.info('Chat cleared');
  },

  syncWithLocalStorage: () => {
    const state = get();
    storeThreads(state.defaultAssistantId, state.threads);
    logger.debug('Synced with local storage');
  },

  getUserThreads: () => {
    return get().threads;
  }
}));

// Public hook for chat store (replaces useAuthenticatedChatStore)
export const usePublicChatStore = () => {
  return useChatStore();
};

// For backward compatibility during migration
export const useAuthenticatedChatStore = usePublicChatStore;
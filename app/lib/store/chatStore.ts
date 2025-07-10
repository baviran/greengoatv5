import React from "react";
import { create } from "zustand";
import { Message, Thread, UserContext } from "@/app/types/chat";
import { useAuthContext } from "@/context/auth-context";
import { Logger } from "@/app/lib/utils/logger";

const logger = Logger.getInstance().withContext({
  component: 'chat-store'
});

// localStorage keys
const THREADS_STORAGE_KEY = 'chat_threads_v2'; // Incremented version for user-specific storage

// Helper functions for localStorage - now user-specific
const getStoredThreads = (assistantId: string, userId?: string): Thread[] => {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const stored = localStorage.getItem(`${THREADS_STORAGE_KEY}_${assistantId}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Error parsing stored threads', error, undefined, {
      assistantId,
      userId,
      storageKey: `${THREADS_STORAGE_KEY}_${assistantId}_${userId}`
    });
    return [];
  }
};

const saveThreadsToStorage = (assistantId: string, threads: Thread[], userId?: string) => {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${THREADS_STORAGE_KEY}_${assistantId}_${userId}`, JSON.stringify(threads));
  } catch (error) {
    logger.error('Error saving threads to localStorage', error, undefined, {
      assistantId,
      userId,
      threadsCount: threads.length,
      storageKey: `${THREADS_STORAGE_KEY}_${assistantId}_${userId}`
    });
  }
};

// Helper function to clear old localStorage entries when user changes
const clearOldStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    const removedKeys: string[] = [];
    keys.forEach(key => {
      if (key.startsWith('chat_threads_v1_')) {
        localStorage.removeItem(key);
        removedKeys.push(key);
      }
    });
    if (removedKeys.length > 0) {
      logger.debug('Cleared old storage keys', undefined, {
        removedKeys,
        count: removedKeys.length
      });
    }
  } catch (error) {
    logger.error('Error clearing old storage', error);
  }
};

interface ChatState {
  // Messages organized by thread ID
  messagesByThread: Record<string, Message[]>;
  // Currently active thread
  activeThreadId: string | null;
  // Available threads (filtered by user)
  threads: Thread[];
  // Loading states
  isLoading: boolean;
  isSending: boolean;
  // Default assistant ID
  defaultAssistantId: string;
  // Error state
  error: string | null;
  // Initialization state
  isInitialized: boolean;
  // User context
  userContext: UserContext | null;
}

interface ChatActions {
  // Initialization
  initializeStore: (userContext?: UserContext | null) => void;
  setUserContext: (userContext: UserContext | null) => void;
  
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
  
  // Chat interactions
  sendMessage: (message: string, threadId?: string) => Promise<void>;
  
  // Feedback
  submitFeedback: (messageId: string, runId: string, threadId: string, rating: 'like' | 'dislike', comment?: string) => Promise<void>;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility
  clearChat: () => void;
  syncWithLocalStorage: () => void;
  
  // User-specific data management
  clearUserData: () => void;
  getUserThreads: () => Thread[];
}

export type ChatStore = ChatState & ChatActions;

const DEFAULT_ASSISTANT_ID = "asst_4OCphfGQ5emHha8ERVPYOjl6";

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  // Import Firebase auth directly to get the current user's token
  if (typeof window !== 'undefined') {
    try {
      const { auth } = await import('@/lib/firebase');
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken(true);
      }
    } catch (error) {
      logger.error('Error getting auth token', error, undefined, {
        hasWindow: typeof window !== 'undefined'
      });
    }
  }
  return null;
};

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
  userContext: null,

  // Initialization
  initializeStore: (userContext?: UserContext | null) => {
    if (get().isInitialized && get().userContext?.uid === userContext?.uid) return;
    
    logger.info('Initializing chat store', undefined, {
      userId: userContext?.uid,
      userEmail: userContext?.email,
      isReinitialization: get().isInitialized
    });
    
    // Clear old storage format
    clearOldStorage();
    
    const state = get();
    const storedThreads = getStoredThreads(state.defaultAssistantId, userContext?.uid);
    
    // Filter threads to only show user's threads
    const userThreads = storedThreads.filter(thread => 
      !userContext || !thread.userId || thread.userId === userContext.uid
    );
    
    set({
      threads: userThreads,
      messagesByThread: {},
      isInitialized: true,
      userContext: userContext || null
    });

    logger.info('Chat store initialized successfully', undefined, {
      userId: userContext?.uid,
      threadsLoaded: userThreads.length,
      hasActiveThread: userThreads.length > 0
    });

    if (userThreads.length > 0) {
      get().setActiveThread(userThreads[0].id);
    }
  },

  setUserContext: (userContext: UserContext | null) => {
    const currentUser = get().userContext;
    if (currentUser?.uid === userContext?.uid) return;
    
    logger.info('Setting user context', undefined, {
      previousUserId: currentUser?.uid,
      newUserId: userContext?.uid,
      isUserChange: currentUser?.uid !== userContext?.uid
    });
    
    // Clear current data when user changes
    if (currentUser?.uid !== userContext?.uid) {
      get().clearUserData();
    }
    
    set({ userContext });
    
    // Reinitialize with new user context
    get().initializeStore(userContext);
  },

  setActiveThread: (threadId: string | null) => {
    const state = get();
    
    logger.info('Setting active thread', undefined, {
      userId: state.userContext?.uid,
      newActiveThreadId: threadId,
      previousActiveThreadId: state.activeThreadId,
      hasExistingMessages: threadId ? !!state.messagesByThread[threadId] : false,
      willLoadMessages: threadId && !state.messagesByThread[threadId]
    });
    
    set({ activeThreadId: threadId, error: null });

    if (threadId && !get().messagesByThread[threadId]) {
      get().loadMessagesForThread(threadId);
    }
  },

  addThread: (thread: Thread) => {
    const state = get();
    const userContext = state.userContext;
    
    // Add user context to thread
    const threadWithUser: Thread = {
      ...thread,
      userId: userContext?.uid,
      userEmail: userContext?.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const newThreads = [threadWithUser, ...state.threads];
    
    set({
      threads: newThreads,
      messagesByThread: {
        ...state.messagesByThread,
        [thread.id]: []
      }
    });
    
    // Save to localStorage with user context
    saveThreadsToStorage(state.defaultAssistantId, newThreads, userContext?.uid);
    
    logger.info('Thread added successfully', undefined, {
      userId: userContext?.uid,
      threadId: thread.id,
      threadTitle: thread.title,
      totalThreads: newThreads.length
    });
  },

  updateThread: (threadId: string, updates: Partial<Thread>) => {
    const state = get();
    const userContext = state.userContext;
    
    const updatedThreads = state.threads.map(thread =>
      thread.id === threadId ? { 
        ...thread, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      } : thread
    );
    
    set({ threads: updatedThreads });
    saveThreadsToStorage(state.defaultAssistantId, updatedThreads, userContext?.uid);
    
    logger.info('Thread updated successfully', undefined, {
      userId: userContext?.uid,
      threadId: threadId,
      updates: Object.keys(updates)
    });
  },

  deleteThread: (threadId: string) => {
    const state = get();
    const userContext = state.userContext;
    
    // Only allow deletion of user's own threads
    const threadToDelete = state.threads.find(t => t.id === threadId);
    if (threadToDelete && threadToDelete.userId && threadToDelete.userId !== userContext?.uid) {
      logger.warn('User attempted to delete thread belonging to another user', undefined, {
        userId: userContext?.uid,
        threadId: threadId,
        threadOwnerId: threadToDelete.userId
      });
      return;
    }
    
    const newThreads = state.threads.filter(thread => thread.id !== threadId);
    const newMessagesByThread = { ...state.messagesByThread };
    delete newMessagesByThread[threadId];
    
    set({
      threads: newThreads,
      messagesByThread: newMessagesByThread,
      activeThreadId: state.activeThreadId === threadId ? 
        (newThreads.length > 0 ? newThreads[0].id : null) : state.activeThreadId
    });
    
    // Save to localStorage
    saveThreadsToStorage(state.defaultAssistantId, newThreads, userContext?.uid);
    
    logger.info('Thread deleted successfully', undefined, {
      userId: userContext?.uid,
      threadId: threadId,
      remainingThreads: newThreads.length,
      newActiveThread: state.activeThreadId === threadId ? 
        (newThreads.length > 0 ? newThreads[0].id : null) : state.activeThreadId
    });
  },

  createNewThread: async (title?: string): Promise<string> => {
    try {
      set({ isLoading: true, error: null });
      
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Create thread on OpenAI first
      const response = await fetch('/api/threads/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assistantId: get().defaultAssistantId
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('אנא התחבר כדי ליצור שיחה חדשה');
        }
        throw new Error('Failed to create thread on OpenAI');
      }

      const data = await response.json();
      const realThreadId = data.data?.threadId || data.threadId;
      
      if (!realThreadId) {
        throw new Error('No thread ID returned from OpenAI');
      }

      // Now create the thread in our local store with the real OpenAI thread ID
      const newThread: Thread = {
        id: realThreadId,
        title: title || `שיחה חדשה`
      };
      
      get().addThread(newThread);
      get().setActiveThread(realThreadId);
      
      return realThreadId;
      
    } catch (error) {
      logger.error('Error creating new thread', error, undefined, {
        userId: get().userContext?.uid,
        assistantId: get().defaultAssistantId,
        title: title
      });
      set({ error: error instanceof Error ? error.message : 'Failed to create thread' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Message management
  addMessage: (threadId: string, message: Message) => {
    const state = get();
    const userContext = state.userContext;
    const currentMessages = state.messagesByThread[threadId] || [];
    
    // Add user context to message
    const messageWithUser: Message = {
      ...message,
      userId: userContext?.uid,
      userEmail: userContext?.email
    };
    
    const updatedMessagesByThread = {
      ...state.messagesByThread,
      [threadId]: [...currentMessages, messageWithUser]
    };

    set({ messagesByThread: updatedMessagesByThread });
    
    // Update thread title if it's a new thread with generic name and this is the first user message
    if (message.sender === 'user' && currentMessages.length === 0) {
      const thread = state.threads.find(t => t.id === threadId);
      if (thread && (thread.title.startsWith('New Chat') || thread.title === 'שיחה חדשה')) {
        get().updateThread(threadId, { 
          title: message.text.slice(0, 50) + (message.text.length > 50 ? '...' : '') 
        });
      }
    }
    
    logger.info('Message added to thread', undefined, {
      userId: userContext?.uid,
      threadId: threadId,
      messageSender: message.sender,
      messageLength: message.text.length,
      totalMessages: updatedMessagesByThread[threadId].length
    });
  },

  getMessagesForThread: (threadId: string) => {
    const state = get();
    const userContext = state.userContext;
    const messages = state.messagesByThread[threadId] || [];
    
    // Filter messages to only show user's messages (extra security)
    return messages.filter(message => 
      !userContext || !message.userId || message.userId === userContext.uid
    );
  },

  loadMessagesForThread: async (threadId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/threads/${threadId}/messages`, {
        headers,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('אנא התחבר כדי לטעון הודעות');
        }
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      const messages = data.data?.messages || data.messages;
      const state = get();
      const userContext = state.userContext;
      

      
      // Add user context to messages
      const messagesWithUser = messages.map((message: any) => ({
        ...message,
        userId: userContext?.uid,
        userEmail: userContext?.email
      }));
      
      const updatedMessagesByThread = {
        ...state.messagesByThread,
        [threadId]: messagesWithUser
      };
      
      set({ messagesByThread: updatedMessagesByThread });
      
      logger.info('Messages loaded for thread', undefined, {
        userId: userContext?.uid,
        threadId: threadId,
        messagesCount: messages.length,
        transformedMessagesCount: messagesWithUser.length
      });
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load messages' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (message: string, threadId?: string) => {
    const state = get();
    const userContext = state.userContext;
    let targetThreadId = threadId || state.activeThreadId;

    try {
      set({ isSending: true, error: null });
      
      if (!targetThreadId) {
        targetThreadId = await get().createNewThread();
      }
      
      const userMessage: Message = {
        id: Date.now().toString(),
        threadId: targetThreadId,
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString(),
        userId: userContext?.uid,
        userEmail: userContext?.email
      };
      get().addMessage(targetThreadId, userMessage);
      
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          threadId: targetThreadId,
          assistantId: state.defaultAssistantId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('אנא התחבר כדי לשלוח הודעות');
        }
        throw new Error(errorData.error || 'Failed to send message');
      }

      const responseData = await response.json();
      const assistantResponse = responseData.data?.response || responseData.response;
      const returnedThreadId = responseData.data?.threadId || responseData.threadId;
      const runId = responseData.data?.runId || responseData.runId;

      if (returnedThreadId && returnedThreadId !== targetThreadId) {
        set(state => ({
          ...state,
          activeThreadId: returnedThreadId,
        }));

        const updatedThreads = state.threads.map(thread => 
          thread.id === targetThreadId ? { ...thread, id: returnedThreadId } : thread
        );

        const updatedMessagesByThread = { ...state.messagesByThread };
        if (targetThreadId && state.messagesByThread[targetThreadId]) {
          updatedMessagesByThread[returnedThreadId] = state.messagesByThread[targetThreadId];
          delete updatedMessagesByThread[targetThreadId];
        }
        
        set(state => ({
          ...state,
          threads: updatedThreads,
          messagesByThread: updatedMessagesByThread,
        }));
        
        targetThreadId = returnedThreadId;
      }

      if (assistantResponse && targetThreadId) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          threadId: targetThreadId,
          runId,
          sender: 'assistant',
          text: assistantResponse,
          timestamp: new Date().toISOString(),
          userId: userContext?.uid,
          userEmail: userContext?.email
        };
        get().addMessage(targetThreadId, assistantMessage);
      }

      logger.info('Message sent successfully', undefined, {
        userId: userContext?.uid,
        targetThreadId: targetThreadId,
        hasAssistantResponse: !!assistantResponse
      });

    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    } finally {
      set({ isSending: false });
    }
  },

  submitFeedback: async (messageId: string, runId: string, threadId: string, rating: 'like' | 'dislike', comment?: string) => {
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          runId,
          rating,
          comment
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('אנא התחבר כדי לשלוח משוב');
        }
        throw new Error(errorData.error || 'Failed to submit feedback');
      }
      
      const result = await response.json();
      const userContext = get().userContext;
      logger.info('Feedback submitted successfully', undefined, {
        userId: userContext?.uid,
        runId: runId,
        rating: rating,
        hasComment: !!comment,
        success: result.success
      });
      return result;
      
    } catch (error) {
      logger.error('Error submitting feedback', error, undefined, {
        userId: get().userContext?.uid,
        runId: runId,
        rating: rating
      });
      throw error;
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setSending: (sending: boolean) => {
    set({ isSending: sending });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearChat: () => {
    const state = get();
    const userContext = state.userContext;
    
    set({
      messagesByThread: {},
      activeThreadId: null,
      threads: [],
      error: null
    });
    
    // Clear localStorage for current user
    saveThreadsToStorage(state.defaultAssistantId, [], userContext?.uid);
    
    logger.info('Chat data cleared', undefined, {
      userId: userContext?.uid,
      clearedThreads: state.threads.length,
      clearedMessages: Object.keys(state.messagesByThread).length
    });
  },

  syncWithLocalStorage: () => {
    const state = get();
    const userContext = state.userContext;
    saveThreadsToStorage(state.defaultAssistantId, state.threads, userContext?.uid);
  },

  clearUserData: () => {
    set({
      messagesByThread: {},
      activeThreadId: null,
      threads: [],
      error: null,
      isInitialized: false
    });
  },

  getUserThreads: () => {
    const state = get();
    const userContext = state.userContext;
    
    return state.threads.filter(thread => 
      !userContext || !thread.userId || thread.userId === userContext.uid
    );
  }
}));

// Hook to use the chat store with authentication
export const useAuthenticatedChatStore = () => {
  const { user, getIdToken } = useAuthContext();
  const store = useChatStore();



  // Update the global auth token whenever user changes
  React.useEffect(() => {
    const updateToken = async () => {
      if (user) {
        const token = await getIdToken();
        if (typeof window !== 'undefined') {
          (window as any).__authToken = token;
        }
      }
    };
    updateToken();
  }, [user, getIdToken]); // Include getIdToken in dependencies

  // Update user context when user changes
  React.useEffect(() => {
    if (user) {
      const userContext: UserContext = {
        uid: user.uid,
        email: user.email || undefined,
        displayName: user.displayName || undefined
      };
      store.setUserContext(userContext);
    } else {
      store.setUserContext(null);
    }
  }, [user, store]);

  return store;
};
import React from "react";
import { create } from "zustand";
import { Message, Thread, UserContext } from "@/app/types/chat";
import { useAuthContext } from "@/context/auth-context";

// localStorage keys
const THREADS_STORAGE_KEY = 'chat_threads_v2'; // Incremented version for user-specific storage

// Helper functions for localStorage - now user-specific
const getStoredThreads = (assistantId: string, userId?: string): Thread[] => {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const stored = localStorage.getItem(`${THREADS_STORAGE_KEY}_${assistantId}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error parsing stored threads:', error);
    return [];
  }
};

const saveThreadsToStorage = (assistantId: string, threads: Thread[], userId?: string) => {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${THREADS_STORAGE_KEY}_${assistantId}_${userId}`, JSON.stringify(threads));
  } catch (error) {
    console.error('Error saving threads to localStorage:', error);
  }
};

// Helper function to clear old localStorage entries when user changes
const clearOldStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('chat_threads_v1_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing old storage:', error);
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

type ChatStore = ChatState & ChatActions;

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
      console.error('Error getting auth token:', error);
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
    
    console.log(`🔄 Initializing chat store for user: ${userContext?.uid || 'anonymous'}`);
    
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

    console.log(`✅ Loaded ${userThreads.length} threads for user: ${userContext?.uid || 'anonymous'}`);

    if (userThreads.length > 0) {
      get().setActiveThread(userThreads[0].id);
    }
  },

  setUserContext: (userContext: UserContext | null) => {
    const currentUser = get().userContext;
    if (currentUser?.uid === userContext?.uid) return;
    
    console.log(`🔄 Setting user context: ${userContext?.uid || 'anonymous'}`);
    
    // Clear current data when user changes
    if (currentUser?.uid !== userContext?.uid) {
      get().clearUserData();
    }
    
    set({ userContext });
    
    // Reinitialize with new user context
    get().initializeStore(userContext);
  },

  setActiveThread: (threadId: string | null) => {
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
    
    console.log(`➕ Added thread ${thread.id} for user: ${userContext?.uid || 'anonymous'}`);
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
    
    console.log(`✏️ Updated thread ${threadId} for user: ${userContext?.uid || 'anonymous'}`);
  },

  deleteThread: (threadId: string) => {
    const state = get();
    const userContext = state.userContext;
    
    // Only allow deletion of user's own threads
    const threadToDelete = state.threads.find(t => t.id === threadId);
    if (threadToDelete && threadToDelete.userId && threadToDelete.userId !== userContext?.uid) {
      console.warn(`⚠️ User ${userContext?.uid} attempted to delete thread ${threadId} belonging to ${threadToDelete.userId}`);
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
    
    console.log(`🗑️ Deleted thread ${threadId} for user: ${userContext?.uid || 'anonymous'}`);
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
      const realThreadId = data.threadId;
      
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
      console.error('Error creating new thread:', error);
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
    
    console.log(`💬 Added ${message.sender} message to thread ${threadId} for user: ${userContext?.uid || 'anonymous'}`);
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
      const messages = data.messages;
      const state = get();
      const userContext = state.userContext;
      
      // Add user context to loaded messages
      const messagesWithUser = messages.map((message: Message) => ({
        ...message,
        userId: userContext?.uid,
        userEmail: userContext?.email
      }));
      
      const updatedMessagesByThread = {
        ...state.messagesByThread,
        [threadId]: messagesWithUser
      };
      
      set({ messagesByThread: updatedMessagesByThread });
      
      console.log(`📥 Loaded ${messages.length} messages for thread ${threadId}, user: ${userContext?.uid || 'anonymous'}`);
      
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

      const { response: assistantResponse, threadId: returnedThreadId, runId } = await response.json();

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

      console.log(`📤 Message sent successfully for user: ${userContext?.uid || 'anonymous'}`);

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
      console.log(`✅ Feedback submitted successfully for user: ${userContext?.uid || 'anonymous'}`, result);
      return result;
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
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
    
    console.log(`🧹 Cleared chat data for user: ${userContext?.uid || 'anonymous'}`);
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

  // Update the global auth token whenever it changes
  React.useEffect(() => {
    const updateToken = async () => {
      const token = await getIdToken();
      if (typeof window !== 'undefined') {
        (window as any).__authToken = token;
      }
    };
    updateToken();
  }, [getIdToken]);

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
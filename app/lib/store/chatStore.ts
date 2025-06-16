import { create } from "zustand";
import { Message, Thread } from "@/app/types/chat";

// localStorage keys
const THREADS_STORAGE_KEY = 'chat_threads_v1';

// Helper functions for localStorage - only for threads
const getStoredThreads = (assistantId: string): Thread[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(`${THREADS_STORAGE_KEY}_${assistantId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error parsing stored threads:', error);
    return [];
  }
};

const saveThreadsToStorage = (assistantId: string, threads: Thread[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${THREADS_STORAGE_KEY}_${assistantId}`, JSON.stringify(threads));
  } catch (error) {
    console.error('Error saving threads to localStorage:', error);
  }
};

interface ChatState {
  // Messages organized by thread ID
  messagesByThread: Record<string, Message[]>;
  // Currently active thread
  activeThreadId: string | null;
  // Available threads
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
  
  // Chat interactions
  sendMessage: (message: string, threadId?: string) => Promise<void>;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility
  clearChat: () => void;
  syncWithLocalStorage: () => void;
}

type ChatStore = ChatState & ChatActions;

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
    
    const state = get();
    const storedThreads = getStoredThreads(state.defaultAssistantId);
    
    set({
      threads: storedThreads,
      messagesByThread: {},
      isInitialized: true
    });


    if (storedThreads.length > 0) {
      get().setActiveThread(storedThreads[0].id);
    }
  },

  setActiveThread: (threadId: string | null) => {
    set({ activeThreadId: threadId, error: null });

    if (threadId && !get().messagesByThread[threadId]) {
      get().loadMessagesForThread(threadId);
    }
  },

  addThread: (thread: Thread) => {
    const state = get();
    const newThreads = [thread, ...state.threads];
    
    set({
      threads: newThreads,
      messagesByThread: {
        ...state.messagesByThread,
        [thread.id]: []
      }
    });
    
    // Save to localStorage
    saveThreadsToStorage(state.defaultAssistantId, newThreads);
  },

  updateThread: (threadId: string, updates: Partial<Thread>) => {
    const state = get();
    const updatedThreads = state.threads.map(thread =>
      thread.id === threadId ? { ...thread, ...updates } : thread
    );
    
    set({ threads: updatedThreads });
    saveThreadsToStorage(state.defaultAssistantId, updatedThreads);
  },

  deleteThread: (threadId: string) => {
    const state = get();
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
    saveThreadsToStorage(state.defaultAssistantId, newThreads);
  },

  createNewThread: async (title?: string): Promise<string> => {
    try {
      set({ isLoading: true, error: null });
      
      // Create thread on OpenAI first
      const response = await fetch('/api/threads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: get().defaultAssistantId
        }),
      });

      if (!response.ok) {
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
    const currentMessages = state.messagesByThread[threadId] || [];
    
    const updatedMessagesByThread = {
      ...state.messagesByThread,
      [threadId]: [...currentMessages, message]
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
  },

  getMessagesForThread: (threadId: string) => {
    const state = get();
    return state.messagesByThread[threadId] || [];
  },

  loadMessagesForThread: async (threadId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/threads/${threadId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      const messages = data.messages;
      const state = get();
      const updatedMessagesByThread = {
        ...state.messagesByThread,
        [threadId]: messages
      };
      
      set({ messagesByThread: updatedMessagesByThread });
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load messages' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (message: string, threadId?: string) => {
    const state = get();
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
      };
      get().addMessage(targetThreadId, userMessage);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          threadId: targetThreadId,
          assistantId: state.defaultAssistantId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const { response: assistantResponse, threadId: returnedThreadId } = await response.json();

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
          sender: 'assistant',
          text: assistantResponse,
          timestamp: new Date().toISOString(),
        };
        get().addMessage(targetThreadId, assistantMessage);
      }

    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    } finally {
      set({ isSending: false });
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
    set({
      messagesByThread: {},
      activeThreadId: null,
      threads: [],
      error: null
    });
    
    // Clear localStorage
    saveThreadsToStorage(state.defaultAssistantId, []);
  },

  syncWithLocalStorage: () => {
    const state = get();
    saveThreadsToStorage(state.defaultAssistantId, state.threads);
  }
}));
// Base store interfaces for consistency
export interface BaseState {
  isInitialized: boolean;
  lastUpdated: number;
}

export interface BaseActions {
  initialize: () => void;
  reset: () => void;
}

// Context interfaces
export interface LogContext {
  requestId?: string;
  component?: string;
  action?: string;
}

// Chat store interfaces
export interface ChatState extends BaseState {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  error: string | null;
}

export interface ChatActions extends BaseActions {
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
  setError: (error: string | null) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Thread store interfaces
export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  assistantId: string;
  messageCount: number;
  lastMessage?: string;
  metadata?: Record<string, any>;
}

export interface ThreadState extends BaseState {
  threads: Thread[];
  activeThreadId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ThreadActions extends BaseActions {
  setActiveThread: (threadId: string | null) => void;
  addThread: (thread: Thread) => void;
  updateThread: (threadId: string, updates: Partial<Thread>) => void;
  deleteThread: (threadId: string) => void;
  createNewThread: (title?: string) => Promise<string>;
  loadThreads: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Message store interfaces
export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  runId?: string;
  feedback?: {
    rating: 'like' | 'dislike';
    comment?: string;
  };
  metadata?: Record<string, any>;
}

export interface MessageState extends BaseState {
  messagesByThread: Record<string, Message[]>;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

export interface MessageActions extends BaseActions {
  addMessage: (threadId: string, message: Message) => void;
  getMessagesForThread: (threadId: string) => Message[];
  loadMessagesForThread: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string) => Promise<void>;
  submitFeedback: (messageId: string, runId: string, threadId: string, rating: 'like' | 'dislike', comment?: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
}

// UI store interfaces
export interface ThemeState extends BaseState {
  theme: 'light' | 'dark';
}

export interface ThemeActions extends BaseActions {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export interface NotificationState extends BaseState {
  notifications: Notification[];
  isEnabled: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  createdAt: Date;
  isRead: boolean;
}

export interface NotificationActions extends BaseActions {
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  setEnabled: (enabled: boolean) => void;
}

export interface ModalState extends BaseState {
  activeModal: string | null;
  modalData: Record<string, any>;
  modalStack: string[];
}

export interface ModalActions extends BaseActions {
  openModal: (modalId: string, data?: any) => void;
  closeModal: (modalId?: string) => void;
  closeAllModals: () => void;
  setModalData: (modalId: string, data: any) => void;
}

// Shared store interfaces
export interface LoadingState extends BaseState {
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
}

export interface LoadingActions extends BaseActions {
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  getLoadingKeys: () => string[];
  clearLoading: (key: string) => void;
}

export interface ErrorState extends BaseState {
  errors: Record<string, string>;
  globalError: string | null;
}

export interface ErrorActions extends BaseActions {
  setError: (key: string, error: string) => void;
  setGlobalError: (error: string | null) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  getCriticalErrors: () => string[];
  hasError: (key: string) => boolean;
}

// Store composition types
export interface AppStore {
  chat: ChatState & ChatActions;
  thread: ThreadState & ThreadActions;
  message: MessageState & MessageActions;
  ui: {
    theme: ThemeState & ThemeActions;
    notification: NotificationState & NotificationActions;
    modal: ModalState & ModalActions;
  };
  shared: {
    loading: LoadingState & LoadingActions;
    error: ErrorState & ErrorActions;
  };
}

// Persistence configuration
export interface PersistenceConfig {
  key: string;
  version: number;
  whitelist?: string[];
  blacklist?: string[];
  migrate?: (persistedState: any, version: number) => any;
}

// Selector types for performance optimization
export type StoreSelector<T, R> = (state: T) => R;
export type StoreSubscriber<T> = (state: T, prevState: T) => void;

// Event types for cross-store communication
export interface StoreEvent {
  type: string;
  payload: any;
  source: string;
  timestamp: number;
}

export interface EventEmitter {
  emit: (event: StoreEvent) => void;
  on: (eventType: string, callback: (event: StoreEvent) => void) => () => void;
  off: (eventType: string, callback: (event: StoreEvent) => void) => void;
} 
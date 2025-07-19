export interface Message {
  id: string;
  threadId: string;
  runId?: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Thread {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

// API related types
export interface ChatAPIRequest {
  message: string;
  threadId?: string;
  assistantId?: string;
}

export interface ChatAPIResponse {
  response: string | null;
  threadId: string;
  runId?: string;
  error?: string;
  details?: string;
}

export interface ChatError {
  message: string;
  code?: string;
  details?: any;
}

// Chat store related types
export interface ChatLoadingState {
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

export interface ThreadData {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
}

export interface IconProps {
  name: 'sun' | 'moon' | 'plusSquare' | 'user' | 'settings' | 'trash2' | 'edit3' | 'bot' | 'send' | 'loader2' | 'thumbsUp' | 'thumbsDown';
  className?: string;
  [key: string]: any;
}
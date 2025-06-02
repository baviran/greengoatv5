export interface Message {
  id: string;
  threadId: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Thread {
  id: string;
  title: string;
}

export interface IconProps {
  name: 'sun' | 'moon' | 'plusSquare' | 'user' | 'settings' | 'trash2' | 'edit3' | 'bot' | 'send';
  className?: string;
  [key: string]: any;
}

export interface ChatColumnProps {
  messages: Message[];
  activeThreadId: string | null;
  onSendMessage: (message: string) => void;
}

export interface MessageListProps {
  messages: Message[];
  activeThreadId: string | null;
}

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  activeThreadId: string | null;
}

export interface SidebarProps {
  activeThreadId: string | null;
  setActiveThreadId: (threadId: string | null) => void;
  onNewChat: (threadId: string) => void;
  threads: Thread[];
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
}

export interface HomePageProps {
  isDarkMode: boolean;
  messages: Message[];
  activeThreadId: string | null;
  setActiveThreadId: (threadId: string | null) => void;
  onSendMessage: (message: string) => void;
  onNewChat: (threadId: string) => void;
  threads: Thread[];
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
}

export interface TopBarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
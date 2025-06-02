// src/lib/services/threadService.ts
import type { ThreadPreview } from '@/types/app';

const THREAD_PREVIEWS_KEY = 'chatThreadPreviews_v3';

export const threadService = {
    getThreadsForAssistant: async (assistantId: string): Promise<ThreadPreview[]> => {
        if (typeof window === 'undefined') return [];
        try {
            const allThreads = JSON.parse(localStorage.getItem(THREAD_PREVIEWS_KEY) || '[]') as ThreadPreview[];
            return allThreads
                .filter(t => t.assistantId === assistantId)
                .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
        } catch (error) {
            console.error("Error parsing thread previews from localStorage:", error);
            localStorage.removeItem(THREAD_PREVIEWS_KEY);
            return [];
        }
    },

    saveThreadPreview: async (threadPreview: ThreadPreview): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
            let allThreads = JSON.parse(localStorage.getItem(THREAD_PREVIEWS_KEY) || '[]') as ThreadPreview[];
            const existingIndex = allThreads.findIndex(t => t.id === threadPreview.id);
            if (existingIndex > -1) {
                allThreads[existingIndex] = { ...allThreads[existingIndex], ...threadPreview };
            } else {
                allThreads.push(threadPreview);
            }
            localStorage.setItem(THREAD_PREVIEWS_KEY, JSON.stringify(allThreads));
        } catch (error) {
            console.error("Error saving thread preview to localStorage:", error);
        }
    },

    deleteThreadPreview: async (threadId: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
            let allThreads = JSON.parse(localStorage.getItem(THREAD_PREVIEWS_KEY) || '[]') as ThreadPreview[];
            allThreads = allThreads.filter(t => t.id !== threadId);
            localStorage.setItem(THREAD_PREVIEWS_KEY, JSON.stringify(allThreads));
        } catch (error) {
            console.error(`Error deleting thread preview ${threadId} from localStorage:`, error);
        }
    }
};
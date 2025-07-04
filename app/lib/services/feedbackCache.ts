import { Logger } from '@/app/lib/utils/logger';

const logger = Logger.getInstance();

interface AssistantInteractionData {
    threadId: string;
    runId: string;
    userId?: string;
    userEmail?: string;
    userPrompt: string;
    assistantResponse: string;
    toolCalls?: any;
    toolOutputs?: any;
    timestamp?: string;
    reviewer?: string | null;
    rating?: '👍' | '👎' | null;
    comment?: string | null;
}

class FeedbackCache {
    private cache = new Map<string, AssistantInteractionData>();

    set(runId: string, data: AssistantInteractionData) {
        logger.info(`💾 CACHING INTERACTION DATA`);
        logger.info(`🏃 Run ID: ${runId}`);
        logger.info(`🔗 Thread ID: ${data.threadId}`);
        logger.info(`👤 User ID: ${data.userId || 'N/A'}`);
        logger.info(`📊 Cache size before: ${this.cache.size}`);
        
        this.cache.set(runId, data);
        
        logger.info(`📊 Cache size after: ${this.cache.size}`);
        logger.info(`✅ Interaction data cached successfully`);
    }

    get(runId: string): AssistantInteractionData | undefined {
        logger.info(`📥 RETRIEVING CACHED DATA`);
        logger.info(`🏃 Run ID: ${runId}`);
        logger.info(`📊 Current cache size: ${this.cache.size}`);
        
        const data = this.cache.get(runId);
        
        if (data) {
            logger.info(`✅ Found cached data for runId: ${runId}`);
            logger.info(`👤 User ID: ${data.userId || 'N/A'}`);
            logger.info(`🔗 Thread ID: ${data.threadId}`);
        } else {
            logger.warn(`⚠️ No cached data found for runId: ${runId}`);
        }
        
        return data;
    }

    update(runId: string, updates: Partial<AssistantInteractionData>): AssistantInteractionData | null {
        const existing = this.cache.get(runId);
        if (!existing) return null;
        
        const updated = { ...existing, ...updates };
        this.cache.set(runId, updated);
        return updated;
    }

    getAll(): AssistantInteractionData[] {
        return Array.from(this.cache.values());
    }

    delete(runId: string): boolean {
        return this.cache.delete(runId);
    }

    clear() {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

export const feedbackCache = new FeedbackCache();
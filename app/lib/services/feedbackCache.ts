interface AssistantInteractionData {
    threadId: string;
    runId: string;
    userPrompt: string;
    assistantResponse: string;
    toolCalls?: any;
    toolOutputs?: any;
    reviewer?: string | null;
    rating?: '👍' | '👎' | null;
    comment?: string | null;
}

class FeedbackCache {
    private cache = new Map<string, AssistantInteractionData>();

    set(runId: string, data: AssistantInteractionData) {
        this.cache.set(runId, data);
    }

    get(runId: string): AssistantInteractionData | undefined {
        return this.cache.get(runId);
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
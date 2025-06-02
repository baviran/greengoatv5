import type { Message } from '@/types/app';
import {Logger} from "@/app/lib/utils/logger";

const logger = Logger.getInstance();
export class OpenAIService {
    private static instance: OpenAIService;

    private constructor() {
        logger.info('OpenAIService initialized (client-side)');
    }

    public static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }

    public async listMessages(threadId: string): Promise<Message[]> {
        logger.info(`Fetching messages for thread: ${threadId}`);
        try {
            const response = await fetch(`/api/threads/${threadId}/messages`);

            if (!response.ok) {
                const errorData = await response.json();
                logger.error(`Failed to fetch messages for thread ${threadId}: ${response.status}`, errorData);
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            return data.messages.map((msg: any) => ({
                id: msg.id,
                sender: msg.role === 'user' ? 'user' : 'assistant',
                text: msg.content,
                timestamp: new Date(msg.created_at * 1000),
            }));
        } catch (error) {
            logger.error(`Error in listMessages for thread ${threadId}:`, error);
            throw error;
        }
    }
}

export const openAIService = OpenAIService.getInstance();
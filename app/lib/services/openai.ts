import { Logger } from '@/app/lib/utils/logger';
import OpenAI from 'openai';
import { Message } from '@/app/types/chat';
import { isTextContent } from '@/app/types/openai';

const logger = Logger.getInstance();

export class OpenAIService {
    private static instance: OpenAIService;
    private readonly apiKey: string;
    private openai: OpenAI;

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        
        if (!this.apiKey) {
            logger.error('OPENAI_API_KEY environment variable is not set');
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        
        this.openai = new OpenAI({
            apiKey: this.apiKey,
        });
        
        logger.info('OpenAIService initialized');
    }

    static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }

    /**
     * Fetch messages by thread ID using the OpenAI API
     * @param threadId - The thread ID to fetch messages for
     * @returns Promise<Message[]> - Array of messages in our internal format
     */
    async fetchMessagesByThreadId(threadId: string): Promise<Message[]> {
        try {
            logger.info(`Fetching messages for thread: ${threadId}`);
            
            const messages = await this.openai.beta.threads.messages.list(threadId, {
                order: 'asc'
            });

            const formattedMessages: Message[] = messages.data.map((message) => {
                const textContent = message.content
                    .filter(isTextContent)
                    .map(content => content.text.value)
                    .join('\n');

                return {
                    id: message.id,
                    threadId: threadId,
                    sender: message.role === 'user' ? 'user' : 'assistant',
                    text: textContent,
                    timestamp: new Date(message.created_at * 1000).toISOString()
                };
            });

            logger.info(`Successfully fetched ${formattedMessages.length} messages for thread ${threadId}`);
            return formattedMessages;

        } catch (error) {
            logger.error(`Error fetching messages for thread ${threadId}:`, error);
            throw new Error(`Failed to fetch messages for thread ${threadId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const openAiService = OpenAIService.getInstance();
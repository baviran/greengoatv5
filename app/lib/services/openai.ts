import { Logger } from '@/app/lib/utils/logger';
import OpenAI from 'openai';
import { Message } from '@/app/types/chat';
import { isTextContent } from '@/app/types/openai';

const logger = Logger.getInstance();

export class OpenAIService {
    private static instance: OpenAIService;
    private readonly apiKey: string;
    private openai: OpenAI;

    private constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';

        if (!this.apiKey) {
            logger.error('OPENAI_API_KEY environment variable is not set');
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }

        this.openai = new OpenAI({ apiKey: this.apiKey });
        logger.info('OpenAIService initialized');
    }

    public static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }

    async createThread(): Promise<OpenAI.Beta.Threads.Thread> {
        try {
            logger.info('Creating new assistant thread');
            const thread = await this.openai.beta.threads.create();
            logger.info(`Created thread with ID: ${thread.id}`);
            return thread;
        } catch (error) {
            logger.error('Failed to create new thread:', error);
            throw new Error(`Failed to create thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendMessageToThread(threadId: string, message: string): Promise<OpenAI.Beta.Threads.Messages.Message> {
        try {
            logger.info(`Sending message to thread ${threadId}`);

            const response = await this.openai.beta.threads.messages.create(threadId, {
                role: 'user',
                content: message,
            });

            logger.info(`Message sent to thread ${threadId} with message ID: ${response.id}`);
            return response;

        } catch (error) {
            logger.error(`Failed to send message to thread ${threadId}:`, error);
            throw new Error(`Failed to send message to thread ${threadId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async runAssistantOnThread(threadId: string, assistantId: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
        try {
            logger.info(`Starting assistant run on thread ${threadId} with assistant ID ${assistantId}`);

            const run = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: assistantId,
            });

            logger.info(`Assistant run started with ID: ${run.id} on thread ${threadId}`);
            return run;

        } catch (error) {
            logger.error(`Failed to start assistant run on thread ${threadId}:`, error);
            throw new Error(`Failed to start assistant run: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async submitToolOutputs(
        threadId: string,
        runId: string,
        toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]
    ): Promise<OpenAI.Beta.Threads.Runs.Run> {
        try {
            logger.info(`Submitting tool outputs for run ${runId} on thread ${threadId}`);

            const result = await this.openai.beta.threads.runs.submitToolOutputs(runId, {
                thread_id: threadId,
                tool_outputs: toolOutputs,
            });

            logger.info(`Tool outputs submitted successfully for run ${runId}`);
            return result;

        } catch (error) {
            logger.error(`Failed to submit tool outputs for run ${runId}:`, error);
            throw new Error(`Failed to submit tool outputs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async listMessages(threadId: string): Promise<OpenAI.Beta.Threads.Messages.MessagesPage> {
        try {
            logger.info(`Listing messages for thread ${threadId}`);

            const response = await this.openai.beta.threads.messages.list(threadId, {
                order: 'asc'
            });

            logger.info(`Fetched ${response.data.length} messages for thread ${threadId}`);
            return response;

        } catch (error) {
            logger.error(`Failed to list messages for thread ${threadId}:`, error);
            throw new Error(`Failed to list messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async retrieveRun(threadId: string, runId: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
        try {
            logger.info(`Retrieving run ${runId} for thread ${threadId}`);

            const run = await this.openai.beta.threads.runs.retrieve(runId, {
                thread_id: threadId,
            });

            logger.info(`Retrieved run ${runId} with status: ${run.status}`);
            return run;

        } catch (error) {
            logger.error(`Failed to retrieve run ${runId}:`, error);
            throw new Error(`Failed to retrieve run: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
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
                    threadId,
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

export function getOpenAIService(): OpenAIService {
    return OpenAIService.getInstance();
}
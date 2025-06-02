import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Logger } from '@/app/lib/utils/logger';

const logger = Logger.getInstance();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { assistantId } = body;

        if (!assistantId) {
            return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
        }

        logger.info(`Creating new thread for assistant: ${assistantId}`);

        // Create a new thread on OpenAI
        const thread = await openai.beta.threads.create();
        
        logger.info(`Created new thread with ID: ${thread.id}`);

        return NextResponse.json({ threadId: thread.id }, { status: 200 });

    } catch (error: any) {
        const errorMessage = error.message || 'Internal Server Error';
        logger.error(`Error creating thread: ${errorMessage}`, error);

        return NextResponse.json({ 
            error: 'Failed to create thread', 
            details: errorMessage 
        }, { status: 500 });
    }
}
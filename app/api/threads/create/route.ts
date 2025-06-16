import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/app/lib/utils/logger';
import {OpenAIService} from "@/app/lib/services/openai";
const logger = Logger.getInstance();



export async function POST(req: NextRequest) {
    try {
        const openai = OpenAIService.getInstance();
        const body = await req.json();
        const { assistantId } = body;

        if (!assistantId) {
            return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
        }
        logger.info(`Creating new thread with assistant ID: ${assistantId}`);
        try {
            const thread = await openai.createThread();
            logger.info(`Successfully created thread with ID: ${thread.id}`);
            return NextResponse.json({ threadId: thread.id }, { status: 200 });
        } catch (error) {
            logger.error(`Error creating thread with assistant ID: ${assistantId}`, error);
            throw error;
        }

    } catch (error: any) {
        const errorMessage = error.message || 'Internal Server Error';
        logger.error(`Error creating thread: ${errorMessage}`, error);

        return NextResponse.json({
            error: 'Failed to create thread',
            details: errorMessage
        }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/app/lib/utils/logger';
import { OpenAIService } from "@/app/lib/services/openai";
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: NextRequest, authResult) => {
    const { context } = authResult;
    const logger = Logger.getInstance().withContext({
        ...context,
        component: 'threads-api',
        action: 'create-thread'
    });

    try {
        logger.info('Creating new thread for user');
        
        const openai = OpenAIService.getInstance();
        const body = await req.json();
        const { assistantId } = body;

        if (!assistantId) {
            logger.warn('Thread creation failed: missing assistant ID', undefined, {
                providedFields: Object.keys(body)
            });
            return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
        }
        
        logger.info('Creating new thread with assistant ID', undefined, {
            assistantId: assistantId
        });
        
        try {
            const thread = await openai.createThread();
            logger.info('Successfully created thread', undefined, {
                threadId: thread.id,
                assistantId: assistantId
            });
            return NextResponse.json({ threadId: thread.id }, { status: 200 });
        } catch (error) {
            logger.error('Error creating thread with OpenAI', error, undefined, {
                assistantId: assistantId
            });
            throw error;
        }

    } catch (error: any) {
        const errorMessage = error.message || 'Internal Server Error';
        logger.error('Thread creation failed', error, undefined, {
            errorMessage,
            assistantId: (await req.json().catch(() => ({})))?.assistantId
        });

        return NextResponse.json({
            error: 'Failed to create thread',
            details: errorMessage
        }, { status: 500 });
    }
});
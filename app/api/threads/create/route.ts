import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/app/lib/utils/logger';
import { OpenAIService } from "@/app/lib/services/openai";
import { withAuth } from '@/lib/auth-middleware';
import { DecodedIdToken } from 'firebase-admin/auth';

const logger = Logger.getInstance();

const authenticatedPOST = withAuth(async (req: NextRequest, user: DecodedIdToken) => {
    try {
        logger.info(`Creating new thread for user: ${user.uid} (${user.email})`);
        
        const openai = OpenAIService.getInstance();
        const body = await req.json();
        const { assistantId } = body;

        if (!assistantId) {
            return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
        }
        
        logger.info(`Creating new thread with assistant ID: ${assistantId} for user: ${user.uid}`);
        
        try {
            const thread = await openai.createThread();
            logger.info(`Successfully created thread with ID: ${thread.id} for user: ${user.uid}`);
            return NextResponse.json({ threadId: thread.id }, { status: 200 });
        } catch (error) {
            logger.error(`Error creating thread with assistant ID: ${assistantId} for user: ${user.uid}`, error);
            throw error;
        }

    } catch (error: any) {
        const errorMessage = error.message || 'Internal Server Error';
        logger.error(`Error creating thread for user: ${user.uid} - ${errorMessage}`, error);

        return NextResponse.json({
            error: 'Failed to create thread',
            details: errorMessage
        }, { status: 500 });
    }
});

export { authenticatedPOST as POST };
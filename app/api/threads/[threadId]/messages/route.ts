import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIService } from '@/app/lib/services/openai';
import { withAuth } from '@/lib/auth-middleware';
import { Logger } from '@/app/lib/utils/logger';

export const GET = withAuth(async (
    request: NextRequest,
    authResult,
    context: any
) => {
  const { context: authContext } = authResult;
  const logger = Logger.getInstance().withContext({
    ...authContext,
    component: 'messages-api',
    action: 'fetch-messages'
  });

  try {
    logger.info('Messages request received');
    
    const params = await context.params;
    const { threadId } = params;
    if (!threadId || typeof threadId !== 'string') {
      logger.warn('Invalid thread ID provided', undefined, {
        threadId,
        threadIdType: typeof threadId
      });
      return NextResponse.json(
          { error: 'Thread ID is required and must be a string' },
          { status: 400 }
      );
    }

    logger.info('Fetching messages from thread', undefined, {
      threadId
    });
    
    const messages = await getOpenAIService().fetchMessagesByThreadId(threadId);
    
    logger.info('Successfully fetched messages', undefined, {
      threadId,
      messageCount: messages.length
    });
    
    return NextResponse.json({ messages });

  } catch (error) {
    logger.error('Error fetching messages', error, undefined, {
      threadId: (await context.params)?.threadId
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
        {
          error: 'Failed to fetch messages',
          details: errorMessage
        },
        { status: 500 }
    );
  }
});
import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIService } from '@/app/lib/services/openai';
import { withAuth } from '@/lib/auth-middleware';
import { DecodedIdToken } from 'firebase-admin/auth';

const authenticatedGET = withAuth(async (
    request: NextRequest,
    user: DecodedIdToken,
    context: any
) => {
  try {
    console.log(`📥 Messages request for user: ${user.uid} (${user.email})`);
    
    const params = await context.params;
    const { threadId } = params;
    if (!threadId || typeof threadId !== 'string') {
      return NextResponse.json(
          { error: 'Thread ID is required and must be a string' },
          { status: 400 }
      );
    }

    console.log(`🔍 Fetching messages from thread: ${threadId} for user: ${user.uid}`);
    
    const messages = await getOpenAIService().fetchMessagesByThreadId(threadId);
    
    console.log(`✅ Successfully fetched ${messages.length} messages for user: ${user.uid}`);
    
    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
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

export { authenticatedGET as GET };
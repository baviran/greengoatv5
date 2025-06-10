import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIService } from '@/app/lib/services/openai'; // Ensure this path is correct

export async function GET(
    request: NextRequest,
    context: any
) {
  try {
    const { threadId } = context.params; // Access threadId from context.params
    if (!threadId || typeof threadId !== 'string') { // Added a type check for robustness
      return NextResponse.json(
          { error: 'Thread ID is required and must be a string' },
          { status: 400 }
      );
    }

    const messages = await getOpenAIService().fetchMessagesByThreadId(threadId);
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
}
import { UserContext } from '@/app/types/chat';
import { Logger } from '@/app/lib/utils/logger';
import { AuthenticationError, ExternalServiceError } from '@/app/lib/errors/app-errors';

const logger = Logger.getInstance().withContext({
  component: 'chat-service'
});

// Enhanced chat service with user context
export async function sendMessageToAssistant(
    message: string, 
    threadId: string | null,
    token?: string,
    userContext?: UserContext
) {
    const payload: { 
        message: string; 
        threadId?: string | null; 
        assistantId: string;
        userContext?: UserContext;
    } = { 
        message,
        assistantId: process.env.NEXT_PUBLIC_ASSISTANT_ID || 'default-assistant-id'
    };
    
    if (threadId) payload.threadId = threadId;
    if (userContext) payload.userContext = userContext;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    logger.info('Sending message to assistant', undefined, {
        userId: userContext?.uid,
        threadId: threadId,
        hasToken: !!token,
        messageLength: message.length
    });

    const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            logger.warn('Authentication required for chat', undefined, {
                userId: userContext?.uid,
                status: res.status
            });
            throw new AuthenticationError('אנא התחבר כדי להשתמש בשירות');
        }
        if (res.status === 403) {
            logger.warn('User lacks permission for chat thread', undefined, {
                userId: userContext?.uid,
                threadId: threadId,
                status: res.status
            });
            throw new AuthenticationError('אין לך הרשאה לגשת לשיחה זו');
        }
        logger.error('Chat API error', undefined, undefined, {
            userId: userContext?.uid,
            threadId: threadId,
            status: res.status,
            error: err
        });
        throw new ExternalServiceError(err.error || 'שגיאה בתקשורת עם השרת');
    }

    const data = await res.json();
    logger.info('Message sent successfully', undefined, {
        userId: userContext?.uid,
        threadId: data.threadId,
        runId: data.runId,
        hasResponse: !!data.response
    });
    
    return {
        response: data.response || 'לא התקבלה תשובה מהעוזר.',
        threadId: data.threadId || null,
        runId: data.runId || null,
    };
}

export async function sendFeedback(
    runId: string,
    rating: 'like' | 'dislike',
    comment?: string,
    token?: string,
    userContext?: UserContext
) {
    const payload = {
        runId,
        rating,
        comment,
        userContext,
    };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    logger.info('Sending feedback', undefined, {
        userId: userContext?.uid,
        runId: runId,
        rating: rating,
        hasComment: !!comment,
        hasToken: !!token
    });

    const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            logger.warn('Authentication required for feedback', undefined, {
                userId: userContext?.uid,
                runId: runId,
                status: res.status
            });
            throw new AuthenticationError('אנא התחבר כדי לשלוח משוב');
        }
        if (res.status === 403) {
            logger.warn('User lacks permission for feedback', undefined, {
                userId: userContext?.uid,
                runId: runId,
                status: res.status
            });
            throw new AuthenticationError('אין לך הרשאה לשלוח משוב על הודעה זו');
        }
        logger.error('Feedback API error', undefined, undefined, {
            userId: userContext?.uid,
            runId: runId,
            status: res.status,
            error: err
        });
        throw new ExternalServiceError(err.error || 'שגיאה בשליחת המשוב');
    }

    const result = await res.json();
    logger.info('Feedback sent successfully', undefined, {
        userId: userContext?.uid,
        runId: runId,
        rating: rating,
        success: result.success
    });
    
    return result;
}

// User-specific thread management
export async function getUserThreads(
    token?: string,
    userContext?: UserContext
) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    logger.info('Fetching threads for user', undefined, {
        userId: userContext?.uid,
        hasToken: !!token
    });

    const res = await fetch('/api/threads', {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            logger.warn('Authentication required for threads', undefined, {
                userId: userContext?.uid,
                status: res.status
            });
            throw new AuthenticationError('אנא התחבר כדי לטעון שיחות');
        }
        logger.error('Threads API error', undefined, undefined, {
            userId: userContext?.uid,
            status: res.status,
            error: err
        });
        throw new ExternalServiceError(err.error || 'שגיאה בטעינת השיחות');
    }

    const data = await res.json();
    logger.info('Threads loaded successfully', undefined, {
        userId: userContext?.uid,
        threadsCount: data.threads?.length || 0
    });
    
    return data.threads || [];
}

// User-specific message management
export async function getUserMessages(
    threadId: string,
    token?: string,
    userContext?: UserContext
) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    logger.info('Fetching messages for thread', undefined, {
        userId: userContext?.uid,
        threadId: threadId,
        hasToken: !!token
    });

    const res = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            logger.warn('Authentication required for messages', undefined, {
                userId: userContext?.uid,
                threadId: threadId,
                status: res.status
            });
            throw new AuthenticationError('אנא התחבר כדי לטעון הודעות');
        }
        if (res.status === 403) {
            logger.warn('User lacks permission for thread messages', undefined, {
                userId: userContext?.uid,
                threadId: threadId,
                status: res.status
            });
            throw new AuthenticationError('אין לך הרשאה לגשת לשיחה זו');
        }
        logger.error('Messages API error', undefined, undefined, {
            userId: userContext?.uid,
            threadId: threadId,
            status: res.status,
            error: err
        });
        throw new ExternalServiceError(err.error || 'שגיאה בטעינת ההודעות');
    }

    const data = await res.json();
    logger.info('Messages loaded successfully', undefined, {
        userId: userContext?.uid,
        threadId: threadId,
        messagesCount: data.messages?.length || 0
    });
    
    return data.messages || [];
}
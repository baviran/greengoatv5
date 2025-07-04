import { UserContext } from '@/app/types/chat';

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

    console.log(`📤 Sending message to assistant for user: ${userContext?.uid || 'anonymous'}`);

    const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            throw new Error('אנא התחבר כדי להשתמש בשירות');
        }
        if (res.status === 403) {
            throw new Error('אין לך הרשאה לגשת לשיחה זו');
        }
        console.error(`❌ Chat API error for user ${userContext?.uid || 'anonymous'}:`, err);
        throw new Error(err.error || 'שגיאה בתקשורת עם השרת');
    }

    const data = await res.json();
    console.log(`✅ Message sent successfully for user: ${userContext?.uid || 'anonymous'}`);
    
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

    console.log(`📝 Sending feedback for user: ${userContext?.uid || 'anonymous'}, runId: ${runId}`);

    const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            throw new Error('אנא התחבר כדי לשלוח משוב');
        }
        if (res.status === 403) {
            throw new Error('אין לך הרשאה לשלוח משוב על הודעה זו');
        }
        console.error(`❌ Feedback API error for user ${userContext?.uid || 'anonymous'}:`, err);
        throw new Error(err.error || 'שגיאה בשליחת המשוב');
    }

    const result = await res.json();
    console.log(`✅ Feedback sent successfully for user: ${userContext?.uid || 'anonymous'}`);
    
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

    console.log(`📂 Fetching threads for user: ${userContext?.uid || 'anonymous'}`);

    const res = await fetch('/api/threads', {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            throw new Error('אנא התחבר כדי לטעון שיחות');
        }
        console.error(`❌ Threads API error for user ${userContext?.uid || 'anonymous'}:`, err);
        throw new Error(err.error || 'שגיאה בטעינת השיחות');
    }

    const data = await res.json();
    console.log(`✅ Loaded ${data.threads?.length || 0} threads for user: ${userContext?.uid || 'anonymous'}`);
    
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

    console.log(`📥 Fetching messages for thread: ${threadId}, user: ${userContext?.uid || 'anonymous'}`);

    const res = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
            throw new Error('אנא התחבר כדי לטעון הודעות');
        }
        if (res.status === 403) {
            throw new Error('אין לך הרשאה לגשת לשיחה זו');
        }
        console.error(`❌ Messages API error for user ${userContext?.uid || 'anonymous'}:`, err);
        throw new Error(err.error || 'שגיאה בטעינת ההודעות');
    }

    const data = await res.json();
    console.log(`✅ Loaded ${data.messages?.length || 0} messages for user: ${userContext?.uid || 'anonymous'}`);
    
    return data.messages || [];
}
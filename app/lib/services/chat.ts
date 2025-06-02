export async function sendMessageToAssistant(message: string, threadId: string | null) {
    const payload: { message: string; threadId?: string | null } = { message };
    if (threadId) payload.threadId = threadId;

    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'שגיאה בתקשורת עם השרת');
    }

    const data = await res.json();
    return {
        response: data.response || 'לא התקבלה תשובה מהעוזר.',
        threadId: data.threadId || null,
    };
}
import React, {useEffect, useMemo, useRef} from 'react';
import { Icon } from '@/app/components/icons';
import { useChatStore } from '../lib/store/chatStore';
import FeedbackSection from './FeedbackSection';
import { Logger } from '@/app/lib/utils/logger';
import { withErrorBoundary } from '@/app/components/error-boundary/ErrorBoundary';

const logger = Logger.getInstance().withContext({
  component: 'message-list'
});

const MessageListComponent: React.FC = () => {
    const { activeThreadId, messagesByThread, isLoading, isSending, submitFeedback } = useChatStore();

    const messages = useMemo(() => {
        return activeThreadId ? messagesByThread[activeThreadId] || [] : [];
    }, [activeThreadId, messagesByThread]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending]);

    const handleFeedbackSubmit = async (messageId: string, type: 'like' | 'dislike', feedback?: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) {
            logger.error('Cannot submit feedback - message not found', undefined, undefined, {
                messageId: messageId,
                feedbackType: type,
                action: 'validate-feedback-submission'
            });
            return;
        }
        
        if (!activeThreadId) {
            logger.error('Cannot submit feedback - no active thread', undefined, undefined, {
                messageId: messageId,
                feedbackType: type,
                action: 'validate-feedback-submission'
            });
            return;
        }
        

        
        try {
            const thumbsUp = type === 'like';
            await submitFeedback(messageId, thumbsUp, feedback);
        } catch (error) {
            logger.error('Failed to submit feedback', error, undefined, {
                messageId: messageId,
                runId: message.runId,
                threadId: activeThreadId,
                feedbackType: type,
                hasFeedbackText: !!feedback,
                action: 'submit-message-feedback'
            });
            throw error;
        }
    };

    if (!activeThreadId) {
        return <div className="flex-grow flex items-center justify-center p-4"><p className="text-foreground/70">בחר שיחה מהרשימה כדי להציג הודעות או התחל שיחה חדשה.</p></div>;
    }

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-3">
                    <Icon name="loader2" className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-foreground/70 text-sm">טוען הודעות...</p>
                </div>
            </div>
        );
    }

    if (messages.length === 0 && activeThreadId) {
        return <div className="flex-grow flex items-center justify-center p-4"><p className="text-foreground/70">אין הודעות בשיחה זו. שלח הודעה כדי להתחיל!</p></div>;
    }

    return (
        <div className="flex-grow p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent bg-background" dir="rtl">
            {messages.map(msg => {
                const isUser = msg.sender === 'user';
                const messageAlignment = isUser ? 'justify-start' : 'justify-end';

                const messageBgClass = isUser ? 'bg-accent' : 'bg-card';
                const messageTextColorClass = isUser ? 'text-white' : 'text-card-foreground';

                const borderRadius = isUser ? 'rounded-xl rounded-bl-none' : 'rounded-xl rounded-br-none';

                const iconName = isUser ? 'user' : 'bot';
                const timestampColorClass = isUser ? 'text-white/80' : 'text-card-foreground/70';

                const iconElement = (
                    <div className={`flex-shrink-0 ${isUser ? 'mr-2 rtl:ml-2 rtl:mr-0' : 'ml-2 rtl:mr-2 rtl:ml-0'}`}>
                        <Icon name={iconName} className={`w-4 h-4 sm:w-4 sm:h-4 ${messageTextColorClass}`} />
                    </div>
                );

                const textAndTimestampElement = (
                    <div className="flex-grow min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={`text-xs mt-1 ${timestampColorClass} ${isUser ? 'text-right rtl:text-left' : 'text-left rtl:text-right'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {!isUser && msg.runId && (
                            <FeedbackSection
                                messageId={msg.id}
                                onFeedbackSubmit={handleFeedbackSubmit}
                            />
                        )}
                    </div>
                );

                return (
                    <div key={msg.id} className={`flex ${messageAlignment}`}>
                        <div
                            className={`max-w-[75%] sm:max-w-[70%] md:max-w-md lg:max-w-lg xl:max-w-xl
                ${messageBgClass} ${messageTextColorClass} ${borderRadius}
                shadow-sm flex items-end px-3 py-2 sm:px-3.5 sm:py-2.5`}
                        >
                            {isUser ? iconElement : textAndTimestampElement}
                            {isUser ? textAndTimestampElement : iconElement}
                        </div>
                    </div>
                );
            })}

            {isSending && (
                <div className="flex justify-end">
                    <div className="max-w-[75%] sm:max-w-[70%] md:max-w-md lg:max-w-lg xl:max-w-xl bg-card text-card-foreground rounded-xl rounded-br-none shadow-sm flex items-center px-3 py-2 sm:px-3.5 sm:py-2.5">
                        <div className="flex-shrink-0 ml-2 rtl:mr-2 rtl:ml-0">
                            <Icon name="bot" className="w-4 h-4 sm:w-4 sm:h-4 text-card-foreground" />
                        </div>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Icon name="loader2" className="w-4 h-4 text-card-foreground animate-spin" />
                            <span className="text-sm text-card-foreground/70">מקליד...</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

// Wrap with error boundary
const MessageList = withErrorBoundary(MessageListComponent, {
    onError: (error, errorInfo) => {
        logger.error('MessageList error boundary triggered', error, {
            component: 'message-list',
            action: 'message-list-error'
        }, {
            errorInfo: errorInfo.componentStack
        });
    }
});

export default MessageList;
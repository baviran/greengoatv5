import React, { useEffect, useRef, useMemo } from 'react';
import { Icon } from './chatAppHelpersAndData';
import { useChatStore } from '../lib/store/chatStore';

const MessageList: React.FC = () => {
    const { activeThreadId, getMessagesForThread, isLoading, isSending } = useChatStore();

    const messages = useMemo(() => {
        return activeThreadId ? getMessagesForThread(activeThreadId) : [];
    }, [activeThreadId, getMessagesForThread]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending]);

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
                            <Icon name="bot" className="w-4 h-4 sm:w-4 sm:h-4 text-card-foreground animate-spin" />
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

export default MessageList;
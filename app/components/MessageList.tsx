import React, { useEffect, useRef } from 'react';
import { Icon } from './chatAppHelpersAndData'; // Assuming Icon is available
import { mockThreads as threads } from './chatAppHelpersAndData'; // To check if threads exist

const MessageList = ({ messages, activeThreadId }) => {
    const displayedMessages = messages.filter(msg => msg.threadId === activeThreadId);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [displayedMessages]);

    if (!activeThreadId && threads.length > 0) {
        return <div className="flex-grow flex items-center justify-center p-4"><p className="text-foreground/70">בחר שיחה מהרשימה כדי להציג הודעות.</p></div>;
    }
    if (!activeThreadId && threads.length === 0) {
        return <div className="flex-grow flex items-center justify-center p-4"><p className="text-foreground/70">התחל שיחה חדשה.</p></div>;
    }
    if (displayedMessages.length === 0 && activeThreadId) {
        return <div className="flex-grow flex items-center justify-center p-4"><p className="text-foreground/70">אין הודעות בשיחה זו. שלח הודעה כדי להתחיל!</p></div>;
    }

    return (
        <div className="flex-grow p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent bg-background" dir="rtl">
            {displayedMessages.map(msg => {
                const isUser = msg.sender === 'user';
                const messageAlignment = isUser ? 'justify-start' : 'justify-end';

                const messageBgClass = isUser ? 'bg-primary' : 'bg-card';
                const messageTextColorClass = isUser ? 'text-primary-foreground' : 'text-card-foreground';

                const borderRadius = isUser ? 'rounded-xl rounded-bl-none' : 'rounded-xl rounded-br-none';

                const iconName = isUser ? 'user' : 'bot';
                const timestampColorClass = isUser ? 'text-primary-foreground/80' : 'text-card-foreground/70';

                const iconElement = (
                    <div className={`flex-shrink-0 ${isUser ? 'mr-2 rtl:ml-2 rtl:mr-0' : 'ml-2 rtl:mr-2 rtl:ml-0'}`}>
                        <Icon name={iconName} className={`w-4 h-4 sm:w-4 sm:h-4 ${messageTextColorClass}`} />
                    </div>
                );

                const textAndTimestampElement = (
                    <div className="flex-grow min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={`text-xs mt-1 ${timestampColorClass} ${isUser ? 'text-right rtl:text-left' : 'text-left rtl:text-right'}`}>
                            {msg.timestamp}
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
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;

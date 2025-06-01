import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './chatAppHelpersAndData'; // Assuming Icon is available

const MessageInput = ({ onSendMessage, activeThreadId }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);
    const handleSendMessage = () => {
        if (message.trim() && activeThreadId) {
            onSendMessage(message.trim());
            setMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
    };
    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const minHeight = 40;
            textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, 128))}px`;
        }
    }, [message]);

    return (
        <div className="p-3 sm:p-4 border-t border-border bg-card">
            <div className="flex items-end space-x-2 rtl:space-x-reverse">
        <textarea
            ref={textareaRef}
            rows="1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={activeThreadId ? "הקלד הודעה..." : "בחר שיחה כדי לשלוח הודעה"}
            className="flex-grow p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary outline-none bg-background text-foreground text-sm max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-muted min-h-[44px] sm:min-h-[48px]"
            onKeyDown={handleKeyDown}
            disabled={!activeThreadId}
            style={{ scrollbarWidth: 'thin' }}
        />
                <button
                    onClick={handleSendMessage}
                    disabled={!activeThreadId || !message.trim()}
                    className="p-3 h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                >
                    <Icon name="send" className="w-5 h-5 transform rtl:rotate-180" />
                </button>
            </div>
        </div>
    );
};

export default MessageInput;

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/app/components/icons';
import { useAuthenticatedChatStore } from '../lib/store/chatStore';
import { useAppAuth } from '../lib/store/appStore';
import { AuthGuard } from './auth/AuthGuard';
import { Logger } from '@/app/lib/utils/logger';
import { withErrorBoundary } from '@/app/components/error-boundary/ErrorBoundary';

const logger = Logger.getInstance().withContext({
  component: 'message-input'
});

const MessageInputComponent: React.FC = () => {
    const { sendMessage, isLoading, isSending } = useAuthenticatedChatStore();
    const { user } = useAppAuth();
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const handleSendMessage = async () => {
        if (message.trim()) {
            const messageToSend = message.trim();
            setMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            try {
                await sendMessage(messageToSend);
            } catch (error) {
                logger.error('Error sending message', error, undefined, {
                    userId: user?.uid,
                    userEmail: user?.email,
                    messageLength: messageToSend.length,
                    action: 'send-user-message'
                });
            }
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { 
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            handleSendMessage(); 
        } 
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const minHeight = 40;
            textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, 128))}px`;
        }
    }, [message]);

    // Disable input during loading or sending
    const isDisabled = isLoading || isSending || !user;

    return (
        <AuthGuard 
            fallback={
                <div className="p-3 sm:p-4 border-t border-border bg-card">
                    <div className="flex items-center justify-center py-4">
                        <p className="text-foreground/70 text-sm">אנא התחבר כדי לשלוח הודעות</p>
                    </div>
                </div>
            }
        >
            <div className="p-3 sm:p-4 border-t border-border bg-card">
                <div className="flex items-end space-x-2 rtl:space-x-reverse">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={isLoading ? "טוען שיחה..." : isSending ? "שולח הודעה..." : "הקלד הודעה..."}
                        disabled={isDisabled}
                        className="flex-grow p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary outline-none bg-background text-foreground text-sm max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-muted min-h-[44px] sm:min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                        onKeyDown={handleKeyDown}
                        style={{ scrollbarWidth: 'thin' }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isDisabled}
                        className="p-3 h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] flex items-center justify-center rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        aria-label="Send message"
                    >
                        {isSending ? (
                            <Icon name="loader2" className="w-5 h-5 animate-spin" />
                        ) : (
                            <Icon name="send" className="w-5 h-5 transform rtl:rotate-180" />
                        )}
                    </button>
                </div>
            </div>
        </AuthGuard>
    );
};

// Wrap with error boundary
const MessageInput = withErrorBoundary(MessageInputComponent, {
    onError: (error, errorInfo) => {
        logger.error('MessageInput error boundary triggered', error, {
            component: 'message-input',
            action: 'message-input-error'
        }, {
            errorInfo: errorInfo.componentStack
        });
    }
});

export default MessageInput;

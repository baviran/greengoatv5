import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { ChatColumnProps } from '../types/chat';

const ChatColumn: React.FC<ChatColumnProps> = ({ messages, activeThreadId, onSendMessage }) => {
    return (
        <div className="flex flex-col h-full bg-background">
            <MessageList messages={messages} activeThreadId={activeThreadId} />
            <MessageInput onSendMessage={onSendMessage} activeThreadId={activeThreadId} />
        </div>
    );
};

export default ChatColumn;

import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatColumn: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-background">
            <MessageList />
            <MessageInput />
        </div>
    );
};

export default ChatColumn;

import React from 'react';
import MessageList from './MessageList'; // Assuming MessageList is in a separate file
import MessageInput from './MessageInput'; // Assuming MessageInput is in a separate file

const ChatColumn = ({ messages, activeThreadId, onSendMessage }) => {
    return (
        <div className="flex flex-col h-full bg-background">
            <MessageList messages={messages} activeThreadId={activeThreadId} />
            <MessageInput onSendMessage={onSendMessage} activeThreadId={activeThreadId} />
        </div>
    );
};

export default ChatColumn;

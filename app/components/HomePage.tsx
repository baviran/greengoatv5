import React from 'react';
import Sidebar from './Sidebar'; // Assuming Sidebar is in a separate file
import ChatColumn from './ChatColumn'; // Assuming ChatColumn is in a separate file
import EditorColumn from './EditorColumn'; // Assuming EditorColumn is in a separate file
import { HomePageProps } from '../types/chat';

const HomePage: React.FC<HomePageProps> = ({ isDarkMode, messages, activeThreadId, setActiveThreadId, onSendMessage, onNewChat, threads, setThreads }) => {
    return (
        <div className={`pt-16 flex h-screen`}> {/* isDarkMode prop might be redundant if dark class on html is enough */}
            <Sidebar
                activeThreadId={activeThreadId}
                setActiveThreadId={setActiveThreadId}
                onNewChat={onNewChat}
                threads={threads}
                setThreads={setThreads}
            />
            <main className="flex-grow flex mr-64 sm:mr-72 rtl:ml-0 rtl:mr-0 ml-0 sm:ml-0 rtl:mr-64 rtl:sm:mr-72">
                <div className="w-full md:w-1/2 h-full">
                    <ChatColumn messages={messages} activeThreadId={activeThreadId} onSendMessage={onSendMessage} />
                </div>
                <div className="hidden md:block w-1/2 h-full">
                    <EditorColumn />
                </div>
            </main>
        </div>
    );
};

export default HomePage;

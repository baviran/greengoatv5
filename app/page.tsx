'use client'
import React, { useState, useEffect } from 'react';
import TopBar from './components/Topbar';
import HomePage from './components/HomePage';
import { mockThreads, mockMessages } from './components/chatAppHelpersAndData';
import { useThemeStore } from './lib/store/themeStore';
import { Message } from './types/chat';

export default function Page() {
    const { value: theme, initializeTheme } = useThemeStore();
    const isDarkMode = theme === 'dark';
    const [threads, setThreads] = useState(mockThreads);
    const [messages, setMessages] = useState<Message[]>(mockMessages as Message[]);
    const [activeThreadId, setActiveThreadId] = useState(threads.length > 0 ? threads[0].id : null);

    useEffect(() => {
        initializeTheme();
        document.documentElement.dir = 'rtl';
    }, [initializeTheme]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        if (!threads.find(t => t.id === activeThreadId) && threads.length > 0) {
            setActiveThreadId(threads[0].id);
        } else if (threads.length === 0) {
            setActiveThreadId(null);
        }
    }, [threads, activeThreadId]);

    const handleSendMessage = (text: string) => {
        if (!activeThreadId) return;
        const newMessage = { id: `msg_${Date.now()}`, threadId: activeThreadId, sender: 'user' as const, text: text, timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setTimeout(() => {
            const assistantResponse = { id: `msg_${Date.now() + 1}`, threadId: activeThreadId, sender: 'assistant' as const, text: `קיבלתי: "${text.substring(0,20)}..."`, timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prevMessages => [...prevMessages, assistantResponse]);
        }, 1000);
    };
    
    const handleNewChat = (newThreadId: string) => {
        console.log("New chat:", newThreadId);
    };

    return (
        <div className="bg-background text-foreground min-h-screen antialiased">
            <TopBar />
            <HomePage
                isDarkMode={isDarkMode}
                messages={messages}
                activeThreadId={activeThreadId}
                setActiveThreadId={setActiveThreadId}
                onSendMessage={handleSendMessage}
                onNewChat={handleNewChat}
                threads={threads}
                setThreads={setThreads}
            />
        </div>
    );
}

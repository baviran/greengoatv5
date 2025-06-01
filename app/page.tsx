'use client'
import React, { useState, useEffect } from 'react';
import TopBar from './components/Topbar'; // Assuming TopBar is in a separate file
import HomePage from './components/HomePage'; // Assuming HomePage is in a separate file
import { mockThreads, mockMessages } from './components/chatAppHelpersAndData'; // Assuming mockData is available

// Main App Component (e.g., app/page.tsx for Next.js App Router)
export default function Page() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [threads, setThreads] = useState(mockThreads);
    const [messages, setMessages] = useState(mockMessages);
    const [activeThreadId, setActiveThreadId] = useState(threads.length > 0 ? threads[0].id : null);

    useEffect(() => {
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedMode = localStorage.getItem('darkMode');
        let currentMode = savedMode !== null ? (savedMode === 'true') : prefersDarkMode;

        setIsDarkMode(currentMode);
        if (currentMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.documentElement.dir = 'rtl';
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [isDarkMode]);

    useEffect(() => {
        // If active thread is deleted, select the first available thread or null
        if (!threads.find(t => t.id === activeThreadId) && threads.length > 0) {
            setActiveThreadId(threads[0].id);
        } else if (threads.length === 0) { // If all threads are deleted
            setActiveThreadId(null);
        }
    }, [threads, activeThreadId]);

    const toggleDarkMode = () => setIsDarkMode(prevMode => !prevMode);

    const handleSendMessage = (text) => {
        if (!activeThreadId) return;
        const newMessage = { id: `msg_${Date.now()}`, threadId: activeThreadId, sender: 'user', text: text, timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setTimeout(() => {
            const assistantResponse = { id: `msg_${Date.now() + 1}`, threadId: activeThreadId, sender: 'assistant', text: `קיבלתי: "${text.substring(0,20)}..."`, timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prevMessages => [...prevMessages, assistantResponse]);
        }, 1000);
    };
    const handleNewChat = (newThreadId) => {
        console.log("New chat:", newThreadId);
        // Potentially clear messages for the new thread or fetch them if this were a real app
    };

    return (
        <div className="bg-background text-foreground min-h-screen antialiased">
            <TopBar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
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

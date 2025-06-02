'use client'
import React, { useEffect } from 'react';
import TopBar from './components/Topbar';
import Main from './components/Main';
import { useThemeStore } from './lib/store/themeStore';
import { useChatStore } from './lib/store/chatStore';

export default function Page() {
    const { value: theme, initializeTheme } = useThemeStore();
    const { initializeStore } = useChatStore();

    const isDarkMode = theme === 'dark';

    useEffect(() => {
        initializeTheme();
        initializeStore();
        document.documentElement.dir = 'rtl';
    }, [initializeTheme, initializeStore]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <div className="bg-background text-foreground min-h-screen antialiased">
            <TopBar />
            <Main />
        </div>
    );
}

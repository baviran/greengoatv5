'use client'
import React, { useEffect } from 'react';
import TopBar from './components/Topbar';
import Main from './components/Main';
import { useAppStore, useAppSelector } from './lib/store/appStore';
import { PageErrorBoundary } from '@/app/components/error-boundary/PageErrorBoundary';

export default function Page() {
    const { manager } = useAppStore();
    const theme = useAppSelector(store => store?.ui?.theme?.theme || 'light');

    const isDarkMode = theme === 'dark';

    useEffect(() => {
        // Initialize app store
        manager.initialize();
        
        document.documentElement.dir = 'rtl';
    }, [manager]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <PageErrorBoundary
            theme={theme}
        >
            <div className="bg-background text-foreground min-h-screen antialiased">
                <TopBar />
                <Main />
            </div>
        </PageErrorBoundary>
    );
}

'use client'
import React, { useEffect, useState } from 'react';
import TopBar from './components/Topbar';
import Main from './components/Main';
import { AdminPanel } from './components/AdminPanel';
import { useAppStore, useAppAuth, useAppSelector } from './lib/store/appStore';
import { PageErrorBoundary } from '@/app/components/error-boundary/PageErrorBoundary';
import { AdminPanelErrorBoundary } from '@/app/components/error-boundary/AdminPanelErrorBoundary';

export default function Page() {
    const { manager } = useAppStore();
    const { user } = useAppAuth();
    const theme = useAppSelector(store => store.theme?.theme || 'light');
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    const isDarkMode = theme === 'dark';

    useEffect(() => {
        // Initialize app store with user context
        if (user) {
            manager.initialize(user.uid);
        } else {
            manager.initialize();
        }
        
        document.documentElement.dir = 'rtl';
    }, [manager, user]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Show admin panel if user is signed in and pressing Ctrl+Shift+A
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A' && user) {
                setShowAdminPanel(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [user]);

    return (
        <PageErrorBoundary
            user={user ? {
                uid: user.uid,
                email: user.email ?? null
            } : null}
            theme={theme}
            showAdminPanel={showAdminPanel}
        >
            <div className="bg-background text-foreground min-h-screen antialiased">
                <TopBar />
                {showAdminPanel && (
                    <AdminPanelErrorBoundary user={user ? {
                        uid: user.uid,
                        email: user.email ?? null
                    } : null}>
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Admin Panel</h2>
                                    <button
                                        onClick={() => setShowAdminPanel(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <AdminPanel />
                            </div>
                        </div>
                    </AdminPanelErrorBoundary>
                )}
                <Main />
            </div>
        </PageErrorBoundary>
    );
}

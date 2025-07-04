'use client';

import React from 'react';
import { Icon } from '@/app/components/icons';
import { useThemeStore } from '../lib/store/themeStore';
import { useAuthContext } from '@/context/auth-context';
import { SignInButton } from './auth/SignInButton';
import { UserProfile } from './auth/UserProfile';

const TopBar: React.FC = () => {
    const { value: theme, toggleTheme } = useThemeStore();
    const { user, loading } = useAuthContext();
    const isDarkMode = theme === 'dark';

    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 z-50">
            <h1 className="text-foreground font-semibold text-lg">
                בניה ירוקה בעידן הבינה המלאכותית
            </h1>
            <div className="flex items-center space-x-4">
                {/* Authentication Section */}
                {loading ? (
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : user ? (
                    <UserProfile />
                ) : (
                    <SignInButton variant="outline" className="text-sm py-1 px-3" />
                )}
                
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                    className="p-2 rounded-md text-foreground hover:bg-muted"
                >
                    {isDarkMode ? <Icon name="sun" className="w-6 h-6 text-yellow-400" /> : <Icon name="moon" className="w-6 h-6 text-slate-700" />}
                </button>
            </div>
        </div>
    );
};

export default TopBar;

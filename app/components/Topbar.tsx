'use client';

import React from 'react';
import { useAppAuth } from '../lib/store/appStore';
import { SignInButton } from './auth/SignInButton';
import { UserProfile } from './auth/UserProfile';

const TopBar: React.FC = () => {
    const { user, isLoading: loading } = useAppAuth();

    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 z-50">
            <h1 className="text-foreground font-semibold text-lg">
                בניה ירוקה בעידן הבינה המלאכותית
            </h1>
            <div className="flex items-center space-x-4">
                {/* Authentication Section */}
                {loading ? (
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : user ? (
                    <UserProfile />
                ) : (
                    <SignInButton variant="outline" className="text-sm py-1 px-3" />
                )}
            </div>
        </div>
    );
};

export default TopBar;

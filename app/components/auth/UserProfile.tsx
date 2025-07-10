'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAppAuth } from '../../lib/store/appStore';

interface UserProfileProps {
  className?: string;
  showFullProfile?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  className = '', 
  showFullProfile = false 
}) => {
  const { user, isLoading: loading } = useAppAuth();
  
  // Helper function for sign out
  const signOut = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  if (showFullProfile) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 max-w-sm ${className}`} dir="rtl">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Image
            src={user.photoURL || '/default-avatar.png'}
            alt={user.displayName || 'משתמש'}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-foreground">{user.displayName}</h3>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'מתנתק...' : 'התנתק'}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 rtl:space-x-reverse bg-muted hover:bg-muted/80 rounded-full p-2 transition-colors"
      >
        <Image
          src={user.photoURL || '/default-avatar.png'}
          alt={user.displayName || 'משתמש'}
          width={32}
          height={32}
          className="rounded-full"
        />
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {user.displayName?.split(' ')[0] || 'משתמש'}
        </span>
        <svg 
          className="w-4 h-4 text-muted-foreground" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute left-0 mt-2 w-48 bg-card rounded-lg border border-border shadow-lg z-50" dir="rtl">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="py-2">
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {loading ? 'מתנתק...' : 'התנתק'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 
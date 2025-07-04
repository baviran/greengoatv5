'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/auth-context';

interface UserProfileProps {
  className?: string;
  showFullProfile?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  className = '', 
  showFullProfile = false 
}) => {
  const { user, signOut, loading } = useAuthContext();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  if (showFullProfile) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 max-w-sm ${className}`}>
        <div className="flex items-center space-x-4">
          <img
            src={user.photoURL || '/default-avatar.png'}
            alt={user.displayName || 'User'}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
      >
        <img
          src={user.photoURL || '/default-avatar.png'}
          alt={user.displayName || 'User'}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.displayName?.split(' ')[0] || 'User'}
        </span>
        <svg 
          className="w-4 h-4 text-gray-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <div className="py-2">
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 
'use client';

import { useAuthContext } from '@/context/auth-context';
import { useAuthenticatedChatStore } from '@/app/lib/store/chatStore';
import { useEffect, useState } from 'react';
import { Logger } from '@/app/lib/utils/logger';

const logger = Logger.getInstance();

export default function DebugAuth() {
  const { user, loading } = useAuthContext();
  const { userContext, isInitialized, threads, activeThreadId, messagesByThread, error } = useAuthenticatedChatStore();
  
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  
  useEffect(() => {
    const info = {
      timestamp: new Date().toISOString(),
      auth: {
        hasUser: !!user,
        userId: user?.uid,
        userEmail: user?.email,
        authLoading: loading
      },
      chatStore: {
        hasUserContext: !!userContext,
        userContextId: userContext?.uid,
        isInitialized,
        threadsCount: threads.length,
        activeThreadId,
        messagesCount: Object.keys(messagesByThread).length,
        error
      }
    };
    
    logger.info('Debug info update', { component: 'debug-auth' }, info);
    
    setDebugInfo(prev => [...prev.slice(-10), info]); // Keep last 10 entries
  }, [user, loading, userContext, isInitialized, threads, activeThreadId, messagesByThread, error]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔍 Auth & Chat Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">🔐 Auth Status</h2>
            <pre className="text-sm bg-gray-50 p-2 rounded">
              {JSON.stringify({
                hasUser: !!user,
                userId: user?.uid,
                userEmail: user?.email,
                loading,
                displayName: user?.displayName
              }, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">💬 Chat Store Status</h2>
            <pre className="text-sm bg-gray-50 p-2 rounded">
              {JSON.stringify({
                hasUserContext: !!userContext,
                userContextId: userContext?.uid,
                isInitialized,
                threadsCount: threads.length,
                activeThreadId,
                messagesCount: Object.keys(messagesByThread).length,
                error
              }, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">📊 Debug Timeline</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-mono text-gray-500">{info.timestamp}</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <strong>Auth:</strong> User={info.auth.hasUser ? '✅' : '❌'} Loading={info.auth.authLoading ? '⏳' : '✅'}
                  </div>
                  <div>
                    <strong>Chat:</strong> Init={info.chatStore.isInitialized ? '✅' : '❌'} Threads={info.chatStore.threadsCount} Error={info.chatStore.error ? '❌' : '✅'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
} 
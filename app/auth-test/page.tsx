'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AuthTest() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Simple auth test
  const testAuth = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { auth } = await import('@/lib/firebase');
      const { signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged } = await import('firebase/auth');
      
      console.log('🔧 Testing Firebase Auth');
      console.log('🏠 Domain:', window.location.hostname);
      console.log('🔗 Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
      console.log('🎯 Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      
      // Check for existing redirect result first
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('✅ Got redirect result!', result.user.email);
        setUser(result.user);
        setLoading(false);
        return;
      }
      
      // Set up auth listener
      onAuthStateChanged(auth, (user) => {
        console.log('👤 Auth state changed:', user?.email || 'No user');
        setUser(user);
        setLoading(false);
      });
      
      // Try redirect
      const provider = new GoogleAuthProvider();
      console.log('🚀 Starting redirect...');
      await signInWithRedirect(auth, provider);
      
    } catch (err: any) {
      console.error('❌ Auth error:', err);
      setError(`Auth failed: ${err.message}`);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      await auth.signOut();
      setUser(null);
    } catch (err: any) {
      setError(`Sign out failed: ${err.message}`);
    }
  };

  useEffect(() => {
    // Check for redirect result on page load
    const checkRedirect = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const { getRedirectResult, onAuthStateChanged } = await import('firebase/auth');
        
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Page load redirect result:', result.user.email);
          setUser(result.user);
        }
        
        onAuthStateChanged(auth, (user) => {
          console.log('👤 Auth state:', user?.email || 'No user');
          setUser(user);
        });
      } catch (err) {
        console.error('❌ Redirect check failed:', err);
      }
    };
    
    checkRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">🔧 Auth Test</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p><strong>Domain:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'Loading...'}</p>
            <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</p>
            <p><strong>Project:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
          </div>
          
          {user ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h2 className="text-green-800 font-semibold">✅ Authenticated!</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.displayName}</p>
              <p><strong>UID:</strong> {user.uid}</p>
              <button
                onClick={signOut}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={testAuth}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing Auth...' : 'Test Google Sign-In'}
              </button>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h3 className="text-red-800 font-semibold">❌ Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Main App
          </Link>
        </div>
      </div>
    </div>
  );
} 
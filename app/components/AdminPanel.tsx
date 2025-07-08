'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/auth-context';

export const AdminPanel: React.FC = () => {
  const { user, getIdToken } = useAuthContext();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateUser = async () => {
    if (!email.trim()) {
      setMessage('❌ נדרש כתובת מייל');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = await getIdToken();
      if (!token) {
        setMessage('❌ נכשל בקבלת אסימון אימות');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          role
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ משתמש נוצר בהצלחה: ${result.email}`);
        setEmail('');
        setRole('user');
      } else {
        setMessage(`❌ שגיאה: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('❌ נכשל ביצירת משתמש');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateUsers = async () => {
    setMigrationLoading(true);
    setMessage('');

    try {
      const token = await getIdToken();
      if (!token) {
        setMessage('❌ נכשל בקבלת אסימון אימות');
        return;
      }

      const response = await fetch('/api/admin/migrate-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ ${result.message} - הועברו ${result.migrated} משתמשים, דולגו ${result.skipped}`);
      } else {
        setMessage(`❌ שגיאה במעבר: ${result.error}`);
      }
    } catch (error) {
      console.error('Error migrating users:', error);
      setMessage('❌ נכשל במעבר משתמשים');
    } finally {
      setMigrationLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-muted rounded-lg" dir="rtl">
        <p className="text-muted-foreground">אנא התחבר כדי לגשת לפאנל הניהול</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg border border-border shadow-md" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-foreground">פאנל ניהול</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            כתובת מייל *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            placeholder="user@example.com"
            disabled={loading}
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            תפקיד
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            disabled={loading}
          >
            <option value="user">משתמש</option>
            <option value="admin">מנהל</option>
          </select>
        </div>

        <button
          onClick={handleCreateUser}
          disabled={loading || !email.trim()}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground py-2 px-4 rounded-md transition-colors"
        >
          {loading ? 'יוצר...' : 'צור משתמש'}
        </button>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">
            מעבר למבנה חדש של בסיס הנתונים
          </p>
          <button
            onClick={handleMigrateUsers}
            disabled={migrationLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-muted text-white py-2 px-4 rounded-md transition-colors"
          >
            {migrationLoading ? 'מעביר נתונים...' : 'העבר משתמשים למבנה חדש'}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          מחובר כ: <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>
    </div>
  );
}; 
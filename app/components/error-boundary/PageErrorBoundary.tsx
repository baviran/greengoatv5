'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Logger } from '@/app/lib/utils/logger';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  user?: {
    uid: string;
    email: string | null;
  } | null;
  theme?: string;
  showAdminPanel?: boolean;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ 
  children, 
  user, 
  theme, 
  showAdminPanel 
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        const logger = Logger.getInstance();
        logger.error('Error in main page', error, {
          component: 'main-page',
          action: 'page-error',
          userId: user?.uid
        }, {
          errorInfo: errorInfo.componentStack,
          userContext: {
            userId: user?.uid,
            userEmail: user?.email || undefined,
            theme: theme,
            showAdminPanel: showAdminPanel
          }
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}; 
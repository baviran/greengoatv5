'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Logger } from '@/app/lib/utils/logger';

interface AdminPanelErrorBoundaryProps {
  children: React.ReactNode;
  user?: {
    uid: string;
    email: string | null;
  } | null;
}

export const AdminPanelErrorBoundary: React.FC<AdminPanelErrorBoundaryProps> = ({ 
  children, 
  user 
}) => {
  return (
    <ErrorBoundary
      isolate={true}
      onError={(error, errorInfo) => {
        const logger = Logger.getInstance();
        logger.error('Error in admin panel overlay', error, {
          component: 'admin-panel-overlay',
          action: 'admin-panel-error',
          userId: user?.uid
        }, {
          errorInfo: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}; 
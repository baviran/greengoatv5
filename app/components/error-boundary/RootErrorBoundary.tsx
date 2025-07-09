'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Logger } from '@/app/lib/utils/logger';

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

export const RootErrorBoundary: React.FC<RootErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log critical application errors
        const logger = Logger.getInstance();
        logger.error('Critical application error in root layout', error, {
          component: 'root-layout',
          action: 'critical-error'
        }, {
          errorInfo: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}; 
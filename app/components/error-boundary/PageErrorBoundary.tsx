'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Logger } from '@/app/lib/utils/logger';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  theme?: string;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ 
  children, 
  theme
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        const logger = Logger.getInstance();
        logger.error('Error in main page', error, {
          component: 'main-page',
          action: 'page-error'
        }, {
          errorInfo: errorInfo.componentStack,
          context: {
            theme: theme
          }
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}; 
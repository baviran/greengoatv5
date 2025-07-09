'use client';

import React from 'react';
import { ErrorInfo } from 'react';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  onRetry: () => void;
  onReload: () => void;
  isolate?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReload,
  isolate = false
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className={`${isolate ? 'p-4 border border-red-200 rounded-lg' : 'min-h-screen'} bg-red-50 flex items-center justify-center`}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {isolate ? 'Component Error' : 'Something went wrong'}
        </h2>

        <p className="text-gray-600 text-center mb-6">
          {isolate 
            ? 'This component encountered an error and couldn\'t render properly.'
            : 'We apologize for the inconvenience. The application encountered an unexpected error.'
          }
        </p>

        {isDevelopment && error && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Error Details (Development Mode):</h3>
            <p className="text-sm text-red-600 mb-2">
              <strong>Error:</strong> {error.message}
            </p>
            {errorId && (
              <p className="text-sm text-gray-600 mb-2">
                <strong>Error ID:</strong> {errorId}
              </p>
            )}
            {errorInfo && (
              <details className="mt-2">
                <summary className="text-sm text-gray-600 cursor-pointer">Component Stack</summary>
                <pre className="text-xs text-gray-500 mt-2 overflow-x-auto bg-gray-50 p-2 rounded">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
          
          {!isolate && (
            <button
              onClick={onReload}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
};

export default ErrorFallback; 
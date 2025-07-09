'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from '@/app/lib/utils/logger';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private logger: Logger;
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
    
    this.logger = Logger.getInstance();
    this.previousResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log the error with context
    this.logger.error('React Error Boundary caught an error', error, {
      component: 'error-boundary',
      action: 'component-error',
      userId: this.getUserId()
    }, {
      errorId,
      errorBoundary: this.constructor.name,
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name
      },
      errorType: error.constructor.name,
      errorMessage: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external monitoring if available
    this.reportToMonitoring(error, errorInfo, errorId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys?.[index] !== key
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset on any props change if resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private getUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      // Check if user is available in context or global state
      // This is a simplified version - you might need to adapt based on your auth system
      if (typeof window !== 'undefined') {
        // Check localStorage for user data
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          return user.uid;
        }
      }
    } catch {
      // Ignore errors when getting user ID
    }
    return undefined;
  }

  private reportToMonitoring(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // This is where you'd integrate with external monitoring services
    // Example: Sentry, LogRocket, Bugsnag, etc.
    try {
      // Example Sentry integration (commented out)
      // if (typeof window !== 'undefined' && window.Sentry) {
      //   window.Sentry.withScope((scope) => {
      //     scope.setTag('errorBoundary', true);
      //     scope.setTag('errorId', errorId);
      //     scope.setContext('errorInfo', errorInfo);
      //     window.Sentry.captureException(error);
      //   });
      // }
      
      // For now, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 Error Boundary Caught Error');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Error ID:', errorId);
        console.groupEnd();
      }
    } catch (monitoringError) {
      this.logger.error('Error reporting to monitoring service failed', monitoringError, {
        component: 'error-boundary',
        action: 'monitoring-error'
      }, {
        originalErrorId: errorId
      });
    }
  }

  private resetErrorBoundary = () => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    this.logger.info('Error boundary reset', {
      component: 'error-boundary',
      action: 'reset'
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          isolate={this.props.isolate}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for manually triggering error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

export default ErrorBoundary; 
import { Logger } from '@/app/lib/utils/logger';

// Example of proper logging patterns
export class LoggingExample {
  private logger = Logger.getInstance().withContext({
    component: 'logging-example'
  });

  async demonstrateLogging() {
    const userId = 'user-123';
    const context = {
      userId,
      requestId: 'req-456',
      component: 'logging-example',
      action: 'demonstrate-logging'
    };

    // ✅ Info level logging
    this.logger.info('Starting logging demonstration', context, {
      demonstrationId: 'demo-789'
    });

    // ✅ Debug level logging
    this.logger.debug('Debug information', context, {
      debugData: { step: 1, phase: 'initialization' }
    });

    try {
      // ✅ Business logic with logging
      const result = await this.performBusinessLogic(userId, context);
      
      // ✅ Success logging
      this.logger.info('Business logic completed successfully', context, {
        resultId: result.id,
        processingTime: result.processingTime
      });

      return result;
    } catch (error) {
      // ✅ Error logging with context
      this.logger.error('Business logic failed', error, context, {
        errorType: error.constructor.name,
        step: 'business-logic'
      });
      throw error;
    }
  }

  async performBusinessLogic(userId: string, context: any) {
    this.logger.info('Performing business logic', context, {
      userId,
      operation: 'complex-calculation'
    });

    // Simulate some work
    const startTime = Date.now();
    
    // ✅ Warning logging
    if (Math.random() > 0.8) {
      this.logger.warn('High processing time detected', context, {
        userId,
        threshold: 1000
      });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return {
      id: 'result-123',
      userId,
      processingTime,
      timestamp: new Date().toISOString()
    };
  }

  // ✅ Client-side logging example
  logUserInteraction(action: string, userId?: string) {
    this.logger.info('User interaction', {
      component: 'logging-example',
      action: 'user-interaction',
      userId,
      interactionType: action,
      timestamp: new Date().toISOString()
    });
  }

  // ✅ Performance logging
  async measurePerformance<T>(
    operation: string, 
    fn: () => Promise<T>, 
    context: any
  ): Promise<T> {
    const startTime = performance.now();
    
    this.logger.debug('Starting performance measurement', context, {
      operation,
      startTime
    });

    try {
      const result = await fn();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logger.info('Performance measurement completed', context, {
        operation,
        duration,
        durationMs: Math.round(duration),
        success: true
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logger.error('Performance measurement failed', error, context, {
        operation,
        duration,
        durationMs: Math.round(duration),
        success: false
      });

      throw error;
    }
  }

  // ✅ Sanitized logging (no sensitive data)
  logUserAction(user: any, action: string) {
    this.logger.info('User action logged', {
      component: 'logging-example',
      action: 'user-action',
      userId: user.uid,
      // ✅ Don't log sensitive data like passwords, tokens, etc.
      userEmail: user.email ? user.email.substring(0, 3) + '***' : undefined,
      actionType: action,
      timestamp: new Date().toISOString()
    });
  }
}

// Example usage in different scenarios
export const loggingExamples = {
  // ✅ Component logging
  componentLogging: (logger: Logger, user: any) => {
    logger.info('Component rendered', {
      component: 'example-component',
      action: 'render',
      userId: user?.uid,
      hasProps: true
    });
  },

  // ✅ API request logging
  apiRequestLogging: (logger: Logger, endpoint: string, user: any) => {
    logger.info('API request started', {
      component: 'api-client',
      action: 'request',
      endpoint,
      userId: user?.uid,
      method: 'POST'
    });
  },

  // ✅ Error boundary logging
  errorBoundaryLogging: (logger: Logger, error: Error, errorInfo: any) => {
    logger.error('React error boundary caught error', error, {
      component: 'error-boundary',
      action: 'component-error',
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  },

  // ✅ State change logging
  stateChangeLogging: (logger: Logger, previousState: any, newState: any, user: any) => {
    logger.debug('State changed', {
      component: 'state-manager',
      action: 'state-change',
      userId: user?.uid,
      stateKeys: Object.keys(newState),
      hasChanges: JSON.stringify(previousState) !== JSON.stringify(newState)
    });
  }
};

// ❌ Examples of what NOT to do
export const badLoggingExamples = {
  // ❌ Don't use console.log
  badConsoleLogging: () => {
    console.log('This is bad - use Logger.getInstance() instead');
  },

  // ❌ Don't log sensitive data
  badSensitiveLogging: (logger: Logger, user: any) => {
    logger.info('User login', {
      password: user.password, // ❌ Never log passwords
      token: user.authToken,   // ❌ Never log tokens
      socialSecurityNumber: user.ssn // ❌ Never log PII
    });
  },

  // ❌ Don't log without context
  badContextLogging: (logger: Logger) => {
    logger.info('Something happened'); // ❌ No context about what/where/when
  }
}; 
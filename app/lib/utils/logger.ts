import pino from 'pino';

// Enhanced context interface for structured logging
export interface LogContext {
  userId?: string;
  userEmail?: string;
  requestId?: string;
  component?: string;
  action?: string;
  threadId?: string;
  runId?: string;
  metadata?: Record<string, any>;
}

// Internal enhanced context that includes performance metrics
interface EnhancedLogContext extends LogContext {
  timestamp?: string;
  duration?: number;
  traceId?: string;
}

// Browser-compatible setImmediate polyfill
const setImmediatePolyfill = (callback: () => void) => {
  if (typeof setImmediate !== 'undefined') {
    setImmediate(callback);
  } else {
    setTimeout(callback, 0);
  }
};

export class Logger {
  private static instance: Logger;
  private logger: pino.Logger;
  private isProduction: boolean;
  private isBrowser: boolean;

  private constructor() {
    // Configure logger for Next.js server environment
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isBrowser = typeof window !== 'undefined';
    
    // In development, use simple console logging to avoid worker exit issues
    if (!this.isProduction) {
      this.logger = pino({
        level: 'debug',
        timestamp: pino.stdTimeFunctions.isoTime,
        // No transport in development to avoid worker issues
      });
    } else {
      this.logger = pino({
        level: 'info',
        timestamp: pino.stdTimeFunctions.isoTime
      });
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Enhanced info method with context support
  info(message: string, context?: LogContext, data?: Record<string, any>): void {
    const enhancedContext = this.enhanceContext(context);
    const logData = { ...enhancedContext, ...data };
    
    if (this.isProduction) {
      // Use browser-compatible async logging
      setImmediatePolyfill(() => {
        try {
          if (this.isBrowser) {
            // In browser, use console.log for now to avoid pino issues
            console.log(`[INFO] ${message}`, logData);
          } else {
            this.logger.info(logData, message);
          }
        } catch {
          // Ignore worker exit errors during development
        }
      });
    } else {
      // Use direct stdout in development to avoid worker exit issues
      try {
        const timestamp = new Date().toISOString();
        const logString = `[${timestamp}] [INFO] ${message} ${JSON.stringify(logData)}\n`;
        if (this.isBrowser) {
          console.log(`[INFO] ${message}`, logData);
        } else {
          process.stdout.write(logString);
        }
      } catch {
        // Silently ignore if stdout fails
      }
    }
  }

  // Enhanced error method with context support
  error(message: string, error?: Error | unknown, context?: LogContext, data?: Record<string, any>): void {
    const enhancedContext = this.enhanceContext(context);
    const logData: any = { ...enhancedContext, ...data };

    if (error instanceof Error) {
      logData.error = { 
        message: error.message, 
        stack: error.stack,
        name: error.name
      };
    } else if (error) {
      logData.error = error;
    }

    if (this.isProduction) {
      // Use browser-compatible async logging
      setImmediatePolyfill(() => {
        try {
          if (this.isBrowser) {
            // In browser, use console.error for now to avoid pino issues
            console.error(`[ERROR] ${message}`, logData);
          } else {
            this.logger.error(logData, message);
          }
        } catch {
          // Ignore worker exit errors during development
        }
      });
    } else {
      // Use direct stderr in development to avoid worker exit issues
      try {
        const timestamp = new Date().toISOString();
        const logString = `[${timestamp}] [ERROR] ${message} ${JSON.stringify(logData)}\n`;
        if (this.isBrowser) {
          console.error(`[ERROR] ${message}`, logData);
        } else {
          process.stderr.write(logString);
        }
      } catch {
        // Silently ignore if stderr fails
      }
    }
  }

  // Enhanced warn method with context support
  warn(message: string, context?: LogContext, data?: Record<string, any>): void {
    const enhancedContext = this.enhanceContext(context);
    const logData = { ...enhancedContext, ...data };
    
    if (this.isProduction) {
      // Use browser-compatible async logging
      setImmediatePolyfill(() => {
        try {
          if (this.isBrowser) {
            // In browser, use console.warn for now to avoid pino issues
            console.warn(`[WARN] ${message}`, logData);
          } else {
            this.logger.warn(logData, message);
          }
        } catch {
          // Ignore worker exit errors during development
        }
      });
    } else {
      // Use direct stdout in development to avoid worker exit issues
      try {
        const timestamp = new Date().toISOString();
        const logString = `[${timestamp}] [WARN] ${message} ${JSON.stringify(logData)}\n`;
        if (this.isBrowser) {
          console.warn(`[WARN] ${message}`, logData);
        } else {
          process.stdout.write(logString);
        }
      } catch {
        // Silently ignore if stdout fails
      }
    }
  }

  // Enhanced debug method with context support
  debug(message: string, context?: LogContext, data?: Record<string, any>): void {
    const enhancedContext = this.enhanceContext(context);
    const logData = { ...enhancedContext, ...data };
    
    if (this.isProduction) {
      // Use browser-compatible async logging
      setImmediatePolyfill(() => {
        try {
          if (this.isBrowser) {
            // In browser, use console.debug for now to avoid pino issues
            console.debug(`[DEBUG] ${message}`, logData);
          } else {
            this.logger.debug(logData, message);
          }
        } catch {
          // Ignore worker exit errors during development
        }
      });
    } else {
      // Use direct stdout in development to avoid worker exit issues
      try {
        const timestamp = new Date().toISOString();
        const logString = `[${timestamp}] [DEBUG] ${message} ${JSON.stringify(logData)}\n`;
        if (this.isBrowser) {
          console.debug(`[DEBUG] ${message}`, logData);
        } else {
          process.stdout.write(logString);
        }
      } catch {
        // Silently ignore if stdout fails
      }
    }
  }

  // Convenience method for request start logging
  requestStart(message: string, context?: LogContext, data?: Record<string, any>): void {
    const enhancedContext = this.enhanceContext(context);
    const logData = { 
      ...enhancedContext, 
      ...data, 
      event: 'request_start',
      timestamp: new Date().toISOString()
    };
    
    this.info(message, undefined, logData);
  }

  // Convenience method for request end logging with duration
  requestEnd(message: string, startTime: number, context?: LogContext, data?: Record<string, any>): void {
    const duration = Date.now() - startTime;
    const enhancedContext = this.enhanceContext(context);
    const logData = { 
      ...enhancedContext, 
      ...data, 
      event: 'request_end',
      duration,
      timestamp: new Date().toISOString()
    };
    
    this.info(message, undefined, logData);
  }

  // Method to create a child logger with consistent context
  withContext(context: LogContext): LoggerWithContext {
    return new LoggerWithContext(this, context);
  }

  // Private method to enhance context with additional metadata
  private enhanceContext(context?: LogContext): EnhancedLogContext {
    const enhanced: EnhancedLogContext = {
      ...context,
      timestamp: new Date().toISOString(),
      traceId: this.generateTraceId()
    };

    // Add performance metrics if available
    if (typeof performance !== 'undefined' && performance.now) {
      enhanced.duration = performance.now();
    }

    return enhanced;
  }

  // Generate a simple trace ID for request correlation
  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Legacy methods for backward compatibility
  info_legacy(message: string, data?: Record<string, any>): void {
    this.info(message, undefined, data);
  }

  error_legacy(message: string, error?: Error | unknown, data?: Record<string, any>): void {
    this.error(message, error, undefined, data);
  }

  warn_legacy(message: string, data?: Record<string, any>): void {
    this.warn(message, undefined, data);
  }

  debug_legacy(message: string, data?: Record<string, any>): void {
    this.debug(message, undefined, data);
  }
}

// Logger with preset context for consistent logging
class LoggerWithContext {
  constructor(private logger: Logger, private defaultContext: LogContext) {}

  info(message: string, context?: LogContext, data?: Record<string, any>): void {
    const mergedContext = { ...this.defaultContext, ...context };
    this.logger.info(message, mergedContext, data);
  }

  error(message: string, error?: Error | unknown, context?: LogContext, data?: Record<string, any>): void {
    const mergedContext = { ...this.defaultContext, ...context };
    this.logger.error(message, error, mergedContext, data);
  }

  warn(message: string, context?: LogContext, data?: Record<string, any>): void {
    const mergedContext = { ...this.defaultContext, ...context };
    this.logger.warn(message, mergedContext, data);
  }

  debug(message: string, context?: LogContext, data?: Record<string, any>): void {
    const mergedContext = { ...this.defaultContext, ...context };
    this.logger.debug(message, mergedContext, data);
  }

  requestStart(message: string, context?: LogContext, data?: Record<string, any>): void {
    const mergedContext = { ...this.defaultContext, ...context };
    this.logger.requestStart(message, mergedContext, data);
  }

  requestEnd(message: string, startTime: number, context?: LogContext, data?: Record<string, any>): void {
    const mergedContext = { ...this.defaultContext, ...context };
    this.logger.requestEnd(message, startTime, mergedContext, data);
  }
}

export default Logger;
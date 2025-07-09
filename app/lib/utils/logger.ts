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

export class Logger {
  private static instance: Logger;
  private logger: pino.Logger;
  private isProduction: boolean;

  private constructor() {
    // Configure logger for Next.js server environment
    this.isProduction = process.env.NODE_ENV === 'production';
    
    this.logger = pino({
      level: this.isProduction ? 'info' : 'debug',
      timestamp: pino.stdTimeFunctions.isoTime,
      // In production, use structured JSON output for better parsing
      transport: this.isProduction 
        ? undefined 
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'hostname,pid'
            }
          }
    });
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
      // Async logging in production for better performance
      setImmediate(() => this.logger.info(logData, message));
    } else {
      this.logger.info(logData, message);
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
      // Async logging in production for better performance
      setImmediate(() => this.logger.error(logData, message));
    } else {
      this.logger.error(logData, message);
    }
  }

  // Enhanced warn method with context support
  warn(message: string, context?: LogContext, data?: Record<string, any>): void {
    const enhancedContext = this.enhanceContext(context);
    const logData = { ...enhancedContext, ...data };
    
    if (this.isProduction) {
      // Async logging in production for better performance
      setImmediate(() => this.logger.warn(logData, message));
    } else {
      this.logger.warn(logData, message);
    }
  }

  // Enhanced debug method with context support
  debug(message: string, context?: LogContext, data?: Record<string, any>): void {
    const enhancedContext = this.enhanceContext(context);
    const logData = { ...enhancedContext, ...data };
    
    if (this.isProduction) {
      // Async logging in production for better performance
      setImmediate(() => this.logger.debug(logData, message));
    } else {
      this.logger.debug(logData, message);
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
    if (!context) return {};
    
    const enhanced: EnhancedLogContext = {
      ...context,
      timestamp: new Date().toISOString()
    };

    // Add trace ID if request ID is available
    if (context.requestId) {
      enhanced.traceId = context.requestId;
    }

    // Filter out undefined values to keep logs clean
    return Object.fromEntries(
      Object.entries(enhanced).filter(([, value]) => value !== undefined)
    );
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

// Helper class for contextual logging
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
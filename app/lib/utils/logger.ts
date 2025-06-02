import pino from 'pino';

export class Logger {
  private static instance: Logger;
  private logger: pino.Logger;

  private constructor() {
    // Configure logger for Next.js server environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.logger = pino({
      level: isProduction ? 'info' : 'debug',
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  info(message: string, data?: Record<string, any>): void {
    this.logger.info(data, message);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, any>): void {
    if (error instanceof Error) {
      this.logger.error({ ...data, error: { message: error.message, stack: error.stack } }, message);
    } else {
      this.logger.error({ ...data, error }, message);
    }
  }

  warn(message: string, data?: Record<string, any>): void {
    this.logger.warn(data, message);
  }

  debug(message: string, data?: Record<string, any>): void {
    this.logger.debug(data, message);
  }
}
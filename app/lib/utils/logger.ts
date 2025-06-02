import pino from 'pino';

/**
 * Logger utility class for the application
 */
export class Logger {
  private static instance: Logger;
  private logger: pino.Logger;

  private constructor() {
    this.logger = pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
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
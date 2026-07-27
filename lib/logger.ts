type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  private get minLevel(): number {
    const envLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
    return LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isDevelopment) {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
      };
      const reset = '\x1b[0m';
      const formattedMessage = `${colors[level]}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`;

      switch (level) {
        case 'error':
          console.error(formattedMessage, context || '');
          break;
        case 'warn':
          console.warn(formattedMessage, context || '');
          break;
        case 'info':
          console.log(formattedMessage, context || '');
          break;
        case 'debug':
          console.debug(formattedMessage, context || '');
          break;
      }
    } else {
      const logLine = JSON.stringify(logData);
      switch (level) {
        case 'error':
          console.error(logLine);
          break;
        case 'warn':
          console.warn(logLine);
          break;
        case 'info':
          console.log(logLine);
          break;
        case 'debug':
          console.debug(logLine);
          break;
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.formatMessage('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.formatMessage('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.formatMessage('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: this.isDevelopment ? error.stack : undefined,
      }),
    };

    this.formatMessage('error', message, errorContext);
  }

  apiRequest(method: string, path: string, status: number, durationMs: number, userId?: string): void {
    this.info('API request', {
      method,
      path,
      status,
      durationMs,
      userId,
    });
  }

  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security: ${event}`, {
      type: 'security',
      ...context,
    });
  }
}

export const logger = new Logger();
export default logger;

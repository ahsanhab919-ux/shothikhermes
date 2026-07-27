import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    vi.stubEnv('NODE_ENV', originalEnv || 'test');
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info messages with context', () => {
      logger.info('Test message', { userId: '123' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Error occurred');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log errors with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log errors with context', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { userId: '123' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log warnings with context', () => {
      logger.warn('Warning message', { count: 5 });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('LOG_LEVEL', 'debug');
      logger.debug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should not log debug messages when log level is info', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('LOG_LEVEL', 'info');
      consoleDebugSpy.mockClear();
      logger.debug('Debug message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('production logging', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('should log JSON in production', () => {
      logger.info('Test message', { key: 'value' });
      
      const logCall = consoleLogSpy.mock.calls[0][0] as string;
      expect(() => JSON.parse(logCall)).not.toThrow();
      
      const parsed = JSON.parse(logCall);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('level', 'info');
      expect(parsed).toHaveProperty('message', 'Test message');
      expect(parsed).toHaveProperty('key', 'value');
    });

    it('should include error details in JSON logs', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      logger.error('Error occurred', error);
      
      const logCall = consoleErrorSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(logCall);
      
      expect(parsed).toHaveProperty('errorName', 'Error');
      expect(parsed).toHaveProperty('errorMessage', 'Test error');
    });
  });
});

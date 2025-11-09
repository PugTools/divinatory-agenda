/**
 * Centralized logging utility
 * Prevents sensitive data exposure in production while maintaining dev debugging
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDev = import.meta.env.DEV;

  /**
   * Log errors - only shows full error details in development
   */
  error(message: string, error?: any) {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // In production, only log the message without error details
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log warnings - only in development
   */
  warn(message: string, data?: any) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, data);
    }
  }

  /**
   * Log info - safe for production
   */
  info(message: string) {
    console.log(`[INFO] ${message}`);
  }

  /**
   * Log debug - only in development
   */
  debug(message: string, data?: any) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
}

export const logger = new Logger();

/**
 * Logger.ts
 * 
 * This file implements a logging interface for the NFT TrustScore system.
 * It provides structured logging capabilities with different log levels.
 */

/**
 * Logger interface for system-wide logging
 */
export class Logger {
  /**
   * Logs a debug message
   */
  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }
  
  /**
   * Logs an info message
   */
  info(message: string, context?: Record<string, any>): void {
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.info(`[INFO] ${message}${contextStr}`);
  }
  
  /**
   * Logs a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.warn(`[WARN] ${message}${contextStr}`);
  }
  
  /**
   * Logs an error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const errorStr = error ? ` Error: ${error.message}\n${error.stack}` : '';
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.error(`[ERROR] ${message}${errorStr}${contextStr}`);
  }
}
/**
 * Request Logger Middleware
 * 
 * Logs all incoming API requests for monitoring and debugging purposes.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log all incoming requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Capture request start time
  const startTime = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  
  // Log request body for non-GET requests (if not empty)
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture original end method
  const originalEnd = res.end;
  
  // Override end method to log response details
  res.end = function(chunk?: any, encoding?: string, callback?: () => void): Response {
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Log response details
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};
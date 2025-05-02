/**
 * Request Logger Middleware
 * 
 * Logs all incoming API requests for monitoring and debugging purposes.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Add request ID to response locals for correlation
declare global {
  namespace Express {
    interface Response {
      locals: {
        requestId: string;
        startTime: number;
      };
    }
  }
}

/**
 * Middleware to log all API requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // Store request ID and start time in response locals
  res.locals = {
    ...res.locals,
    requestId,
    startTime
  };
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log request details
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    type: 'request',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
    // Don't log sensitive headers like Authorization
    headers: filterSensitiveHeaders(req.headers)
  }));
  
  // Capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const responseTime = Date.now() - startTime;
    
    // Log response details
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      type: 'response',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('content-length') || 0
    }));
    
    // Add response time header
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Call original end method
    return originalEnd.apply(res, arguments as any);
  };
  
  next();
};

/**
 * Filter out sensitive information from headers
 * 
 * @param headers - Request headers
 * @returns Filtered headers
 */
const filterSensitiveHeaders = (headers: any): any => {
  const filtered = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[REDACTED]';
    }
  });
  
  return filtered;
};
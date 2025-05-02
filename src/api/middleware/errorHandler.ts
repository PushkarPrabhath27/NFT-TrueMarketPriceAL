/**
 * Error Handler Middleware
 * 
 * Provides standardized error handling for the API Gateway, ensuring consistent
 * error responses across all endpoints.
 */

import { Request, Response, NextFunction } from 'express';

// Custom API error class
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static notFound(message = 'Resource not found', details?: Record<string, any>): ApiError {
    return new ApiError(404, 'NOT_FOUND', message, details);
  }

  static badRequest(message = 'Invalid request', details?: Record<string, any>): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized', details?: Record<string, any>): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message, details);
  }

  static forbidden(message = 'Forbidden', details?: Record<string, any>): ApiError {
    return new ApiError(403, 'FORBIDDEN', message, details);
  }

  static internal(message = 'Internal server error', details?: Record<string, any>): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message, details);
  }

  static serviceUnavailable(message = 'Service unavailable', details?: Record<string, any>): ApiError {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message, details);
  }

  static tooManyRequests(message = 'Too many requests', details?: Record<string, any>): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message, details);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  // Handle ApiError instances
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    });
    return;
  }

  // Handle validation errors (express-validator)
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err
      }
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
    return;
  }

  // Default to 500 internal server error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
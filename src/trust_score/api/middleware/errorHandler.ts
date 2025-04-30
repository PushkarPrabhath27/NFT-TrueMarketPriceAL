/**
 * Error Handler Middleware
 * 
 * Provides standardized error handling for the API, ensuring consistent
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
        details: err.details || {}
      }
    });
    return;
  }

  // Handle validation errors (from express-validator)
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { errors: (err as any).errors || [] }
      }
    });
    return;
  }

  // Handle other errors as internal server errors
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: { 
        // Only include error message in non-production environments
        ...(process.env.NODE_ENV !== 'production' ? { message: err.message } : {})
      }
    }
  });
};
/**
 * Validation Middleware
 * 
 * Provides request validation for API endpoints using express-validator.
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from './errorHandler';

/**
 * Middleware to validate request parameters using express-validator
 */
export const validationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format validation errors for consistent response
    const formattedErrors = errors.array().map(error => ({
      field: (error as any).param,
      message: error.msg,
      value: (error as any).value
    }));
    
    // Log validation errors
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'validation_error',
      method: req.method,
      url: req.originalUrl,
      errors: formattedErrors
    }));
    
    // Throw API error with validation details
    next(ApiError.badRequest('Validation failed', { errors: formattedErrors }));
    return;
  }
  
  next();
};

/**
 * Middleware to validate request body exists
 */
export const requireJsonBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    next(ApiError.badRequest('Request body is required'));
    return;
  }
  
  next();
};

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  // Extract pagination parameters with defaults
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  // Validate page number
  if (page < 1) {
    next(ApiError.badRequest('Page must be greater than 0'));
    return;
  }
  
  // Validate limit (between 1 and 100)
  if (limit < 1 || limit > 100) {
    next(ApiError.badRequest('Limit must be between 1 and 100'));
    return;
  }
  
  // Add validated pagination to request
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  req.query.offset = ((page - 1) * limit).toString();
  
  next();
};

/**
 * Middleware to validate and parse date range parameters
 */
export const validateDateRange = (startParam: string = 'start_date', endParam: string = 'end_date') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startDate = req.query[startParam] as string;
    const endDate = req.query[endParam] as string;
    
    // If neither parameter is provided, continue
    if (!startDate && !endDate) {
      return next();
    }
    
    try {
      // Validate start date if provided
      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          throw new Error(`Invalid ${startParam} format`);
        }
        // Store parsed date
        req.query[startParam] = parsedStartDate.toISOString();
      }
      
      // Validate end date if provided
      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          throw new Error(`Invalid ${endParam} format`);
        }
        // Store parsed date
        req.query[endParam] = parsedEndDate.toISOString();
      }
      
      // Validate date range if both parameters are provided
      if (startDate && endDate) {
        const parsedStartDate = new Date(req.query[startParam] as string);
        const parsedEndDate = new Date(req.query[endParam] as string);
        
        if (parsedStartDate > parsedEndDate) {
          throw new Error(`${startParam} must be before ${endParam}`);
        }
      }
      
      next();
    } catch (error) {
      next(ApiError.badRequest((error as Error).message));
    }
  };
};
/**
 * Validation Middleware
 * 
 * Provides request validation for API endpoints using express-validator.
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from './errorHandler';

/**
 * Middleware to validate request parameters using express-validator rules
 * @param validations - Array of express-validator validation chains
 * @returns Express middleware function
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    // Throw API error with validation details
    next(ApiError.badRequest('Validation failed', { errors: formattedErrors }));
  };
};

/**
 * Common validation rules for pagination parameters
 */
export const paginationRules = [
  // Validate page parameter
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
    description: 'Page number for paginated results'
  },
  // Validate limit parameter
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    description: 'Number of results per page (max 100)'
  }
];

/**
 * Common validation rules for field selection
 */
export const fieldSelectionRules = [
  // Validate fields parameter
  {
    name: 'fields',
    in: 'query',
    schema: { type: 'string' },
    description: 'Comma-separated list of fields to include in response'
  }
];

/**
 * Common validation rules for sorting
 */
export const sortingRules = [
  // Validate sort parameter
  {
    name: 'sort',
    in: 'query',
    schema: { type: 'string' },
    description: 'Field to sort results by (prefix with - for descending order)'
  }
];

/**
 * Common validation rules for filtering
 */
export const filteringRules = [
  // Validate filter parameter
  {
    name: 'filter',
    in: 'query',
    schema: { type: 'string' },
    description: 'Filter results by specific criteria (format: field:operator:value)'
  }
];
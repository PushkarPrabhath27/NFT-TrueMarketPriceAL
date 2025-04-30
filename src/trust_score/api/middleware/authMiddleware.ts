/**
 * Authentication Middleware
 * 
 * Provides API key authentication for protected endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

// Interface for authenticated request
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    rateLimit: number;
  };
}

/**
 * Middleware to authenticate requests using API key
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  // Check if authorization header exists and has correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing or invalid API key'));
    return;
  }
  
  // Extract API key
  const apiKey = authHeader.split(' ')[1];
  
  // In a real implementation, validate API key against database
  // For now, use a simple mock implementation
  if (validateApiKey(apiKey)) {
    // Add user information to request
    (req as AuthenticatedRequest).user = {
      id: 'user-123', // Would be derived from API key in real implementation
      role: 'standard', // Role would determine access levels
      rateLimit: 1000 // Custom rate limit for this user
    };
    next();
  } else {
    next(ApiError.unauthorized('Invalid API key'));
  }
};

/**
 * Mock function to validate API key
 * In a real implementation, this would check against a database
 * @param apiKey - API key to validate
 * @returns Whether the API key is valid
 */
const validateApiKey = (apiKey: string): boolean => {
  // Mock implementation - in production, check against secure storage
  const validKeys = ['test-api-key-1', 'test-api-key-2'];
  return validKeys.includes(apiKey);
};

/**
 * Middleware to check if user has required role
 * @param requiredRole - Role required to access endpoint
 * @returns Express middleware function
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    
    // Check if user exists and has required role
    if (!user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    
    if (user.role !== requiredRole) {
      next(ApiError.forbidden(`Requires ${requiredRole} role`));
      return;
    }
    
    next();
  };
};
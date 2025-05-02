/**
 * Authentication Middleware
 * 
 * Provides comprehensive authentication for protected endpoints using multiple methods:
 * - API key authentication for server-to-server communication
 * - JWT token authentication for user sessions
 * - OAuth 2.0 flows for user context
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import { config } from '../config';
import { jwtProvider, apiKeyManager, oauth2Provider, securityMonitoring } from '../security';

// Extended Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        tier: string;
        scopes?: string[];
        provider?: string;
      };
      authMethod?: 'apiKey' | 'jwt' | 'oauth2' | 'session';
    }
  }
}

/**
 * Middleware to authenticate requests using multiple authentication methods
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // No authorization header provided
  if (!authHeader) {
    next(ApiError.unauthorized('Authentication required'));
    return;
  }
  
  try {
    // Determine authentication method
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Try to validate as JWT token first
      try {
        const payload = jwtProvider.verifyToken(token);
        req.user = {
          id: payload.sub,
          role: payload.role,
          tier: payload.tier,
          scopes: payload.scope,
          provider: 'jwt'
        };
        req.authMethod = 'jwt';
        next();
        return;
      } catch (jwtError) {
        // Not a valid JWT, try as API key
        const apiKeyData = apiKeyManager.validateKey(token, ip);
        
        if (apiKeyData) {
          req.user = {
            id: apiKeyData.userId,
            role: 'developer', // Default role for API keys
            tier: apiKeyData.tier,
            scopes: apiKeyData.scopes
          };
          req.authMethod = 'apiKey';
          next();
          return;
        }
        
        // Record authentication failure
        securityMonitoring.recordEvent({
          type: 'authentication_failure',
          timestamp: new Date(),
          ip,
          requestPath: req.path,
          requestMethod: req.method,
          userAgent: req.headers['user-agent'],
          details: { reason: 'Invalid token or API key' }
        });
        
        next(ApiError.unauthorized('Invalid authentication token'));
      }
    } else if (authHeader.startsWith('OAuth ')) {
      // OAuth token authentication
      const token = authHeader.split(' ')[1];
      
      try {
        // Verify OAuth token (simplified for demonstration)
        const payload = oauth2Provider.verifyToken(token);
        req.user = {
          id: payload.sub,
          role: payload.role || 'user',
          tier: payload.tier || 'basic',
          provider: payload.provider
        };
        req.authMethod = 'oauth2';
        next();
      } catch (oauthError) {
        // Record authentication failure
        securityMonitoring.recordEvent({
          type: 'authentication_failure',
          timestamp: new Date(),
          ip,
          requestPath: req.path,
          requestMethod: req.method,
          userAgent: req.headers['user-agent'],
          details: { reason: 'Invalid OAuth token' }
        });
        
        next(ApiError.unauthorized('Invalid OAuth token'));
      }
    } else {
      // Unsupported authentication method
      next(ApiError.unauthorized('Unsupported authentication method'));
    }
  } catch (error) {
    // Generic authentication error
    next(ApiError.unauthorized('Authentication failed'));
  }
};

/**
 * Mock function to validate API key
 * 
 * @param apiKey - API key to validate
 * @returns Whether the API key is valid
 */
const validateApiKey = (apiKey: string): boolean => {
  // In a real implementation, this would validate against a database
  const validKeys = ['test-api-key-1', 'test-api-key-2'];
  return validKeys.includes(apiKey);
};

/**
 * Role-based authorization middleware
 * 
 * @param requiredRole - Role required to access endpoint
 */
export const roleAuthorization = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists on request (set by authMiddleware)
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    
    // Check if user has required role
    if (req.user.role !== requiredRole) {
      next(ApiError.forbidden(`Requires ${requiredRole} role`));
      return;
    }
    
    next();
  };
};

/**
 * Tier-based rate limiting middleware
 * 
 * @param tierLimits - Map of tier names to request limits
 */
export const tierRateLimiting = (tierLimits: Record<string, number>) => {
  // In-memory store for request counts (would use Redis in production)
  const requestCounts: Record<string, { count: number, resetTime: number }> = {};
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    
    const userId = req.user.id;
    const userTier = req.user.tier;
    const limit = tierLimits[userTier] || config.rateLimit.tiers.free;
    const now = Date.now();
    const windowMs = config.rateLimit.windowMs;
    
    // Initialize or reset counter if window has passed
    if (!requestCounts[userId] || requestCounts[userId].resetTime < now) {
      requestCounts[userId] = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Increment request count
    requestCounts[userId].count++;
    
    // Check if limit exceeded
    if (requestCounts[userId].count > limit) {
      next(ApiError.tooManyRequests(`Rate limit exceeded for ${userTier} tier`));
      return;
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', (limit - requestCounts[userId].count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(requestCounts[userId].resetTime / 1000).toString());
    
    next();
  };
};
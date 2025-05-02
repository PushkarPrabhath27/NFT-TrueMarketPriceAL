/**
 * Rate Limiting Middleware
 * 
 * Implements tiered rate limiting for the API based on user subscription level.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { ApiError } from './errorHandler';

// Define user tiers
type UserTier = 'free' | 'basic' | 'premium' | 'enterprise';

/**
 * Get the user's tier from the request
 * In a real implementation, this would check the user's subscription level
 * from a database or authentication service
 */
const getUserTier = (req: Request): UserTier => {
  // For demonstration, extract tier from a custom header or default to 'free'
  const tierHeader = req.header('X-User-Tier');
  
  if (tierHeader && ['free', 'basic', 'premium', 'enterprise'].includes(tierHeader)) {
    return tierHeader as UserTier;
  }
  
  return 'free';
};

/**
 * Create a rate limiter middleware with tier-based limits
 */
export const createRateLimiter = () => {
  // Store rate limit state for different tiers
  const tierLimiters = new Map<UserTier, ReturnType<typeof rateLimit>>();
  
  // Create a rate limiter for each tier
  tierLimiters.set('free', rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.tiers.free,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from free tier, please upgrade your plan or try again later.'
  }));
  
  tierLimiters.set('basic', rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.tiers.basic,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from basic tier, please upgrade your plan or try again later.'
  }));
  
  tierLimiters.set('premium', rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.tiers.premium,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from premium tier, please upgrade your plan or try again later.'
  }));
  
  tierLimiters.set('enterprise', rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.tiers.enterprise,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from enterprise tier, please contact support for a limit increase.'
  }));
  
  // Return middleware that applies the appropriate rate limiter based on user tier
  return (req: Request, res: Response, next: NextFunction) => {
    const tier = getUserTier(req);
    const limiter = tierLimiters.get(tier);
    
    if (limiter) {
      limiter(req, res, next);
    } else {
      // Fallback to free tier if something goes wrong
      tierLimiters.get('free')!(req, res, next);
    }
  };
};

/**
 * Middleware that applies tier-based rate limiting
 */
export const rateLimitMiddleware = createRateLimiter();
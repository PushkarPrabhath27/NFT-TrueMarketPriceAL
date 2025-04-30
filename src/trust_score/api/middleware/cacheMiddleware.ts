/**
 * Cache Middleware
 * 
 * Implements response caching with configurable TTL to improve API performance
 * and reduce load on the trust score calculation system.
 */

import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Create cache instance with default TTL of 5 minutes
const apiCache = new NodeCache({
  stdTTL: 300, // 5 minutes in seconds
  checkperiod: 60, // Check for expired keys every 60 seconds
});

/**
 * Generate a cache key from the request
 * @param req - Express request object
 * @returns Cache key string
 */
const generateCacheKey = (req: Request): string => {
  // Create key from URL path and query parameters
  const baseKey = req.originalUrl || req.url;
  
  // Add authentication info to key if present (to handle user-specific caching)
  const authKey = req.headers.authorization ? 
    `-auth-${Buffer.from(req.headers.authorization).toString('base64')}` : '';
  
  return `${baseKey}${authKey}`;
};

/**
 * Middleware factory that creates a caching middleware with the specified TTL
 * @param ttl - Time to live in seconds
 * @returns Express middleware function
 */
export const cacheMiddleware = (ttl?: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = generateCacheKey(req);

    // Check if response exists in cache
    const cachedResponse = apiCache.get(key);
    if (cachedResponse) {
      // Return cached response
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse);
    }

    // Cache miss - capture the response
    res.setHeader('X-Cache', 'MISS');

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response before sending
    res.json = function(body): Response {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Use provided TTL or default
        apiCache.set(key, body, ttl);
      }
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Utility function to manually invalidate cache entries
 * @param pattern - Regular expression pattern to match cache keys
 * @returns Number of invalidated cache entries
 */
export const invalidateCache = (pattern: RegExp): number => {
  const keys = apiCache.keys();
  let invalidated = 0;
  
  keys.forEach(key => {
    if (pattern.test(key)) {
      apiCache.del(key);
      invalidated++;
    }
  });
  
  return invalidated;
};
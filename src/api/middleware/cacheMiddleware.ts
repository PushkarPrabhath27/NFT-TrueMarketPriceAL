/**
 * Cache Middleware
 * 
 * Implements response caching with configurable TTL to improve API performance.
 */

import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { config } from '../config';

// Create cache instance with standard settings
const apiCache = new NodeCache({
  stdTTL: 300, // Default TTL of 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Don't clone data (for performance)
  maxKeys: config.cache.maxSize
});

/**
 * Generate a cache key from the request
 * 
 * @param req - Express request object
 * @returns Cache key string
 */
const generateCacheKey = (req: Request): string => {
  // Create a unique key based on the request method, URL, and query parameters
  const baseKey = `${req.method}:${req.originalUrl}`;
  
  // For GET requests, the cache key is just the URL
  if (req.method === 'GET') {
    return baseKey;
  }
  
  // For POST requests with a body, include a hash of the body in the key
  if (req.method === 'POST' && req.body) {
    try {
      const bodyKey = JSON.stringify(req.body);
      return `${baseKey}:${bodyKey}`;
    } catch (error) {
      // If body can't be stringified, fall back to base key
      return baseKey;
    }
  }
  
  return baseKey;
};

/**
 * Middleware to cache API responses
 * 
 * @param ttl - Time to live in seconds
 */
export const cacheMiddleware = (ttl?: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching for non-GET requests unless explicitly configured
    if (req.method !== 'GET' && req.method !== 'POST') {
      return next();
    }
    
    // Generate cache key
    const key = generateCacheKey(req);
    
    // Check if we have a cached response
    const cachedResponse = apiCache.get(key);
    if (cachedResponse) {
      // Return cached response
      res.setHeader('X-Cache', 'HIT');
      res.send(cachedResponse);
      return;
    }
    
    // Cache miss, mark as such
    res.setHeader('X-Cache', 'MISS');
    
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to cache the response
    res.send = function(body): Response {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Determine TTL based on resource type or default
        let effectiveTtl = ttl;
        
        if (!effectiveTtl) {
          // Set TTL based on resource type from URL pattern
          const url = req.originalUrl.toLowerCase();
          if (url.includes('/nft/')) {
            effectiveTtl = config.cache.ttl.nftScores;
          } else if (url.includes('/collection/')) {
            effectiveTtl = config.cache.ttl.collectionScores;
          } else if (url.includes('/creator/')) {
            effectiveTtl = config.cache.ttl.creatorScores;
          } else if (url.includes('/risk/')) {
            effectiveTtl = config.cache.ttl.riskProfiles;
          } else if (url.includes('/price/')) {
            effectiveTtl = config.cache.ttl.priceData;
          } else if (url.includes('/blockchain/')) {
            effectiveTtl = config.cache.ttl.blockchainData;
          } else {
            effectiveTtl = 60; // Default to 1 minute
          }
        }
        
        // Cache the response
        apiCache.set(key, body, effectiveTtl);
      }
      
      // Call original send
      return originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Clear all cache entries
 */
export const clearCache = (): void => {
  apiCache.flushAll();
};

/**
 * Clear specific cache entry
 * 
 * @param key - Cache key to clear
 */
export const clearCacheKey = (key: string): void => {
  apiCache.del(key);
};

/**
 * Get all cache keys
 * 
 * @returns Array of cache keys
 */
export const getCacheKeys = (): string[] => {
  return apiCache.keys();
};

/**
 * Get cache statistics
 * 
 * @returns Cache statistics
 */
export const getCacheStats = (): { keys: number, hits: number, misses: number, ksize: number, vsize: number } => {
  return apiCache.getStats();
};
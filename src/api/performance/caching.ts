/**
 * NFT TrustScore API Caching Strategy
 * 
 * This module implements a multi-level caching system for the NFT TrustScore API
 * to improve performance and reduce load on backend services.
 */

import NodeCache from 'node-cache';
let createClient: any;
try {
  createClient = require('redis').createClient;
} catch (e) {
  createClient = undefined;
}
import { config } from '../config';
import { Request, Response, NextFunction } from 'express';

// Types for cache entries
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * Multi-level Cache Manager for NFT TrustScore API
 * 
 * Implements a tiered caching strategy with:
 * - In-memory cache for frequent requests (using NodeCache)
 * - Distributed cache for shared state (using Redis)
 * - Intelligent cache management with TTL-based expiration
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: NodeCache;
  private redisClient: any; // Redis client
  private cdnIntegration: boolean;
  
  private constructor() {
    // Initialize in-memory cache
    this.memoryCache = new NodeCache({
      stdTTL: config.cache.defaultTTL ?? 60,
      checkperiod: config.cache.checkPeriod ?? 120,
      useClones: false
    });
    
    // Initialize Redis client if enabled
    if (config.cache.redis && config.cache.redis.enabled && createClient) {
      this.initRedisClient();
    }
    
    // Check if CDN integration is enabled
    this.cdnIntegration = config.cache.cdn && config.cache.cdn.enabled ? true : false;
  }
  
  /**
   * Get the singleton instance of CacheManager
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  /**
   * Initialize Redis client for distributed caching
   */
  private async initRedisClient(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: config.cache.redis?.url,
        password: config.cache.redis?.password
      });
      
      await this.redisClient.connect();
      
      this.redisClient.on('error', (err: Error) => {
        console.error('Redis client error:', err);
      });
      
      console.log('Redis client connected successfully');
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      // Fallback to memory cache only
    }
  }
  
  /**
   * Get data from cache
   * 
   * @param key Cache key
   * @param options Cache options
   * @returns Cached data or null if not found
   */
  public async get(key: string, options?: { source?: 'memory' | 'redis' | 'all' }): Promise<any> {
    const source = options?.source || 'all';
    
    // Try memory cache first
    if (source === 'memory' || source === 'all') {
      const memoryData = this.memoryCache.get(key);
      if (memoryData) {
        return memoryData;
      }
    }
    
    // Try Redis if memory cache miss and Redis is enabled
    if ((source === 'redis' || source === 'all') && this.redisClient && this.redisClient.isReady) {
      try {
        const redisData = await this.redisClient.get(key);
        if (redisData) {
          // Parse the data
          const parsedData = JSON.parse(redisData);
          
          // Store in memory cache for faster subsequent access
          this.memoryCache.set(key, parsedData.data, Math.floor((parsedData.expiresAt - Date.now()) / 1000));
          
          return parsedData.data;
        }
      } catch (error) {
        console.error('Redis get error:', error);
        // Continue execution, will return null at the end
      }
    }
    
    return null;
  }
  
  /**
   * Set data in cache
   * 
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in seconds
   * @param options Cache options
   */
  public async set(key: string, data: any, ttl?: number, options?: { target?: 'memory' | 'redis' | 'all' }): Promise<void> {
    const target = options?.target || 'all';
    const effectiveTTL = ttl || config.cache.defaultTTL || 60;
    
    // Set in memory cache
    if (target === 'memory' || target === 'all') {
      this.memoryCache.set(key, data, effectiveTTL);
    }
    
    // Set in Redis if enabled
    if ((target === 'redis' || target === 'all') && this.redisClient && this.redisClient.isReady) {
      try {
        const cacheEntry: CacheEntry = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + (effectiveTTL * 1000)
        };
        
        await this.redisClient.set(key, JSON.stringify(cacheEntry), {
          EX: effectiveTTL
        });
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
  }
  
  /**
   * Delete data from cache
   * 
   * @param key Cache key
   * @param options Cache options
   */
  public async delete(key: string, options?: { target?: 'memory' | 'redis' | 'all' }): Promise<void> {
    const target = options?.target || 'all';
    
    // Delete from memory cache
    if (target === 'memory' || target === 'all') {
      this.memoryCache.del(key);
    }
    
    // Delete from Redis if enabled
    if ((target === 'redis' || target === 'all') && this.redisClient && this.redisClient.isReady) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }
  }
  
  /**
   * Clear all cache data
   * 
   * @param options Cache options
   */
  public async clear(options?: { target?: 'memory' | 'redis' | 'all' }): Promise<void> {
    const target = options?.target || 'all';
    
    // Clear memory cache
    if (target === 'memory' || target === 'all') {
      this.memoryCache.flushAll();
    }
    
    // Clear Redis if enabled
    if ((target === 'redis' || target === 'all') && this.redisClient && this.redisClient.isReady) {
      try {
        await this.redisClient.flushDb();
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }
  }
  
  /**
   * Invalidate cache entries based on a pattern
   * 
   * @param pattern Pattern to match cache keys
   */
  public async invalidatePattern(pattern: string): Promise<void> {
    // For memory cache, we need to iterate through all keys
    const memoryKeys = this.memoryCache.keys();
    const keysToDelete = memoryKeys.filter(key => key.includes(pattern));
    keysToDelete.forEach(key => this.memoryCache.del(key));
    
    // For Redis, we can use the SCAN command
    if (this.redisClient && this.redisClient.isReady) {
      try {
        // Use SCAN to find keys matching the pattern
        let cursor = '0';
        do {
          const scanResult = await this.redisClient.scan(cursor, {
            MATCH: `*${pattern}*`,
            COUNT: 100
          });
          
          cursor = scanResult.cursor;
          const keys = scanResult.keys;
          
          if (keys.length > 0) {
            await this.redisClient.del(keys);
          }
        } while (cursor !== '0');
      } catch (error) {
        console.error('Redis pattern invalidation error:', error);
      }
    }
  }
  
  /**
   * Warm up cache with predictable requests
   * 
   * @param keys Array of keys to warm up
   * @param fetchFunction Function to fetch data if not in cache
   */
  public async warmUp(keys: string[], fetchFunction: (key: string) => Promise<any>): Promise<void> {
    for (const key of keys) {
      try {
        // Check if already in cache
        const cachedData = await this.get(key);
        if (!cachedData) {
          // Fetch and cache the data
          const data = await fetchFunction(key);
          if (data) {
            await this.set(key, data);
          }
        }
      } catch (error) {
        console.error(`Cache warm up error for key ${key}:`, error);
      }
    }
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  public getStats(): any {
    const memoryStats = this.memoryCache.getStats();
    let redisStats = null;
    
    // TODO: Implement Redis stats collection
    
    return {
      memory: memoryStats,
      redis: redisStats,
      cdn: this.cdnIntegration ? { enabled: true } : { enabled: false }
    };
  }
}

/**
 * Express middleware for caching API responses
 * 
 * @param ttl Time to live in seconds
 * @param keyGenerator Function to generate cache key from request
 */
export const cacheMiddleware = (ttl?: number, keyGenerator?: (req: Request) => string) => {
  const cacheManager = CacheManager.getInstance();
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator ? 
      keyGenerator(req) : 
      `${req.originalUrl || req.url}`;
    
    try {
      // Try to get from cache
      const cachedData = await cacheManager.get(cacheKey);
      
      if (cachedData) {
        // Set cache header
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }
      
      // Cache miss, set header
      res.setHeader('X-Cache', 'MISS');
      
      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache the response
      res.json = function(body: any): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheManager.set(cacheKey, body, ttl);
        }
        
        // Call original send method
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
/**
 * PerformanceOptimizer.ts
 * 
 * Implements performance optimization strategies to meet the technical
 * requirements for response time and throughput. This component ensures
 * that the trust score engine can handle high-volume concurrent requests
 * and maintain low latency for score retrieval and updates.
 */

import { TrustScoreTypes } from '../types';

/**
 * Configuration options for performance optimization
 */
export interface PerformanceOptimizerConfig {
  // Cache configuration
  cache: {
    // Whether to enable caching
    enabled: boolean;
    // Time-to-live for cached scores in seconds
    ttlSeconds: number;
    // Maximum number of items to cache
    maxItems: number;
    // Whether to use stale cache data during recomputation
    serveStaleOnRecompute: boolean;
  };
  // Query optimization configuration
  queryOptimization: {
    // Whether to enable query optimization
    enabled: boolean;
    // Maximum number of entities to process in a batch
    batchSize: number;
    // Fields to include by default in responses
    defaultFields: string[];
  };
  // Concurrency configuration
  concurrency: {
    // Maximum number of concurrent score calculations
    maxConcurrentCalculations: number;
    // Maximum number of concurrent database operations
    maxConcurrentDbOperations: number;
    // Whether to use worker threads for CPU-intensive operations
    useWorkerThreads: boolean;
  };
  // Response optimization
  responseOptimization: {
    // Whether to enable response compression
    enableCompression: boolean;
    // Minimum size in bytes for compression
    compressionThreshold: number;
    // Whether to enable response streaming for large responses
    enableStreaming: boolean;
  };
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  // Response time metrics
  responseTime: {
    // Average response time in milliseconds
    averageMs: number;
    // 95th percentile response time in milliseconds
    p95Ms: number;
    // 99th percentile response time in milliseconds
    p99Ms: number;
    // Maximum response time in milliseconds
    maxMs: number;
  };
  // Throughput metrics
  throughput: {
    // Requests per second
    requestsPerSecond: number;
    // Total requests processed
    totalRequests: number;
  };
  // Cache metrics
  cache: {
    // Cache hit rate
    hitRate: number;
    // Cache size
    size: number;
    // Average cache access time in milliseconds
    averageAccessTimeMs: number;
  };
  // Error metrics
  errors: {
    // Error rate
    errorRate: number;
    // Total errors
    totalErrors: number;
    // Error breakdown by type
    errorBreakdown: Map<string, number>;
  };
}

/**
 * Performance optimizer for the trust score engine
 */
export class PerformanceOptimizer {
  private config: PerformanceOptimizerConfig;
  private metrics: PerformanceMetrics;
  private scoreCache: Map<string, CachedScore>;
  private responseTimeHistory: number[];
  private lastMetricsReset: number;
  
  /**
   * Cached score with metadata
   */
  private interface CachedScore {
    score: any;
    expiresAt: number;
    lastAccessed: number;
    accessCount: number;
  }
  
  /**
   * Initialize the performance optimizer with configuration
   * 
   * @param config Configuration options for performance optimization
   */
  constructor(config?: Partial<PerformanceOptimizerConfig>) {
    // Default configuration
    this.config = {
      cache: {
        enabled: true,
        ttlSeconds: 300, // 5 minutes
        maxItems: 10000,
        serveStaleOnRecompute: true
      },
      queryOptimization: {
        enabled: true,
        batchSize: 100,
        defaultFields: ['overallScore', 'confidence', 'timestamp', 'factorScores']
      },
      concurrency: {
        maxConcurrentCalculations: 20,
        maxConcurrentDbOperations: 50,
        useWorkerThreads: true
      },
      responseOptimization: {
        enableCompression: true,
        compressionThreshold: 1024, // 1 KB
        enableStreaming: true
      },
      ...config
    };
    
    // Initialize metrics
    this.metrics = {
      responseTime: {
        averageMs: 0,
        p95Ms: 0,
        p99Ms: 0,
        maxMs: 0
      },
      throughput: {
        requestsPerSecond: 0,
        totalRequests: 0
      },
      cache: {
        hitRate: 0,
        size: 0,
        averageAccessTimeMs: 0
      },
      errors: {
        errorRate: 0,
        totalErrors: 0,
        errorBreakdown: new Map<string, number>()
      }
    };
    
    // Initialize cache
    this.scoreCache = new Map<string, CachedScore>();
    this.responseTimeHistory = [];
    this.lastMetricsReset = Date.now();
    
    // Start cache cleanup interval
    if (this.config.cache.enabled) {
      setInterval(() => this.cleanupCache(), 60000); // Run every minute
    }
  }
  
  /**
   * Wrap a function call with performance monitoring and optimization
   * 
   * @param key Cache key for the result
   * @param fn Function to execute
   * @param ttlOverride Optional override for cache TTL
   * @returns Result of the function
   */
  public async optimizeOperation<T>(key: string, fn: () => Promise<T>, ttlOverride?: number): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let error: Error | null = null;
    let cacheHit = false;
    
    try {
      // Check cache if enabled
      if (this.config.cache.enabled) {
        const cachedResult = this.getCachedResult<T>(key);
        if (cachedResult) {
          result = cachedResult;
          cacheHit = true;
          return result;
        }
      }
      
      // Execute function
      result = await fn();
      
      // Cache result if enabled
      if (this.config.cache.enabled) {
        this.cacheResult(key, result, ttlOverride);
      }
      
      return result;
    } catch (e) {
      error = e as Error;
      this.recordError(error);
      throw error;
    } finally {
      // Record metrics
      const duration = Date.now() - startTime;
      this.recordResponseTime(duration);
      this.recordRequest(cacheHit);
      
      // Log performance information
      if (duration > 200) { // Log slow operations
        console.warn(`Slow operation detected: ${key} took ${duration}ms${error ? ' (failed)' : ''}`);
      }
    }
  }
  
  /**
   * Get a cached result
   * 
   * @param key Cache key
   * @returns Cached result or undefined if not found
   */
  private getCachedResult<T>(key: string): T | undefined {
    const cacheAccessStart = Date.now();
    const cached = this.scoreCache.get(key);
    
    if (!cached) {
      return undefined;
    }
    
    const now = Date.now();
    
    // Update access metadata
    cached.lastAccessed = now;
    cached.accessCount++;
    
    // Check if expired
    if (cached.expiresAt < now) {
      return undefined;
    }
    
    // Record cache access time
    this.recordCacheAccess(Date.now() - cacheAccessStart);
    
    return cached.score as T;
  }
  
  /**
   * Cache a result
   * 
   * @param key Cache key
   * @param result Result to cache
   * @param ttlOverride Optional override for cache TTL
   */
  private cacheResult<T>(key: string, result: T, ttlOverride?: number): void {
    // Check if cache is full
    if (this.scoreCache.size >= this.config.cache.maxItems) {
      this.evictCacheItems(1); // Evict at least one item
    }
    
    const ttl = ttlOverride || this.config.cache.ttlSeconds;
    const now = Date.now();
    
    this.scoreCache.set(key, {
      score: result,
      expiresAt: now + (ttl * 1000),
      lastAccessed: now,
      accessCount: 0
    });
    
    // Update cache size metric
    this.metrics.cache.size = this.scoreCache.size;
  }
  
  /**
   * Evict items from the cache
   * 
   * @param count Minimum number of items to evict
   */
  private evictCacheItems(count: number): void {
    // Sort cache entries by last accessed time (oldest first)
    const entries = Array.from(this.scoreCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Evict the oldest items
    const itemsToEvict = Math.max(count, Math.ceil(this.scoreCache.size * 0.1)); // At least 10% of cache
    
    for (let i = 0; i < itemsToEvict && i < entries.length; i++) {
      this.scoreCache.delete(entries[i][0]);
    }
    
    // Update cache size metric
    this.metrics.cache.size = this.scoreCache.size;
  }
  
  /**
   * Clean up expired cache items
   */
  private cleanupCache(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, cached] of this.scoreCache.entries()) {
      if (cached.expiresAt < now) {
        this.scoreCache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired cache items`);
      this.metrics.cache.size = this.scoreCache.size;
    }
  }
  
  /**
   * Record response time for metrics
   * 
   * @param durationMs Response time in milliseconds
   */
  private recordResponseTime(durationMs: number): void {
    // Add to history (limit size to prevent memory issues)
    this.responseTimeHistory.push(durationMs);
    if (this.responseTimeHistory.length > 1000) {
      this.responseTimeHistory.shift();
    }
    
    // Update metrics
    this.metrics.responseTime.maxMs = Math.max(this.metrics.responseTime.maxMs, durationMs);
    
    // Calculate average
    const sum = this.responseTimeHistory.reduce((a, b) => a + b, 0);
    this.metrics.responseTime.averageMs = sum / this.responseTimeHistory.length;
    
    // Calculate percentiles
    const sorted = [...this.responseTimeHistory].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    this.metrics.responseTime.p95Ms = sorted[p95Index] || 0;
    this.metrics.responseTime.p99Ms = sorted[p99Index] || 0;
  }
  
  /**
   * Record a request for throughput metrics
   * 
   * @param cacheHit Whether the request was served from cache
   */
  private recordRequest(cacheHit: boolean): void {
    this.metrics.throughput.totalRequests++;
    
    // Update cache hit rate
    if (cacheHit) {
      const totalCacheRequests = this.metrics.throughput.totalRequests * this.metrics.cache.hitRate;
      this.metrics.cache.hitRate = (totalCacheRequests + 1) / this.metrics.throughput.totalRequests;
    } else {
      const totalCacheRequests = this.metrics.throughput.totalRequests * this.metrics.cache.hitRate;
      this.metrics.cache.hitRate = totalCacheRequests / this.metrics.throughput.totalRequests;
    }
    
    // Calculate requests per second
    const now = Date.now();
    const secondsElapsed = (now - this.lastMetricsReset) / 1000;
    
    if (secondsElapsed > 0) {
      this.metrics.throughput.requestsPerSecond = this.metrics.throughput.totalRequests / secondsElapsed;
    }
  }
  
  /**
   * Record cache access time
   * 
   * @param durationMs Access time in milliseconds
   */
  private recordCacheAccess(durationMs: number): void {
    // Simple moving average
    this.metrics.cache.averageAccessTimeMs = 
      0.9 * this.metrics.cache.averageAccessTimeMs + 0.1 * durationMs;
  }
  
  /**
   * Record an error
   * 
   * @param error The error that occurred
   */
  private recordError(error: Error): void {
    this.metrics.errors.totalErrors++;
    
    // Update error rate
    this.metrics.errors.errorRate = 
      this.metrics.errors.totalErrors / this.metrics.throughput.totalRequests;
    
    // Update error breakdown
    const errorType = error.name || 'Unknown';
    const count = this.metrics.errors.errorBreakdown.get(errorType) || 0;
    this.metrics.errors.errorBreakdown.set(errorType, count + 1);
  }
  
  /**
   * Get current performance metrics
   * 
   * @returns Current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      responseTime: {
        averageMs: 0,
        p95Ms: 0,
        p99Ms: 0,
        maxMs: 0
      },
      throughput: {
        requestsPerSecond: 0,
        totalRequests: 0
      },
      cache: {
        hitRate: 0,
        size: this.scoreCache.size,
        averageAccessTimeMs: 0
      },
      errors: {
        errorRate: 0,
        totalErrors: 0,
        errorBreakdown: new Map<string, number>()
      }
    };
    
    this.responseTimeHistory = [];
    this.lastMetricsReset = Date.now();
  }
  
  /**
   * Optimize a query by selecting only necessary fields
   * 
   * @param query The original query
   * @param requestedFields Fields requested by the client
   * @returns Optimized query
   */
  public optimizeQuery(query: any, requestedFields?: string[]): any {
    if (!this.config.queryOptimization.enabled) {
      return query;
    }
    
    // Use requested fields or default fields
    const fields = requestedFields || this.config.queryOptimization.defaultFields;
    
    // Create a projection object for database queries
    const projection: Record<string, number> = {};
    for (const field of fields) {
      projection[field] = 1;
    }
    
    return {
      ...query,
      projection
    };
  }
  
  /**
   * Check if the system is under high load
   * 
   * @returns Whether the system is under high load
   */
  public isUnderHighLoad(): boolean {
    // Check if response times are degrading
    const highResponseTime = this.metrics.responseTime.p95Ms > 150; // 150ms threshold for p95
    
    // Check if error rate is high
    const highErrorRate = this.metrics.errors.errorRate > 0.05; // 5% threshold
    
    // Check if throughput is high
    const highThroughput = this.metrics.throughput.requestsPerSecond > 100; // 100 RPS threshold
    
    return highResponseTime || highErrorRate || highThroughput;
  }
  
  /**
   * Apply graceful degradation under high load
   * 
   * @param options Degradation options
   * @returns Modified options for degraded operation
   */
  public applyGracefulDegradation(options: any): any {
    if (!this.isUnderHighLoad()) {
      return options;
    }
    
    console.warn('System under high load, applying graceful degradation');
    
    // Reduce data complexity
    return {
      ...options,
      includeDetailedExplanations: false,
      includeHistoricalData: false,
      maxFactorDetails: 3, // Limit factor details
      skipNonEssentialCalculations: true
    };
  }
}
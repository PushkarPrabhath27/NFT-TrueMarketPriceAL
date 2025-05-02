/**
 * NFT TrustScore API Request Throttler
 * 
 * This module implements request throttling to manage API request rates
 * and prevent system overload.
 */

import { EventEmitter } from 'events';
import { config } from '../config';

// Throttling strategy types
export enum ThrottlingStrategy {
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket',
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window'
}

// Throttling configuration
export interface ThrottlingConfig {
  strategy: ThrottlingStrategy;
  maxRequestsPerSecond: number;
  burstCapacity: number;
  windowSizeMs: number;
}

// Request context for throttling decisions
export interface RequestContext {
  clientId: string;
  endpoint: string;
  priority: number;
}

// Throttling metrics
export interface ThrottlingMetrics {
  totalRequests: number;
  throttledRequests: number;
  currentRate: number;
  burstCapacityRemaining: number;
  windowStartTime: Date;
}

/**
 * Request Throttler for managing API request rates
 */
export class RequestThrottler extends EventEmitter {
  private static instance: RequestThrottler;
  private config: ThrottlingConfig;
  private metrics: Map<string, ThrottlingMetrics>;
  private tokenBuckets: Map<string, number>;
  private lastRefillTime: Map<string, number>;
  
  private constructor() {
    super();
    this.config = {
      strategy: config.throttling.strategy || ThrottlingStrategy.TOKEN_BUCKET,
      maxRequestsPerSecond: config.throttling.maxRequestsPerSecond || 100,
      burstCapacity: config.throttling.burstCapacity || 50,
      windowSizeMs: config.throttling.windowSizeMs || 1000
    };
    
    this.metrics = new Map();
    this.tokenBuckets = new Map();
    this.lastRefillTime = new Map();
    
    // Start token refill interval for token bucket strategy
    if (this.config.strategy === ThrottlingStrategy.TOKEN_BUCKET) {
      this.startTokenRefill();
    }
  }
  
  /**
   * Get the singleton instance of RequestThrottler
   */
  public static getInstance(): RequestThrottler {
    if (!RequestThrottler.instance) {
      RequestThrottler.instance = new RequestThrottler();
    }
    return RequestThrottler.instance;
  }
  
  /**
   * Check if a request should be throttled
   */
  public shouldThrottle(context: RequestContext): boolean {
    const key = this.getThrottlingKey(context);
    
    // Initialize metrics if not exists
    if (!this.metrics.has(key)) {
      this.initializeMetrics(key);
    }
    
    const metrics = this.metrics.get(key)!;
    metrics.totalRequests++;
    
    let shouldThrottle = false;
    
    switch (this.config.strategy) {
      case ThrottlingStrategy.TOKEN_BUCKET:
        shouldThrottle = this.checkTokenBucket(key, context);
        break;
      
      case ThrottlingStrategy.LEAKY_BUCKET:
        shouldThrottle = this.checkLeakyBucket(key, context);
        break;
      
      case ThrottlingStrategy.FIXED_WINDOW:
        shouldThrottle = this.checkFixedWindow(key, context);
        break;
      
      case ThrottlingStrategy.SLIDING_WINDOW:
        shouldThrottle = this.checkSlidingWindow(key, context);
        break;
    }
    
    if (shouldThrottle) {
      metrics.throttledRequests++;
      this.emit('request:throttled', { context, metrics });
    }
    
    this.updateMetrics(key, metrics);
    return shouldThrottle;
  }
  
  /**
   * Get throttling key for a request context
   */
  private getThrottlingKey(context: RequestContext): string {
    return `${context.clientId}:${context.endpoint}`;
  }
  
  /**
   * Initialize metrics for a new throttling key
   */
  private initializeMetrics(key: string): void {
    this.metrics.set(key, {
      totalRequests: 0,
      throttledRequests: 0,
      currentRate: 0,
      burstCapacityRemaining: this.config.burstCapacity,
      windowStartTime: new Date()
    });
    
    this.tokenBuckets.set(key, this.config.burstCapacity);
    this.lastRefillTime.set(key, Date.now());
  }
  
  /**
   * Update metrics for a throttling key
   */
  private updateMetrics(key: string, metrics: ThrottlingMetrics): void {
    const now = Date.now();
    const windowDuration = now - metrics.windowStartTime.getTime();
    
    metrics.currentRate = metrics.totalRequests / (windowDuration / 1000);
    this.metrics.set(key, metrics);
    
    this.emit('metrics:updated', { key, metrics });
  }
  
  /**
   * Start token refill interval for token bucket strategy
   */
  private startTokenRefill(): void {
    setInterval(() => {
      const now = Date.now();
      
      for (const [key, lastRefill] of this.lastRefillTime.entries()) {
        const timePassed = now - lastRefill;
        const tokensToAdd = Math.floor(timePassed / 1000 * this.config.maxRequestsPerSecond);
        
        if (tokensToAdd > 0) {
          const currentTokens = this.tokenBuckets.get(key) || 0;
          const newTokens = Math.min(
            currentTokens + tokensToAdd,
            this.config.burstCapacity
          );
          
          this.tokenBuckets.set(key, newTokens);
          this.lastRefillTime.set(key, now);
          
          const metrics = this.metrics.get(key);
          if (metrics) {
            metrics.burstCapacityRemaining = newTokens;
            this.updateMetrics(key, metrics);
          }
        }
      }
    }, 100); // Refill check interval
  }
  
  /**
   * Check token bucket throttling strategy
   */
  private checkTokenBucket(key: string, context: RequestContext): boolean {
    const tokens = this.tokenBuckets.get(key) || 0;
    
    if (tokens < 1) {
      return true;
    }
    
    this.tokenBuckets.set(key, tokens - 1);
    const metrics = this.metrics.get(key)!;
    metrics.burstCapacityRemaining = tokens - 1;
    
    return false;
  }
  
  /**
   * Check leaky bucket throttling strategy
   */
  private checkLeakyBucket(key: string, context: RequestContext): boolean {
    const metrics = this.metrics.get(key)!;
    const now = Date.now();
    const timePassed = now - metrics.windowStartTime.getTime();
    
    // Calculate leaked requests
    const leakedRequests = Math.floor(timePassed / 1000 * this.config.maxRequestsPerSecond);
    const remainingRequests = Math.max(0, metrics.totalRequests - leakedRequests);
    
    if (remainingRequests >= this.config.burstCapacity) {
      return true;
    }
    
    if (timePassed >= this.config.windowSizeMs) {
      metrics.windowStartTime = new Date();
      metrics.totalRequests = 1;
    }
    
    return false;
  }
  
  /**
   * Check fixed window throttling strategy
   */
  private checkFixedWindow(key: string, context: RequestContext): boolean {
    const metrics = this.metrics.get(key)!;
    const now = Date.now();
    
    if (now - metrics.windowStartTime.getTime() >= this.config.windowSizeMs) {
      // Reset window
      metrics.windowStartTime = new Date();
      metrics.totalRequests = 1;
      return false;
    }
    
    return metrics.totalRequests > this.config.maxRequestsPerSecond;
  }
  
  /**
   * Check sliding window throttling strategy
   */
  private checkSlidingWindow(key: string, context: RequestContext): boolean {
    const metrics = this.metrics.get(key)!;
    const now = Date.now();
    const windowStart = now - this.config.windowSizeMs;
    
    // Simple sliding window implementation
    // In production, maintain a queue of request timestamps
    const requestRate = metrics.totalRequests / (this.config.windowSizeMs / 1000);
    
    return requestRate > this.config.maxRequestsPerSecond;
  }
  
  /**
   * Get current metrics for a client/endpoint
   */
  public getMetrics(clientId: string, endpoint: string): ThrottlingMetrics | null {
    const key = this.getThrottlingKey({ clientId, endpoint, priority: 0 });
    return this.metrics.get(key) || null;
  }
  
  /**
   * Update throttling configuration
   */
  public updateConfig(config: Partial<ThrottlingConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    this.emit('config:updated', { config: this.config });
  }
}

// Export singleton instance
export const requestThrottler = RequestThrottler.getInstance();
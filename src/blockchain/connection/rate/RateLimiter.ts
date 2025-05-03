/**
 * RateLimiter.ts
 * Implements rate limiting for blockchain API requests to prevent throttling
 */

import { RATE_LIMITING_CONFIG } from '../config/BlockchainNetworkConfig';

/**
 * Request priority levels
 */
export enum RequestPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2
}

/**
 * Request item in the queue
 */
interface QueuedRequest {
  id: string;
  networkId: string;
  providerUrl: string;
  priority: RequestPriority;
  timestamp: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

/**
 * Rate limiter for blockchain API requests
 * 
 * Implements a token bucket algorithm with priority queue to ensure
 * requests don't exceed provider rate limits while prioritizing
 * important requests.
 */
export class RateLimiter {
  private requestQueues: Map<string, QueuedRequest[]>;
  private processingQueues: Map<string, boolean>;
  private tokenBuckets: Map<string, {
    tokens: number;
    lastRefill: number;
    maxTokens: number;
    refillRate: number; // tokens per millisecond
  }>;
  private config: typeof RATE_LIMITING_CONFIG;
  
  /**
   * Creates a new RateLimiter
   * @param customConfig Optional custom configuration to override defaults
   */
  constructor(customConfig?: Partial<typeof RATE_LIMITING_CONFIG>) {
    this.requestQueues = new Map();
    this.processingQueues = new Map();
    this.tokenBuckets = new Map();
    this.config = { ...RATE_LIMITING_CONFIG, ...customConfig };
  }
  
  /**
   * Registers a provider with the rate limiter
   * @param networkId The network identifier
   * @param providerUrl The provider URL
   * @param maxRequestsPerMinute Maximum requests per minute for this provider
   */
  public registerProvider(networkId: string, providerUrl: string, maxRequestsPerMinute: number): void {
    const providerKey = `${networkId}:${providerUrl}`;
    
    // Initialize queue if it doesn't exist
    if (!this.requestQueues.has(providerKey)) {
      this.requestQueues.set(providerKey, []);
      this.processingQueues.set(providerKey, false);
    }
    
    // Initialize token bucket
    // Convert requests per minute to tokens per millisecond
    const refillRate = maxRequestsPerMinute / 60000;
    
    this.tokenBuckets.set(providerKey, {
      tokens: this.config.burstSize, // Start with full burst capacity
      lastRefill: Date.now(),
      maxTokens: this.config.burstSize,
      refillRate
    });
  }
  
  /**
   * Schedules a request to be executed according to rate limits
   * @param networkId The network identifier
   * @param providerUrl The provider URL
   * @param execute Function that executes the actual request
   * @param priority Request priority
   * @returns Promise that resolves with the request result
   */
  public async scheduleRequest<T>(
    networkId: string,
    providerUrl: string,
    execute: () => Promise<T>,
    priority: RequestPriority = RequestPriority.MEDIUM
  ): Promise<T> {
    const providerKey = `${networkId}:${providerUrl}`;
    
    // Ensure provider is registered
    if (!this.tokenBuckets.has(providerKey)) {
      throw new Error(`Provider ${providerUrl} for network ${networkId} is not registered with the rate limiter`);
    }
    
    // Create a promise that will be resolved when the request is executed
    return new Promise<T>((resolve, reject) => {
      // Create request object
      const request: QueuedRequest = {
        id: Math.random().toString(36).substring(2, 15),
        networkId,
        providerUrl,
        priority,
        timestamp: Date.now(),
        execute: execute as () => Promise<any>,
        resolve,
        reject
      };
      
      // Add to queue
      const queue = this.requestQueues.get(providerKey)!;
      
      // Check if queue is at capacity
      if (queue.length >= this.config.queueSize) {
        // If queue is full, reject low priority requests or oldest request
        if (priority === RequestPriority.LOW) {
          reject(new Error('Request queue is full and request priority is low'));
          return;
        }
        
        // Find a lower priority request to replace, or the oldest request
        const lowPriorityIndex = queue.findIndex(r => r.priority > priority);
        if (lowPriorityIndex >= 0) {
          // Replace lower priority request
          const removed = queue[lowPriorityIndex];
          removed.reject(new Error('Request was replaced by a higher priority request'));
          queue[lowPriorityIndex] = request;
        } else {
          // Replace oldest request
          const oldest = queue.reduce((prev, curr, idx) => 
            curr.timestamp < prev.item.timestamp ? { item: curr, index: idx } : prev, 
            { item: queue[0], index: 0 }
          );
          
          oldest.item.reject(new Error('Request was replaced by a newer request due to queue capacity'));
          queue[oldest.index] = request;
        }
      } else {
        // Add to queue
        queue.push(request);
      }
      
      // Sort queue by priority and then by timestamp
      queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower priority value = higher priority
        }
        return a.timestamp - b.timestamp; // Older requests first
      });
      
      // Start processing queue if not already processing
      if (!this.processingQueues.get(providerKey)) {
        this.processQueue(providerKey);
      }
    });
  }
  
  /**
   * Processes the request queue for a provider
   * @param providerKey The provider key
   */
  private async processQueue(providerKey: string): Promise<void> {
    // Mark as processing
    this.processingQueues.set(providerKey, true);
    
    const queue = this.requestQueues.get(providerKey)!;
    const bucket = this.tokenBuckets.get(providerKey)!;
    
    // Process queue until empty
    while (queue.length > 0) {
      // Refill tokens based on time elapsed
      this.refillTokenBucket(providerKey);
      
      // If we have tokens available, process the next request
      if (bucket.tokens >= 1) {
        const request = queue.shift()!;
        
        // Consume a token
        bucket.tokens -= 1;
        
        // Execute the request
        try {
          const result = await request.execute();
          request.resolve(result);
        } catch (error) {
          // Handle request failure
          request.reject(error);
          
          // Implement retry logic if needed
          // This could be done by re-adding the request to the queue with a delay
        }
        
        // Small delay to prevent CPU spinning
        await new Promise(resolve => setTimeout(resolve, 1));
      } else {
        // No tokens available, wait until next token is available
        const timeUntilNextToken = this.getTimeUntilNextToken(providerKey);
        await new Promise(resolve => setTimeout(resolve, timeUntilNextToken));
      }
    }
    
    // Mark as not processing
    this.processingQueues.set(providerKey, false);
  }
  
  /**
   * Refills the token bucket based on time elapsed
   * @param providerKey The provider key
   */
  private refillTokenBucket(providerKey: string): void {
    const bucket = this.tokenBuckets.get(providerKey)!;
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    
    // Calculate tokens to add based on time elapsed and refill rate
    const tokensToAdd = elapsed * bucket.refillRate;
    
    if (tokensToAdd > 0) {
      // Add tokens up to max capacity
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, bucket.maxTokens);
      bucket.lastRefill = now;
    }
  }
  
  /**
   * Calculates time until next token is available
   * @param providerKey The provider key
   * @returns Time in milliseconds until next token
   */
  private getTimeUntilNextToken(providerKey: string): number {
    const bucket = this.tokenBuckets.get(providerKey)!;
    
    // If we have tokens, no need to wait
    if (bucket.tokens >= 1) {
      return 0;
    }
    
    // Calculate how much time until we have 1 token
    const tokensNeeded = 1 - bucket.tokens;
    const timeNeeded = tokensNeeded / bucket.refillRate;
    
    // Add a small buffer to ensure we have the token when we wake up
    return Math.ceil(timeNeeded) + 10;
  }
  
  /**
   * Gets the current queue length for a provider
   * @param networkId The network identifier
   * @param providerUrl The provider URL
   * @returns The number of requests in the queue
   */
  public getQueueLength(networkId: string, providerUrl: string): number {
    const providerKey = `${networkId}:${providerUrl}`;
    return this.requestQueues.has(providerKey) ? this.requestQueues.get(providerKey)!.length : 0;
  }
  
  /**
   * Gets the current token count for a provider
   * @param networkId The network identifier
   * @param providerUrl The provider URL
   * @returns The number of tokens available
   */
  public getAvailableTokens(networkId: string, providerUrl: string): number {
    const providerKey = `${networkId}:${providerUrl}`;
    
    if (!this.tokenBuckets.has(providerKey)) {
      return 0;
    }
    
    // Refill tokens before returning count
    this.refillTokenBucket(providerKey);
    return this.tokenBuckets.get(providerKey)!.tokens;
  }
  
  /**
   * Clears the queue for a provider
   * @param networkId The network identifier
   * @param providerUrl The provider URL
   * @param rejectReason Optional reason for rejecting pending requests
   */
  public clearQueue(networkId: string, providerUrl: string, rejectReason?: string): void {
    const providerKey = `${networkId}:${providerUrl}`;
    
    if (this.requestQueues.has(providerKey)) {
      const queue = this.requestQueues.get(providerKey)!;
      
      // Reject all pending requests
      for (const request of queue) {
        request.reject(new Error(rejectReason || 'Queue was cleared'));
      }
      
      // Clear the queue
      queue.length = 0;
    }
  }
}
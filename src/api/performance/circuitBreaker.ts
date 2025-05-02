/**
 * NFT TrustScore API Circuit Breaker
 * 
 * This module implements circuit breaker patterns to prevent system overload
 * and handle failure scenarios gracefully.
 */

import { EventEmitter } from 'events';
import { config } from '../config';

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'closed',      // Normal operation, requests flow through
  OPEN = 'open',          // Failure detected, requests are blocked
  HALF_OPEN = 'half_open' // Testing if system has recovered
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  resetTimeoutMs: number;        // Time to wait before attempting reset
  halfOpenMaxRequests: number;   // Max requests to test during half-open state
  monitorIntervalMs: number;     // Interval for monitoring metrics
  timeoutMs: number;             // Request timeout threshold
}

// Circuit metrics
export interface CircuitMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutRequests: number;
  rejectedRequests: number;
  lastFailureTime?: Date;
  avgResponseTime: number;
  errorRate: number;
}

/**
 * Circuit Breaker implementation for protecting system resources
 * and handling failure scenarios
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private metrics: CircuitMetrics;
  private config: CircuitBreakerConfig;
  private resetTimeout?: NodeJS.Timeout;
  private monitorInterval?: NodeJS.Timeout;
  private halfOpenRequests: number = 0;
  
  /**
   * Initialize the circuit breaker
   * 
   * @param config Circuit breaker configuration
   */
  constructor(config?: Partial<CircuitBreakerConfig>) {
    super();
    
    // Initialize configuration
    this.config = {
      failureThreshold: config?.failureThreshold || 5,
      resetTimeoutMs: config?.resetTimeoutMs || 30000,
      halfOpenMaxRequests: config?.halfOpenMaxRequests || 3,
      monitorIntervalMs: config?.monitorIntervalMs || 1000,
      timeoutMs: config?.timeoutMs || 5000
    };
    
    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeoutRequests: 0,
      rejectedRequests: 0,
      avgResponseTime: 0,
      errorRate: 0
    };
    
    // Start monitoring
    this.startMonitoring();
  }
  
  /**
   * Execute a request through the circuit breaker
   * 
   * @param requestFn The request function to execute
   * @returns Promise with the request result
   */
  public async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      this.metrics.rejectedRequests++;
      this.emit('request:rejected', { state: this.state });
      throw new Error('Circuit breaker is open');
    }
    
    // Check if we've reached half-open request limit
    if (this.state === CircuitState.HALF_OPEN && 
        this.halfOpenRequests >= this.config.halfOpenMaxRequests) {
      this.metrics.rejectedRequests++;
      this.emit('request:rejected', { state: this.state });
      throw new Error('Circuit breaker is half-open and at request limit');
    }
    
    // Track request metrics
    this.metrics.totalRequests++;
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests++;
    }
    
    const startTime = Date.now();
    
    try {
      // Execute request with timeout
      const result = await Promise.race([
        requestFn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeoutMs);
        })
      ]);
      
      // Update success metrics
      this.handleSuccess(startTime);
      
      return result;
    } catch (error) {
      // Update failure metrics
      this.handleFailure(error, startTime);
      throw error;
    }
  }
  
  /**
   * Handle successful request
   */
  private handleSuccess(startTime: number): void {
    this.metrics.successfulRequests++;
    this.updateResponseTime(startTime);
    
    // If in half-open state and successful, close the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      this.closeCircuit();
    }
  }
  
  /**
   * Handle failed request
   */
  private handleFailure(error: any, startTime: number): void {
    if (error.message === 'Request timeout') {
      this.metrics.timeoutRequests++;
    }
    
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = new Date();
    this.updateResponseTime(startTime);
    
    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.openCircuit();
    }
  }
  
  /**
   * Update average response time
   */
  private updateResponseTime(startTime: number): void {
    const responseTime = Date.now() - startTime;
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (totalRequests - 1) + responseTime) / totalRequests
    );
  }
  
  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    // Calculate error rate
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.errorRate = totalRequests > 0 ? 
      this.metrics.failedRequests / totalRequests : 0;
    
    return this.metrics.failedRequests >= this.config.failureThreshold;
  }
  
  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.emit('state:open', { metrics: this.metrics });
    
    // Set timeout to try half-open state
    this.resetTimeout = setTimeout(
      () => this.halfOpenCircuit(),
      this.config.resetTimeoutMs
    );
  }
  
  /**
   * Set circuit to half-open state
   */
  private halfOpenCircuit(): void {
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenRequests = 0;
    this.emit('state:half_open');
  }
  
  /**
   * Close the circuit
   */
  private closeCircuit(): void {
    this.state = CircuitState.CLOSED;
    this.resetMetrics();
    this.emit('state:closed');
  }
  
  /**
   * Reset circuit metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeoutRequests: 0,
      rejectedRequests: 0,
      avgResponseTime: 0,
      errorRate: 0
    };
  }
  
  /**
   * Start monitoring metrics
   */
  private startMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.emit('metrics:updated', { 
        state: this.state,
        metrics: this.metrics 
      });
    }, this.config.monitorIntervalMs);
  }
  
  /**
   * Get current circuit state
   */
  public getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): CircuitMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Force circuit to closed state (for testing)
   */
  public forceClose(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    this.closeCircuit();
  }
  
  /**
   * Force circuit to open state (for testing)
   */
  public forceOpen(): void {
    this.openCircuit();
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }
}
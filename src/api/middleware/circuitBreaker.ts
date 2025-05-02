/**
 * Circuit Breaker Middleware
 * 
 * Implements the circuit breaker pattern to handle failing services and provide
 * graceful degradation for the API Gateway.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import { config } from '../config';

// Circuit state enum
enum CircuitState {
  CLOSED = 'closed',  // Normal operation, requests pass through
  OPEN = 'open',      // Circuit is open, requests fail fast
  HALF_OPEN = 'half-open' // Testing if service is back online
}

// Circuit breaker configuration interface
interface CircuitBreakerOptions {
  failureThreshold: number;  // Number of failures before opening circuit
  resetTimeout: number;      // Time in ms before attempting to close circuit
  monitorInterval?: number;  // Interval to check circuit state
  timeoutDuration?: number;  // Request timeout duration
}

/**
 * Circuit breaker class to manage service health
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly serviceName: string;
  
  /**
   * Create a new circuit breaker
   * 
   * @param serviceName - Name of the service being protected
   * @param options - Circuit breaker configuration
   */
  constructor(serviceName: string, options: CircuitBreakerOptions) {
    this.serviceName = serviceName;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 30000,
      monitorInterval: options.monitorInterval || 5000,
      timeoutDuration: options.timeoutDuration || 10000
    };
    
    // Start monitoring circuit state
    this.startMonitoring();
  }
  
  /**
   * Execute a function with circuit breaker protection
   * 
   * @param request - Function to execute
   * @returns Promise with the result of the function
   */
  public async execute<T>(request: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`Circuit for ${this.serviceName} is now half-open`);
      } else {
        throw new Error(`Circuit for ${this.serviceName} is open`);
      }
    }
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request to ${this.serviceName} timed out`));
        }, this.options.timeoutDuration);
      });
      
      // Race the request against the timeout
      const result = await Promise.race([request(), timeoutPromise]);
      
      // If we're in half-open state and request succeeded, close the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= 2) { // Require 2 consecutive successes
          this.closeCircuit();
        }
      }
      
      return result as T;
    } catch (error) {
      this.handleFailure(error as Error);
      throw error;
    }
  }
  
  /**
   * Handle a service failure
   * 
   * @param error - Error that occurred
   */
  private handleFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    console.error(`Service ${this.serviceName} failure: ${error.message}`);
    
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      this.openCircuit();
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.openCircuit();
    }
  }
  
  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.successCount = 0;
    console.log(`Circuit for ${this.serviceName} is now open`);
  }
  
  /**
   * Close the circuit
   */
  private closeCircuit(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.log(`Circuit for ${this.serviceName} is now closed`);
  }
  
  /**
   * Start monitoring the circuit state
   */
  private startMonitoring(): void {
    setInterval(() => {
      if (this.state === CircuitState.OPEN) {
        console.log(`Circuit for ${this.serviceName} remains open. Last failure: ${new Date(this.lastFailureTime).toISOString()}`);
      }
    }, this.options.monitorInterval);
  }
  
  /**
   * Get the current circuit state
   * 
   * @returns Current circuit state
   */
  public getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Get circuit statistics
   * 
   * @returns Circuit statistics
   */
  public getStats(): { state: CircuitState, failures: number, lastFailure: Date | null } {
    return {
      state: this.state,
      failures: this.failureCount,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime) : null
    };
  }
}

// Map of service circuits
const circuits: Map<string, CircuitBreaker> = new Map();

/**
 * Get or create a circuit breaker for a service
 * 
 * @param serviceName - Name of the service
 * @returns Circuit breaker instance
 */
export const getCircuitBreaker = (serviceName: string): CircuitBreaker => {
  if (!circuits.has(serviceName)) {
    circuits.set(
      serviceName,
      new CircuitBreaker(serviceName, {
        failureThreshold: config.circuitBreaker.failureThreshold,
        resetTimeout: config.circuitBreaker.resetTimeout
      })
    );
  }
  
  return circuits.get(serviceName)!;
};

/**
 * Middleware to apply circuit breaker to a service
 * 
 * @param serviceName - Name of the service being protected
 */
export const circuitBreakerMiddleware = (serviceName: string) => {
  const circuitBreaker = getCircuitBreaker(serviceName);
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if circuit is open
      if (circuitBreaker.getState() === CircuitState.OPEN) {
        next(ApiError.serviceUnavailable(`Service ${serviceName} is currently unavailable`));
        return;
      }
      
      // Add circuit breaker to request for use in route handlers
      (req as any).circuitBreaker = circuitBreaker;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Execute a function with circuit breaker protection
 * 
 * @param serviceName - Name of the service being protected
 * @param fn - Function to execute
 * @returns Promise with the result of the function
 */
export const withCircuitBreaker = async <T>(
  serviceName: string,
  fn: () => Promise<T>
): Promise<T> => {
  const circuitBreaker = getCircuitBreaker(serviceName);
  return circuitBreaker.execute(fn);
};

/**
 * Get the status of all circuit breakers
 * 
 * @returns Status of all circuit breakers
 */
export const getCircuitStatus = (): Record<string, { state: string, failures: number, lastFailure: Date | null }> => {
  const status: Record<string, { state: string, failures: number, lastFailure: Date | null }> = {};
  
  circuits.forEach((circuit, name) => {
    status[name] = circuit.getStats();
  });
  
  return status;
};
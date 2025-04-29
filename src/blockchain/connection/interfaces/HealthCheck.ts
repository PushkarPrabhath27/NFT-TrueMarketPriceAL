/**
 * HealthCheck.ts
 * Interface for health checking functionality
 */

import { BlockchainProvider, ConnectionStatus } from './BlockchainProvider';

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  /** Whether the provider is healthy */
  isHealthy: boolean;
  
  /** Current status of the connection */
  status: ConnectionStatus;
  
  /** Response time in milliseconds */
  responseTimeMs: number;
  
  /** Error message if the health check failed */
  errorMessage?: string;
  
  /** Timestamp when the health check was performed */
  timestamp: Date;
  
  /** Additional provider-specific metrics */
  metrics?: {
    /** Error rate (0-1) over the last monitoring period */
    errorRate?: number;
    
    /** Average response time over the last monitoring period */
    avgResponseTimeMs?: number;
    
    /** Number of successful requests in the last monitoring period */
    successfulRequests?: number;
    
    /** Number of failed requests in the last monitoring period */
    failedRequests?: number;
    
    /** Rate limit information */
    rateLimit?: {
      /** Whether the provider is currently rate limited */
      isLimited: boolean;
      
      /** When the rate limit will reset */
      resetTime?: Date;
      
      /** Remaining requests before being rate limited */
      remainingRequests?: number;
    };
  };
}

/**
 * Interface for health checking functionality
 */
export interface HealthCheck<T extends BlockchainProvider> {
  /**
   * Perform a health check on a provider
   * @param provider The provider to check
   */
  checkHealth(provider: T): Promise<HealthCheckResult>;
  
  /**
   * Start periodic health checks
   * @param providers The providers to monitor
   * @param intervalMs The interval between health checks in milliseconds
   */
  startMonitoring(providers: T[], intervalMs: number): Promise<void>;
  
  /**
   * Stop periodic health checks
   */
  stopMonitoring(): Promise<void>;
  
  /**
   * Get the latest health check result for a provider
   * @param providerUrl The URL of the provider
   */
  getLatestHealthCheck(providerUrl: string): Promise<HealthCheckResult | null>;
  
  /**
   * Get health check history for a provider
   * @param providerUrl The URL of the provider
   * @param limit Maximum number of results to return
   */
  getHealthCheckHistory(providerUrl: string, limit?: number): Promise<HealthCheckResult[]>;
  
  /**
   * Register a callback to be notified when a provider's health status changes
   * @param callback The callback function
   */
  onHealthStatusChange(callback: (provider: T, result: HealthCheckResult) => void): void;
  
  /**
   * Get all providers that are currently healthy
   * @param providers The providers to filter
   */
  getHealthyProviders(providers: T[]): Promise<T[]>;
  
  /**
   * Get the overall health status of all monitored providers
   */
  getOverallStatus(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    statusCounts: Record<ConnectionStatus, number>;
    avgResponseTimeMs: number;
  }>;
}
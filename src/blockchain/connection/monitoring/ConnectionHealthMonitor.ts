/**
 * ConnectionHealthMonitor.ts
 * Implements health monitoring and automatic reconnection for blockchain node connections
 */

import { EventEmitter } from 'events';
import { HEALTH_MONITORING_CONFIG } from '../config/BlockchainNetworkConfig';
import { NetworkConfig, ProviderEndpoint } from '../interfaces/ConnectionConfig';

/**
 * Health status of a blockchain provider
 */
export interface ProviderHealth {
  providerUrl: string;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime: number; // in milliseconds
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  errorRate: number; // 0-1 range
  status: 'ACTIVE' | 'DEGRADED' | 'FAILED' | 'RECOVERING';
  lastError?: Error;
}

/**
 * Health monitoring events
 */
export enum HealthMonitorEvents {
  PROVIDER_DEGRADED = 'provider:degraded',
  PROVIDER_FAILED = 'provider:failed',
  PROVIDER_RECOVERED = 'provider:recovered',
  PROVIDER_SWITCHED = 'provider:switched',
  HIGH_LATENCY = 'latency:high',
  RECONNECTION_ATTEMPT = 'reconnection:attempt',
  RECONNECTION_SUCCESS = 'reconnection:success',
  RECONNECTION_FAILURE = 'reconnection:failure'
}

/**
 * Connection Health Monitor
 * 
 * Monitors the health of blockchain node connections and manages automatic reconnection
 * when failures are detected. Implements circuit breaker pattern to prevent cascading failures.
 */
export class ConnectionHealthMonitor extends EventEmitter {
  private providerHealthMap: Map<string, ProviderHealth>;
  private monitoringIntervals: Map<string, NodeJS.Timeout>;
  private reconnectionAttempts: Map<string, number>;
  private config: typeof HEALTH_MONITORING_CONFIG;
  
  /**
   * Creates a new ConnectionHealthMonitor
   * @param customConfig Optional custom configuration to override defaults
   */
  constructor(customConfig?: Partial<typeof HEALTH_MONITORING_CONFIG>) {
    super();
    this.providerHealthMap = new Map();
    this.monitoringIntervals = new Map();
    this.reconnectionAttempts = new Map();
    this.config = { ...HEALTH_MONITORING_CONFIG, ...customConfig };
  }
  
  /**
   * Registers a provider for health monitoring
   * @param networkId The network identifier
   * @param provider The provider endpoint to monitor
   */
  public registerProvider(networkId: string, provider: ProviderEndpoint): void {
    const providerKey = `${networkId}:${provider.url}`;
    
    // Initialize health status
    this.providerHealthMap.set(providerKey, {
      providerUrl: provider.url,
      isHealthy: true,
      lastChecked: new Date(),
      responseTime: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      errorRate: 0,
      status: 'ACTIVE'
    });
    
    this.reconnectionAttempts.set(providerKey, 0);
    
    // Start monitoring
    this.startMonitoring(networkId, provider);
  }
  
  /**
   * Starts health monitoring for a provider
   * @param networkId The network identifier
   * @param provider The provider endpoint to monitor
   */
  private startMonitoring(networkId: string, provider: ProviderEndpoint): void {
    const providerKey = `${networkId}:${provider.url}`;
    
    // Clear any existing interval
    if (this.monitoringIntervals.has(providerKey)) {
      clearInterval(this.monitoringIntervals.get(providerKey)!);
    }
    
    // Set up new monitoring interval
    const interval = setInterval(() => {
      this.checkProviderHealth(networkId, provider);
    }, this.config.pingInterval);
    
    this.monitoringIntervals.set(providerKey, interval);
  }
  
  /**
   * Checks the health of a provider by sending a ping request
   * @param networkId The network identifier
   * @param provider The provider endpoint to check
   */
  private async checkProviderHealth(networkId: string, provider: ProviderEndpoint): Promise<void> {
    const providerKey = `${networkId}:${provider.url}`;
    const health = this.providerHealthMap.get(providerKey)!;
    
    try {
      const startTime = Date.now();
      
      // Send a lightweight request to check provider health
      // This would typically be a call to eth_blockNumber or similar
      await this.sendHealthCheckRequest(provider);
      
      const responseTime = Date.now() - startTime;
      
      // Update health metrics
      health.lastChecked = new Date();
      health.responseTime = responseTime;
      health.consecutiveSuccesses++;
      health.consecutiveFailures = 0;
      health.isHealthy = true;
      
      // Check for high latency
      if (responseTime > this.config.alertThresholds.highLatency) {
        health.status = 'DEGRADED';
        this.emit(HealthMonitorEvents.HIGH_LATENCY, {
          networkId,
          providerUrl: provider.url,
          responseTime
        });
      } else {
        // If previously degraded or recovering, mark as active again
        if (health.status === 'DEGRADED' || health.status === 'RECOVERING') {
          health.status = 'ACTIVE';
          this.emit(HealthMonitorEvents.PROVIDER_RECOVERED, {
            networkId,
            providerUrl: provider.url
          });
        }
      }
      
      // Reset reconnection attempts on successful health check
      this.reconnectionAttempts.set(providerKey, 0);
      
    } catch (error) {
      // Update health metrics for failure
      health.lastChecked = new Date();
      health.consecutiveFailures++;
      health.consecutiveSuccesses = 0;
      health.lastError = error as Error;
      
      // Calculate error rate (simple moving average)
      health.errorRate = health.errorRate * 0.7 + 0.3; // 30% weight to new error
      
      // Check if provider has failed
      if (health.consecutiveFailures >= this.config.errorThreshold) {
        health.isHealthy = false;
        health.status = 'FAILED';
        
        this.emit(HealthMonitorEvents.PROVIDER_FAILED, {
          networkId,
          providerUrl: provider.url,
          consecutiveFailures: health.consecutiveFailures,
          error: health.lastError
        });
        
        // Attempt reconnection
        this.attemptReconnection(networkId, provider);
      } else {
        health.status = 'DEGRADED';
        
        this.emit(HealthMonitorEvents.PROVIDER_DEGRADED, {
          networkId,
          providerUrl: provider.url,
          consecutiveFailures: health.consecutiveFailures,
          error: health.lastError
        });
      }
    }
    
    // Update the health map
    this.providerHealthMap.set(providerKey, health);
  }
  
  /**
   * Attempts to reconnect to a failed provider
   * @param networkId The network identifier
   * @param provider The provider endpoint to reconnect to
   */
  private async attemptReconnection(networkId: string, provider: ProviderEndpoint): Promise<void> {
    const providerKey = `${networkId}:${provider.url}`;
    const attempts = this.reconnectionAttempts.get(providerKey) || 0;
    
    // Emit reconnection attempt event
    this.emit(HealthMonitorEvents.RECONNECTION_ATTEMPT, {
      networkId,
      providerUrl: provider.url,
      attemptNumber: attempts + 1
    });
    
    try {
      // Implement exponential backoff for reconnection attempts
      const backoffDelay = Math.min(
        1000 * Math.pow(2, attempts),
        60000 // Max 1 minute delay
      );
      
      // Wait for backoff delay
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      // Attempt to reconnect
      await this.sendHealthCheckRequest(provider);
      
      // If we get here, reconnection was successful
      const health = this.providerHealthMap.get(providerKey)!;
      health.isHealthy = true;
      health.status = 'RECOVERING';
      health.consecutiveFailures = 0;
      health.consecutiveSuccesses = 1;
      health.lastChecked = new Date();
      
      this.providerHealthMap.set(providerKey, health);
      
      // Emit reconnection success event
      this.emit(HealthMonitorEvents.RECONNECTION_SUCCESS, {
        networkId,
        providerUrl: provider.url
      });
      
      // Reset reconnection attempts
      this.reconnectionAttempts.set(providerKey, 0);
      
    } catch (error) {
      // Reconnection failed
      const health = this.providerHealthMap.get(providerKey)!;
      health.lastError = error as Error;
      
      this.providerHealthMap.set(providerKey, health);
      
      // Increment reconnection attempts
      this.reconnectionAttempts.set(providerKey, attempts + 1);
      
      // Emit reconnection failure event
      this.emit(HealthMonitorEvents.RECONNECTION_FAILURE, {
        networkId,
        providerUrl: provider.url,
        attemptNumber: attempts + 1,
        error: error as Error
      });
      
      // Schedule another reconnection attempt if we haven't exceeded max retries
      // This would typically be handled by the ConnectionManager
    }
  }
  
  /**
   * Sends a health check request to a provider
   * @param provider The provider endpoint to check
   * @returns Promise that resolves if the provider is healthy
   */
  private async sendHealthCheckRequest(provider: ProviderEndpoint): Promise<any> {
    // This is a placeholder for the actual implementation
    // In a real implementation, this would send a lightweight request to the provider
    // such as eth_blockNumber for Ethereum or similar for other blockchains
    
    return new Promise((resolve, reject) => {
      // Simulate network request with timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Health check timed out after ${this.config.timeoutThreshold}ms`));
      }, this.config.timeoutThreshold);
      
      // Simulate successful response in most cases, with occasional failures
      setTimeout(() => {
        clearTimeout(timeout);
        
        // Simulate random failures (10% chance)
        if (Math.random() < 0.1) {
          reject(new Error('Simulated provider error'));
        } else {
          resolve({ blockNumber: Math.floor(Math.random() * 1000000) });
        }
      }, Math.random() * 1000); // Random response time between 0-1000ms
    });
  }
  
  /**
   * Gets the current health status of a provider
   * @param networkId The network identifier
   * @param providerUrl The provider URL
   * @returns The provider health status or undefined if not monitored
   */
  public getProviderHealth(networkId: string, providerUrl: string): ProviderHealth | undefined {
    return this.providerHealthMap.get(`${networkId}:${providerUrl}`);
  }
  
  /**
   * Gets all monitored providers for a network
   * @param networkId The network identifier
   * @returns Array of provider health statuses
   */
  public getNetworkProviderHealth(networkId: string): ProviderHealth[] {
    const results: ProviderHealth[] = [];
    
    for (const [key, health] of this.providerHealthMap.entries()) {
      if (key.startsWith(`${networkId}:`)) {
        results.push(health);
      }
    }
    
    return results;
  }
  
  /**
   * Stops monitoring a provider
   * @param networkId The network identifier
   * @param providerUrl The provider URL
   */
  public stopMonitoring(networkId: string, providerUrl: string): void {
    const providerKey = `${networkId}:${providerUrl}`;
    
    if (this.monitoringIntervals.has(providerKey)) {
      clearInterval(this.monitoringIntervals.get(providerKey)!);
      this.monitoringIntervals.delete(providerKey);
    }
    
    this.providerHealthMap.delete(providerKey);
    this.reconnectionAttempts.delete(providerKey);
  }
  
  /**
   * Stops all monitoring
   */
  public stopAllMonitoring(): void {
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    
    this.monitoringIntervals.clear();
    this.providerHealthMap.clear();
    this.reconnectionAttempts.clear();
  }
}
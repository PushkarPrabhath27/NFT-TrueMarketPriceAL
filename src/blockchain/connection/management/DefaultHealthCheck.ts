/**
 * DefaultHealthCheck.ts
 * Default implementation of the HealthCheck interface
 */

import { BlockchainProvider, ConnectionStatus } from '../interfaces/BlockchainProvider';
import { HealthCheck, HealthCheckResult } from '../interfaces/HealthCheck';

/**
 * Default implementation of the HealthCheck interface
 */
export class DefaultHealthCheck<T extends BlockchainProvider> implements HealthCheck<T> {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckResults: Map<string, HealthCheckResult[]> = new Map();
  private statusChangeCallbacks: ((provider: T, result: HealthCheckResult) => void)[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  /**
   * Perform a health check on a provider
   */
  async checkHealth(provider: T): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let isHealthy = false;
    let status = ConnectionStatus.DISCONNECTED;
    let errorMessage: string | undefined;
    let metrics: HealthCheckResult['metrics'] = {};

    try {
      // Check connection status
      isHealthy = await provider.isConnected();
      status = await provider.getStatus();
      
      // Get rate limit status
      const rateLimitStatus = await provider.getRateLimitStatus();
      
      // Get error rate and latency
      const errorRate = provider.getErrorRate();
      const latency = provider.getLatency();
      
      // Set metrics
      metrics = {
        errorRate,
        avgResponseTimeMs: latency,
        rateLimit: rateLimitStatus
      };

      // If rate limited, update status
      if (rateLimitStatus.isLimited) {
        status = ConnectionStatus.RATE_LIMITED;
        isHealthy = false;
      }

      // If error rate is too high, mark as degraded
      if (errorRate > 0.1) { // 10% error rate threshold
        status = ConnectionStatus.DEGRADED;
        isHealthy = false;
      }

      // If latency is too high, mark as degraded
      if (latency > 5000) { // 5 seconds latency threshold
        status = ConnectionStatus.DEGRADED;
        isHealthy = false;
      }
    } catch (error) {
      isHealthy = false;
      status = ConnectionStatus.ERROR;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    const responseTimeMs = Date.now() - startTime;
    
    // Create health check result
    const result: HealthCheckResult = {
      isHealthy,
      status,
      responseTimeMs,
      errorMessage,
      timestamp: new Date(),
      metrics
    };

    // Store the result
    this.storeHealthCheckResult(provider.getUrl(), result);
    
    // Notify callbacks if status changed
    const previousResult = await this.getLatestHealthCheck(provider.getUrl());
    if (previousResult && previousResult.status !== result.status) {
      this.notifyStatusChange(provider, result);
    }

    return result;
  }

  /**
   * Start periodic health checks
   */
  async startMonitoring(providers: T[], intervalMs: number): Promise<void> {
    // Stop any existing monitoring
    await this.stopMonitoring();
    
    // Start new monitoring interval
    this.monitoringInterval = setInterval(async () => {
      for (const provider of providers) {
        await this.checkHealth(provider);
      }
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  async stopMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get the latest health check result for a provider
   */
  async getLatestHealthCheck(providerUrl: string): Promise<HealthCheckResult | null> {
    const history = this.healthCheckResults.get(providerUrl);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get health check history for a provider
   */
  async getHealthCheckHistory(providerUrl: string, limit?: number): Promise<HealthCheckResult[]> {
    const history = this.healthCheckResults.get(providerUrl) || [];
    return limit ? history.slice(-limit) : [...history];
  }

  /**
   * Register a callback for health status changes
   */
  onHealthStatusChange(callback: (provider: T, result: HealthCheckResult) => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  /**
   * Get all providers that are currently healthy
   */
  async getHealthyProviders(providers: T[]): Promise<T[]> {
    const healthyProviders: T[] = [];
    
    for (const provider of providers) {
      const healthCheck = await this.getLatestHealthCheck(provider.getUrl());
      if (healthCheck && healthCheck.isHealthy) {
        healthyProviders.push(provider);
      }
    }
    
    return healthyProviders;
  }

  /**
   * Get the overall health status of all monitored providers
   */
  async getOverallStatus(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    statusCounts: Record<ConnectionStatus, number>;
    avgResponseTimeMs: number;
  }> {
    const providerUrls = Array.from(this.healthCheckResults.keys());
    const totalProviders = providerUrls.length;
    let healthyProviders = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    const statusCounts: Record<ConnectionStatus, number> = {
      [ConnectionStatus.CONNECTED]: 0,
      [ConnectionStatus.DISCONNECTED]: 0,
      [ConnectionStatus.ERROR]: 0,
      [ConnectionStatus.RATE_LIMITED]: 0,
      [ConnectionStatus.DEGRADED]: 0
    };
    
    for (const url of providerUrls) {
      const latestCheck = await this.getLatestHealthCheck(url);
      if (latestCheck) {
        if (latestCheck.isHealthy) {
          healthyProviders++;
        }
        
        statusCounts[latestCheck.status] = (statusCounts[latestCheck.status] || 0) + 1;
        totalResponseTime += latestCheck.responseTimeMs;
        responseTimeCount++;
      }
    }
    
    const avgResponseTimeMs = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    return {
      totalProviders,
      healthyProviders,
      statusCounts,
      avgResponseTimeMs
    };
  }

  /**
   * Store a health check result
   */
  private storeHealthCheckResult(providerUrl: string, result: HealthCheckResult): void {
    let history = this.healthCheckResults.get(providerUrl);
    if (!history) {
      history = [];
      this.healthCheckResults.set(providerUrl, history);
    }

    history.push(result);

    // Trim history if it exceeds max size
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.splice(0, history.length - this.MAX_HISTORY_SIZE);
    }
  }

  /**
   * Notify status change callbacks
   */
  private notifyStatusChange(provider: T, result: HealthCheckResult): void {
    for (const callback of this.statusChangeCallbacks) {
      try {
        callback(provider, result);
      } catch (error) {
        console.error('Error in health status change callback:', error);
      }
    }
  }
}
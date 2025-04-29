/**
 * NodeConnectionManager.ts
 * Implementation of the node connection management component
 */

import { BlockchainProvider, ConnectionStatus } from '../interfaces/BlockchainProvider';
import { ConnectionConfig, NetworkConfig, ProviderEndpoint } from '../interfaces/ConnectionConfig';
import { ConnectionPool } from '../interfaces/ConnectionPool';
import { HealthCheck, HealthCheckResult } from '../interfaces/HealthCheck';

/**
 * Class that implements health checking functionality
 */
class ProviderHealthCheck<T extends BlockchainProvider> implements HealthCheck<T> {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckResults: Map<string, HealthCheckResult[]> = new Map();
  private statusChangeCallbacks: ((provider: T, result: HealthCheckResult) => void)[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  /**
   * Perform a health check on a provider
   * @param provider The provider to check
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
    const previousResult = this.getLatestStoredHealthCheck(provider.getUrl());
    if (previousResult && previousResult.status !== result.status) {
      this.notifyStatusChange(provider, result);
    }

    return result;
  }

  /**
   * Start periodic health checks
   * @param providers The providers to monitor
   * @param intervalMs The interval between health checks in milliseconds
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
   * @param providerUrl The URL of the provider
   */
  async getLatestHealthCheck(providerUrl: string): Promise<HealthCheckResult | null> {
    return this.getLatestStoredHealthCheck(providerUrl);
  }

  /**
   * Get health check history for a provider
   * @param providerUrl The URL of the provider
   * @param limit Maximum number of results to return
   */
  async getHealthCheckHistory(providerUrl: string, limit?: number): Promise<HealthCheckResult[]> {
    const history = this.healthCheckResults.get(providerUrl) || [];
    return limit ? history.slice(-limit) : [...history];
  }

  /**
   * Register a callback to be notified when a provider's health status changes
   * @param callback The callback function
   */
  onHealthStatusChange(callback: (provider: T, result: HealthCheckResult) => void): void {
    this.statusChangeCallbacks.push(callback);
  }

  /**
   * Get all providers that are currently healthy
   * @param providers The providers to filter
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
      const latestCheck = this.getLatestStoredHealthCheck(url);
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
   * @param providerUrl The URL of the provider
   * @param result The health check result
   */
  private storeHealthCheckResult(providerUrl: string, result: HealthCheckResult): void {
    if (!this.healthCheckResults.has(providerUrl)) {
      this.healthCheckResults.set(providerUrl, []);
    }
    
    const history = this.healthCheckResults.get(providerUrl)!;
    history.push(result);
    
    // Limit history size
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }
  }

  /**
   * Get the latest stored health check result for a provider
   * @param providerUrl The URL of the provider
   */
  private getLatestStoredHealthCheck(providerUrl: string): HealthCheckResult | null {
    const history = this.healthCheckResults.get(providerUrl);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Notify status change callbacks
   * @param provider The provider
   * @param result The health check result
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

/**
 * Class that implements connection pooling functionality
 */
class ProviderConnectionPool<T extends BlockchainProvider> implements ConnectionPool<T> {
  private providers: T[] = [];
  private maxSize: number = 10;
  private healthCheck: ProviderHealthCheck<T>;

  constructor(healthCheck: ProviderHealthCheck<T>) {
    this.healthCheck = healthCheck;
  }

  /**
   * Initialize the connection pool
   * @param size Maximum number of connections to maintain in the pool
   */
  async initialize(size: number): Promise<void> {
    this.maxSize = size;
  }

  /**
   * Add a provider to the pool
   * @param provider The provider to add
   */
  async addProvider(provider: T): Promise<void> {
    // Check if provider already exists in the pool
    const existingIndex = this.providers.findIndex(p => p.getUrl() === provider.getUrl());
    if (existingIndex >= 0) {
      // Replace existing provider
      this.providers[existingIndex] = provider;
    } else {
      // Add new provider
      this.providers.push(provider);
    }
    
    // Perform initial health check
    await this.healthCheck.checkHealth(provider);
  }

  /**
   * Remove a provider from the pool
   * @param providerUrl The URL of the provider to remove
   */
  async removeProvider(providerUrl: string): Promise<void> {
    this.providers = this.providers.filter(p => p.getUrl() !== providerUrl);
  }

  /**
   * Get a provider from the pool
   * This returns the best available provider based on health, priority, and load
   */
  async getProvider(): Promise<T> {
    // Get healthy providers
    const healthyProviders = await this.healthCheck.getHealthyProviders(this.providers);
    
    if (healthyProviders.length === 0) {
      throw new Error('No healthy providers available in the pool');
    }
    
    // Sort by priority (lower number = higher priority)
    healthyProviders.sort((a, b) => a.getPriority() - b.getPriority());
    
    // Return the highest priority healthy provider
    return healthyProviders[0];
  }

  /**
   * Get all providers in the pool
   */
  async getAllProviders(): Promise<T[]> {
    return [...this.providers];
  }

  /**
   * Get healthy providers in the pool
   */
  async getHealthyProviders(): Promise<T[]> {
    return this.healthCheck.getHealthyProviders(this.providers);
  }

  /**
   * Check if the pool has any healthy providers
   */
  async hasHealthyProviders(): Promise<boolean> {
    const healthyProviders = await this.getHealthyProviders();
    return healthyProviders.length > 0;
  }

  /**
   * Get the number of providers in the pool
   */
  size(): number {
    return this.providers.length;
  }

  /**
   * Get the number of healthy providers in the pool
   */
  async healthySize(): Promise<number> {
    const healthyProviders = await this.getHealthyProviders();
    return healthyProviders.length;
  }

  /**
   * Release a provider back to the pool
   * @param provider The provider to release
   */
  async releaseProvider(provider: T): Promise<void> {
    // No-op for now as we're not tracking in-use providers
    // This would be implemented if we were limiting concurrent use
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error(`Error disconnecting provider ${provider.getUrl()}:`, error);
      }
    }
    
    this.providers = [];
  }

  /**
   * Get the status of the connection pool
   */
  async getStatus(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    statusCounts: Record<ConnectionStatus, number>;
  }> {
    const overallStatus = await this.healthCheck.getOverallStatus();
    return {
      totalProviders: overallStatus.totalProviders,
      healthyProviders: overallStatus.healthyProviders,
      statusCounts: overallStatus.statusCounts
    };
  }
}

/**
 * Main class for managing blockchain node connections
 * Implements provider management, health checking, and connection pooling
 */
export class NodeConnectionManager<T extends BlockchainProvider> {
  private config: ConnectionConfig;
  private providers: Map<string, Map<string, T>> = new Map();
  private healthCheck: ProviderHealthCheck<T>;
  private connectionPools: Map<string, ProviderConnectionPool<T>> = new Map();
  private defaultNetwork: string;

  /**
   * Create a new NodeConnectionManager
   * @param config The connection configuration
   */
  constructor(config: ConnectionConfig) {
    this.config = config;
    this.defaultNetwork = config.defaultNetwork || Object.keys(config.networks)[0];
    this.healthCheck = new ProviderHealthCheck<T>();
  }

  /**
   * Initialize the connection manager
   */
  async initialize(): Promise<void> {
    // Initialize providers for each network
    for (const [networkName, networkConfig] of Object.entries(this.config.networks)) {
      await this.initializeNetwork(networkName, networkConfig);
    }
    
    // Start health monitoring
    const allProviders = await this.getAllProviders();
    const healthCheckInterval = this.config.healthCheckIntervalMs || 60000; // Default: 1 minute
    await this.healthCheck.startMonitoring(allProviders, healthCheckInterval);
  }

  /**
   * Initialize providers for a specific network
   * @param networkName The name of the network
   * @param networkConfig The network configuration
   */
  private async initializeNetwork(networkName: string, networkConfig: NetworkConfig): Promise<void> {
    // Create network map if it doesn't exist
    if (!this.providers.has(networkName)) {
      this.providers.set(networkName, new Map<string, T>());
    }
    
    const networkProviders = this.providers.get(networkName)!;
    const poolSize = this.config.poolSize || 10;
    
    // Create connection pool for this network
    const pool = new ProviderConnectionPool<T>(this.healthCheck);
    await pool.initialize(poolSize);
    this.connectionPools.set(networkName, pool);
    
    // Initialize each provider endpoint
    for (const endpoint of networkConfig.providers) {
      try {
        const provider = await this.createProvider(endpoint, networkConfig);
        networkProviders.set(endpoint.url, provider);
        await pool.addProvider(provider);
      } catch (error) {
        console.error(`Failed to initialize provider ${endpoint.url}:`, error);
      }
    }
  }

  /**
   * Create a provider instance from an endpoint configuration
   * @param endpoint The provider endpoint configuration
   * @param networkConfig The network configuration
   */
  protected async createProvider(endpoint: ProviderEndpoint, networkConfig: NetworkConfig): Promise<T> {
    // This method should be implemented by subclasses for specific blockchain types
    throw new Error('createProvider must be implemented by subclasses');
  }

  /**
   * Get a provider for a specific blockchain and network
   * @param blockchain The blockchain type (e.g., 'ethereum', 'solana')
   * @param network The network name (e.g., 'mainnet', 'testnet')
   */
  async getProvider(blockchain: string, network?: string): Promise<T> {
    const networkName = network || this.defaultNetwork;
    
    // Check if network exists
    if (!this.providers.has(networkName)) {
      throw new Error(`Network '${networkName}' not found`);
    }
    
    // Get connection pool for this network
    const pool = this.connectionPools.get(networkName);
    if (!pool) {
      throw new Error(`Connection pool for network '${networkName}' not found`);
    }
    
    // Get the best available provider from the pool
    return pool.getProvider();
  }

  /**
   * Get all providers across all networks
   */
  async getAllProviders(): Promise<T[]> {
    const allProviders: T[] = [];
    
    for (const networkProviders of this.providers.values()) {
      for (const provider of networkProviders.values()) {
        allProviders.push(provider);
      }
    }
    
    return allProviders;
  }

  /**
   * Get all healthy providers across all networks
   */
  async getHealthyProviders(): Promise<T[]> {
    const allProviders = await this.getAllProviders();
    return this.healthCheck.getHealthyProviders(allProviders);
  }

  /**
   * Get the health check status for a specific provider
   * @param providerUrl The URL of the provider
   */
  async getProviderHealth(providerUrl: string): Promise<HealthCheckResult | null> {
    return this.healthCheck.getLatestHealthCheck(providerUrl);
  }

  /**
   * Get the overall health status of all providers
   */
  async getOverallHealth(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    statusCounts: Record<ConnectionStatus, number>;
    avgResponseTimeMs: number;
  }> {
    return this.healthCheck.getOverallStatus();
  }

  /**
   * Register a callback for health status changes
   * @param callback The callback function
   */
  onHealthStatusChange(callback: (provider: T, result: HealthCheckResult) => void): void {
    this.healthCheck.onHealthStatusChange(callback);
  }

  /**
   * Close all connections and stop monitoring
   */
  async shutdown(): Promise<void> {
    // Stop health monitoring
    await this.healthCheck.stopMonitoring();
    
    // Close all connection pools
    for (const pool of this.connectionPools.values()) {
      await pool.close();
    }
    
    // Clear all providers
    this.providers.clear();
    this.connectionPools.clear();
  }
}
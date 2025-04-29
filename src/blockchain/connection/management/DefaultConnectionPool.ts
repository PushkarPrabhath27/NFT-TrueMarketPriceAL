/**
 * DefaultConnectionPool.ts
 * Default implementation of the ConnectionPool interface
 */

import { BlockchainProvider, ConnectionStatus } from '../interfaces/BlockchainProvider';
import { ConnectionPool } from '../interfaces/ConnectionPool';
import { HealthCheck, HealthCheckResult } from '../interfaces/HealthCheck';

/**
 * Default implementation of the ConnectionPool interface
 */
export class DefaultConnectionPool<T extends BlockchainProvider> implements ConnectionPool<T> {
  private providers: T[] = [];
  private healthCheck: HealthCheck<T>;
  private maxPoolSize: number = 10;
  private activeProviders: Set<string> = new Set();

  constructor(healthCheck: HealthCheck<T>) {
    this.healthCheck = healthCheck;
  }

  /**
   * Initialize the connection pool
   */
  async initialize(size: number): Promise<void> {
    this.maxPoolSize = size;
  }

  /**
   * Add a provider to the pool
   */
  async addProvider(provider: T): Promise<void> {
    if (this.providers.length >= this.maxPoolSize) {
      throw new Error('Connection pool is at maximum capacity');
    }

    // Check if provider already exists
    if (this.providers.some(p => p.getUrl() === provider.getUrl())) {
      throw new Error('Provider already exists in pool');
    }

    // Initialize the provider
    await provider.connect();
    this.providers.push(provider);
  }

  /**
   * Remove a provider from the pool
   */
  async removeProvider(providerUrl: string): Promise<void> {
    const index = this.providers.findIndex(p => p.getUrl() === providerUrl);
    if (index === -1) {
      throw new Error('Provider not found in pool');
    }

    const provider = this.providers[index];
    await provider.disconnect();
    this.providers.splice(index, 1);
    this.activeProviders.delete(providerUrl);
  }

  /**
   * Get a provider from the pool
   */
  async getProvider(): Promise<T> {
    const healthyProviders = await this.getHealthyProviders();
    if (healthyProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    // Sort by priority and load
    const sortedProviders = healthyProviders.sort((a, b) => {
      // First sort by priority
      const priorityDiff = a.getPriority() - b.getPriority();
      if (priorityDiff !== 0) return priorityDiff;

      // Then by whether they're active
      const aActive = this.activeProviders.has(a.getUrl());
      const bActive = this.activeProviders.has(b.getUrl());
      if (!aActive && bActive) return -1;
      if (aActive && !bActive) return 1;

      // Finally by latency
      return a.getLatency() - b.getLatency();
    });

    const provider = sortedProviders[0];
    this.activeProviders.add(provider.getUrl());
    return provider;
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
   */
  async releaseProvider(provider: T): Promise<void> {
    this.activeProviders.delete(provider.getUrl());
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    await Promise.all(this.providers.map(p => p.disconnect()));
    this.providers = [];
    this.activeProviders.clear();
  }

  /**
   * Get the status of the connection pool
   */
  async getStatus(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    statusCounts: Record<ConnectionStatus, number>;
  }> {
    const healthyProviders = await this.getHealthyProviders();
    const statusCounts: Record<ConnectionStatus, number> = {
      [ConnectionStatus.CONNECTED]: 0,
      [ConnectionStatus.DISCONNECTED]: 0,
      [ConnectionStatus.ERROR]: 0,
      [ConnectionStatus.RATE_LIMITED]: 0,
      [ConnectionStatus.DEGRADED]: 0
    };

    for (const provider of this.providers) {
      const status = await provider.getStatus();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    return {
      totalProviders: this.providers.length,
      healthyProviders: healthyProviders.length,
      statusCounts
    };
  }
}
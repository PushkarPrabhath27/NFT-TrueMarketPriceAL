/**
 * ConnectionPool.ts
 * Interface for connection pooling functionality
 */

import { BlockchainProvider, ConnectionStatus } from './BlockchainProvider';

/**
 * Interface for a connection pool that manages multiple blockchain providers
 */
export interface ConnectionPool<T extends BlockchainProvider> {
  /**
   * Initialize the connection pool
   * @param size Maximum number of connections to maintain in the pool
   */
  initialize(size: number): Promise<void>;
  
  /**
   * Add a provider to the pool
   * @param provider The provider to add
   */
  addProvider(provider: T): Promise<void>;
  
  /**
   * Remove a provider from the pool
   * @param providerUrl The URL of the provider to remove
   */
  removeProvider(providerUrl: string): Promise<void>;
  
  /**
   * Get a provider from the pool
   * This should return the best available provider based on health, priority, and load
   */
  getProvider(): Promise<T>;
  
  /**
   * Get all providers in the pool
   */
  getAllProviders(): Promise<T[]>;
  
  /**
   * Get healthy providers in the pool
   */
  getHealthyProviders(): Promise<T[]>;
  
  /**
   * Check if the pool has any healthy providers
   */
  hasHealthyProviders(): Promise<boolean>;
  
  /**
   * Get the number of providers in the pool
   */
  size(): number;
  
  /**
   * Get the number of healthy providers in the pool
   */
  healthySize(): Promise<number>;
  
  /**
   * Release a provider back to the pool
   * @param provider The provider to release
   */
  releaseProvider(provider: T): Promise<void>;
  
  /**
   * Close all connections in the pool
   */
  close(): Promise<void>;
  
  /**
   * Get the status of the connection pool
   */
  getStatus(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    statusCounts: Record<ConnectionStatus, number>;
  }>;
}
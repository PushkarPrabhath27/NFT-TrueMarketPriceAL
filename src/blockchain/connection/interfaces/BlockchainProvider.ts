/**
 * BlockchainProvider.ts
 * Base interface for all blockchain providers
 */

import { ConnectionConfig } from './ConnectionConfig.ts';

/**
 * Represents the status of a blockchain connection
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RATE_LIMITED = 'rate_limited',
  DEGRADED = 'degraded'
}

/**
 * Base interface for all blockchain providers
 * Defines common methods that must be implemented by all blockchain providers
 */
export interface BlockchainProvider {
  /**
   * Initialize the provider with the given configuration
   * @param config Provider-specific configuration
   */
  initialize(config: ConnectionConfig): Promise<void>;
  
  /**
   * Connect to the blockchain network
   */
  connect(): Promise<boolean>;
  
  /**
   * Disconnect from the blockchain network
   */
  disconnect(): Promise<void>;
  
  /**
   * Check if the provider is connected
   */
  isConnected(): Promise<boolean>;
  
  /**
   * Get the current connection status
   */
  getStatus(): Promise<ConnectionStatus>;
  
  /**
   * Get the current block number
   */
  getBlockNumber(): Promise<number>;
  
  /**
   * Get the chain ID
   */
  getChainId(): Promise<string>;
  
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Get the provider URL
   */
  getUrl(): string;
  
  /**
   * Get the provider priority
   */
  getPriority(): number;
  
  /**
   * Get the provider latency in milliseconds
   */
  getLatency(): number;
  
  /**
   * Get the provider error rate (0-1)
   */
  getErrorRate(): number;
  
  /**
   * Get the provider rate limit status
   */
  getRateLimitStatus(): Promise<{
    isLimited: boolean;
    resetTime?: Date;
    remainingRequests?: number;
  }>;
  
  /**
   * Execute a raw RPC call
   * @param method The RPC method name
   * @param params The RPC method parameters
   */
  executeRpcCall<T>(method: string, params: any[]): Promise<T>;
}
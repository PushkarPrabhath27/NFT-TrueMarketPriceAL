/**
 * Base interface for standardized blockchain interactions across different networks.
 */

export interface BlockchainConfig {
  networkUrl: string;
  chainId: string | number;
  providerTimeout?: number;
  maxRetries?: number;
  credentials?: {
    apiKey?: string;
    secret?: string;
  };
}

export interface TransactionConfig {
  maxConfirmations: number;
  timeoutMs: number;
  retryInterval: number;
}

export interface QueryOptions {
  timeout?: number;
  retryAttempts?: number;
  batchSize?: number;
  cacheExpiry?: number;
}

/**
 * Standardized response format for cross-chain operations
 */
export interface BlockchainResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
  blockNumber?: string | number;
}

/**
 * Base interface for blockchain interactions
 */
export interface IBlockchainAdapter {
  // Connection Management
  connect(config: BlockchainConfig): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getNetworkStatus(): Promise<BlockchainResponse<{
    isHealthy: boolean;
    latency: number;
    blockHeight: string | number;
  }>>;

  // Basic Chain Operations
  getBalance(address: string, options?: QueryOptions): Promise<BlockchainResponse<string>>;
  getTransaction(txHash: string, options?: QueryOptions): Promise<BlockchainResponse<any>>;
  getBlock(blockNumber: string | number, options?: QueryOptions): Promise<BlockchainResponse<any>>;

  // NFT Specific Operations
  getNFTMetadata(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<any>>;
  getNFTOwner(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<string>>;
  getNFTTransferHistory(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<any[]>>;

  // Contract Operations
  callContractMethod(
    contractAddress: string,
    method: string,
    params: any[],
    options?: QueryOptions
  ): Promise<BlockchainResponse<any>>;

  // Event Handling
  subscribeToEvents(
    contractAddress: string,
    eventName: string,
    callback: (event: any) => void,
    options?: QueryOptions
  ): Promise<BlockchainResponse<string>>;
  unsubscribeFromEvents(subscriptionId: string): Promise<BlockchainResponse<boolean>>;

  // Error Handling
  handleError(error: any): BlockchainResponse<never>;
}
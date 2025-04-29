import {
  BlockchainConfig,
  BlockchainResponse,
  IBlockchainAdapter,
  QueryOptions,
  TransactionConfig
} from './BlockchainInterface';

/**
 * Abstract base class implementing common functionality for blockchain adapters
 */
export abstract class BaseBlockchainAdapter implements IBlockchainAdapter {
  protected config: BlockchainConfig;
  protected connected: boolean = false;
  protected readonly defaultQueryOptions: QueryOptions = {
    timeout: 30000,
    retryAttempts: 3,
    batchSize: 100,
    cacheExpiry: 300000 // 5 minutes
  };

  protected readonly defaultTransactionConfig: TransactionConfig = {
    maxConfirmations: 12,
    timeoutMs: 300000, // 5 minutes
    retryInterval: 1000
  };

  constructor(config: BlockchainConfig) {
    this.config = {
      ...config,
      providerTimeout: config.providerTimeout || 30000,
      maxRetries: config.maxRetries || 3
    };
  }

  /**
   * Creates a standardized response object
   */
  protected createResponse<T>(
    success: boolean,
    data?: T,
    error?: { code: string; message: string; details?: any }
  ): BlockchainResponse<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      blockNumber: undefined // Should be set by specific implementations
    };
  }

  /**
   * Implements exponential backoff retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    options?: QueryOptions
  ): Promise<T> {
    const retryAttempts = options?.retryAttempts || this.defaultQueryOptions.retryAttempts;
    let lastError: Error;

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retryAttempts - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Standard error handler implementation
   */
  handleError(error: any): BlockchainResponse<never> {
    console.error('Blockchain operation failed:', error);
    return this.createResponse(
      false,
      undefined,
      {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        details: error
      }
    );
  }

  /**
   * Connection status check
   */
  isConnected(): boolean {
    return this.connected;
  }

  // Abstract methods that must be implemented by specific blockchain adapters
  abstract connect(config: BlockchainConfig): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract getNetworkStatus(): Promise<BlockchainResponse<{
    isHealthy: boolean;
    latency: number;
    blockHeight: string | number;
  }>>;
  abstract getBalance(address: string, options?: QueryOptions): Promise<BlockchainResponse<string>>;
  abstract getTransaction(txHash: string, options?: QueryOptions): Promise<BlockchainResponse<any>>;
  abstract getBlock(blockNumber: string | number, options?: QueryOptions): Promise<BlockchainResponse<any>>;
  abstract getNFTMetadata(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<any>>;
  abstract getNFTOwner(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<string>>;
  abstract getNFTTransferHistory(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<any[]>>;
  abstract callContractMethod(
    contractAddress: string,
    method: string,
    params: any[],
    options?: QueryOptions
  ): Promise<BlockchainResponse<any>>;
  abstract subscribeToEvents(
    contractAddress: string,
    eventName: string,
    callback: (event: any) => void,
    options?: QueryOptions
  ): Promise<BlockchainResponse<string>>;
  abstract unsubscribeFromEvents(subscriptionId: string): Promise<BlockchainResponse<boolean>>;
}
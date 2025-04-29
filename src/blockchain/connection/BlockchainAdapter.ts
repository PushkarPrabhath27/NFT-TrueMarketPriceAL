/**
 * Base interface for standardized blockchain interactions across different networks
 */
export interface BlockchainAdapter {
  /**
   * Establishes connection to the blockchain network
   * @param config Connection configuration including endpoints and credentials
   */
  connect(config: ConnectionConfig): Promise<void>;

  /**
   * Retrieves NFT data by token ID
   * @param contractAddress The NFT contract address
   * @param tokenId The token ID to query
   */
  getNFTData(contractAddress: string, tokenId: string): Promise<NFTData>;

  /**
   * Fetches transaction history for an NFT
   * @param contractAddress The NFT contract address
   * @param tokenId The token ID to query
   * @param options Query options including pagination and filters
   */
  getTransactionHistory(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<Transaction[]>;

  /**
   * Subscribes to NFT-related events
   * @param eventType Type of event to subscribe to (Transfer, Sale, etc.)
   * @param filters Event filters
   * @param callback Callback function for handling events
   */
  subscribeToEvents(eventType: EventType, filters: EventFilters, callback: EventCallback): Promise<Subscription>;

  /**
   * Validates a transaction
   * @param txHash Transaction hash to validate
   */
  validateTransaction(txHash: string): Promise<TransactionStatus>;

  /**
   * Retrieves current network status
   */
  getNetworkStatus(): Promise<NetworkStatus>;
}

/**
 * Connection configuration interface
 */
export interface ConnectionConfig {
  endpoint: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  fallbackEndpoints?: string[];
}

/**
 * Standardized NFT data interface
 */
export interface NFTData {
  tokenId: string;
  contractAddress: string;
  owner: string;
  metadata: Record<string, any>;
  createdAt: Date;
  lastTransferAt?: Date;
}

/**
 * Query options interface
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Transaction interface
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  timestamp: Date;
  value?: string;
  type: TransactionType;
  status: TransactionStatus;
}

/**
 * Event types enum
 */
export enum EventType {
  Transfer = 'Transfer',
  Sale = 'Sale',
  Mint = 'Mint',
  Burn = 'Burn',
  MetadataUpdate = 'MetadataUpdate'
}

/**
 * Transaction types enum
 */
export enum TransactionType {
  Transfer = 'Transfer',
  Sale = 'Sale',
  Mint = 'Mint',
  Burn = 'Burn'
}

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Failed = 'Failed'
}

/**
 * Network status interface
 */
export interface NetworkStatus {
  isConnected: boolean;
  latestBlock: number;
  peers: number;
  syncStatus: boolean;
}

/**
 * Event filters interface
 */
export interface EventFilters {
  contractAddress?: string;
  tokenId?: string;
  from?: string;
  to?: string;
  startBlock?: number;
  endBlock?: number;
}

/**
 * Event callback type
 */
export type EventCallback = (event: any) => void;

/**
 * Subscription interface
 */
export interface Subscription {
  unsubscribe(): void;
  isActive: boolean;
}
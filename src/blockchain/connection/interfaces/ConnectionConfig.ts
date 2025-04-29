/**
 * ConnectionConfig.ts
 * Configuration interfaces for blockchain connections
 */

/**
 * Base provider endpoint configuration
 */
export interface ProviderEndpoint {
  /** The provider URL */
  url: string;
  
  /** Priority of this provider (lower number = higher priority) */
  priority: number;
  
  /** API key for the provider (if required) */
  apiKey?: string;
  
  /** Additional provider-specific options */
  options?: Record<string, any>;
  
  /** Maximum requests per minute (for rate limiting) */
  maxRequestsPerMinute?: number;
  
  /** Timeout in milliseconds for requests */
  timeout?: number;
  
  /** Whether this provider requires authentication */
  requiresAuth?: boolean;
}

/**
 * Network configuration for a specific blockchain
 */
export interface NetworkConfig {
  /** Array of provider endpoints for this network */
  providers: ProviderEndpoint[];
  
  /** Chain ID for this network */
  chainId?: string | number;
  
  /** Network name (e.g., 'mainnet', 'testnet') */
  networkName: string;
  
  /** Whether this is a testnet */
  isTestnet?: boolean;
  
  /** Network-specific configuration options */
  networkOptions?: Record<string, any>;
}

/**
 * Base connection configuration interface
 */
export interface ConnectionConfig {
  /** Network configurations keyed by network name */
  networks: Record<string, NetworkConfig>;
  
  /** Default network to use */
  defaultNetwork?: string;
  
  /** Connection pool size */
  poolSize?: number;
  
  /** Health check interval in milliseconds */
  healthCheckIntervalMs?: number;
  
  /** Retry options */
  retry?: {
    /** Maximum number of retries */
    maxRetries: number;
    
    /** Base delay for exponential backoff (in milliseconds) */
    baseDelayMs: number;
    
    /** Maximum delay for exponential backoff (in milliseconds) */
    maxDelayMs: number;
  };
  
  /** Circuit breaker options */
  circuitBreaker?: {
    /** Failure threshold before opening the circuit */
    failureThreshold: number;
    
    /** Reset timeout in milliseconds */
    resetTimeoutMs: number;
  };
}

/**
 * Ethereum-specific connection configuration
 */
export interface EthereumConnectionConfig extends ConnectionConfig {
  /** Ethereum-specific options */
  ethereumOptions?: {
    /** Whether to use WebSocket for subscriptions */
    useWebsocket?: boolean;
    
    /** Gas price strategy */
    gasPriceStrategy?: 'fastest' | 'fast' | 'average' | 'safeLow';
    
    /** Whether to use EIP-1559 transactions */
    useEip1559?: boolean;
  };
}

/**
 * Solana-specific connection configuration
 */
export interface SolanaConnectionConfig extends ConnectionConfig {
  /** Solana-specific options */
  solanaOptions?: {
    /** Commitment level */
    commitment?: 'processed' | 'confirmed' | 'finalized';
    
    /** Whether to use WebSocket for subscriptions */
    useWebsocket?: boolean;
  };
}

/**
 * Flow-specific connection configuration
 */
export interface FlowConnectionConfig extends ConnectionConfig {
  /** Flow-specific options */
  flowOptions?: {
    /** Access node API version */
    accessNodeApiVersion?: string;
  };
}
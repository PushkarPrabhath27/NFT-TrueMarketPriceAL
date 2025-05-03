/**
 * BlockchainNetworkConfig.ts
 * Comprehensive configuration for blockchain networks, RPC endpoints, and data extraction targets
 */

import { NetworkConfig, ProviderEndpoint } from '../interfaces/ConnectionConfig';

/**
 * Configuration for supported blockchain networks with multiple fallback providers
 * and appropriate rate limiting settings
 */
export const BLOCKCHAIN_NETWORKS: Record<string, NetworkConfig> = {
  // Ethereum Mainnet Configuration
  ethereum: {
    networkName: 'Ethereum Mainnet',
    chainId: 1,
    providers: [
      {
        url: 'https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
        priority: 1,
        apiKey: '${ALCHEMY_API_KEY}',
        maxRequestsPerMinute: 300,
        timeout: 10000,
        requiresAuth: true,
        options: {
          reconnectDelay: 1000,
          maxReconnectAttempts: 5
        }
      },
      {
        url: 'https://mainnet.infura.io/v3/${INFURA_API_KEY}',
        priority: 2,
        apiKey: '${INFURA_API_KEY}',
        maxRequestsPerMinute: 100,
        timeout: 15000,
        requiresAuth: true,
        options: {
          reconnectDelay: 2000,
          maxReconnectAttempts: 3
        }
      },
      {
        url: 'https://rpc.ankr.com/eth/${ANKR_API_KEY}',
        priority: 3,
        apiKey: '${ANKR_API_KEY}',
        maxRequestsPerMinute: 200,
        timeout: 12000,
        requiresAuth: true
      },
      {
        url: 'https://ethereum.publicnode.com',
        priority: 10, // Lower priority for public node (fallback)
        maxRequestsPerMinute: 50,
        timeout: 20000,
        requiresAuth: false
      }
    ],
    networkOptions: {
      blockConfirmations: 12,
      gasMultiplier: 1.2,
      healthCheckInterval: 60000, // 1 minute
      reconnectStrategy: 'exponential-backoff'
    }
  },
  
  // Polygon Mainnet Configuration
  polygon: {
    networkName: 'Polygon Mainnet',
    chainId: 137,
    providers: [
      {
        url: 'https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
        priority: 1,
        apiKey: '${ALCHEMY_API_KEY}',
        maxRequestsPerMinute: 300,
        timeout: 10000,
        requiresAuth: true,
        options: {
          reconnectDelay: 1000,
          maxReconnectAttempts: 5
        }
      },
      {
        url: 'https://polygon-rpc.com',
        priority: 2,
        maxRequestsPerMinute: 100,
        timeout: 15000,
        requiresAuth: false
      },
      {
        url: 'https://rpc.ankr.com/polygon/${ANKR_API_KEY}',
        priority: 3,
        apiKey: '${ANKR_API_KEY}',
        maxRequestsPerMinute: 200,
        timeout: 12000,
        requiresAuth: true
      }
    ],
    networkOptions: {
      blockConfirmations: 64, // Polygon requires more confirmations
      gasMultiplier: 1.5,
      healthCheckInterval: 30000, // 30 seconds
      reconnectStrategy: 'exponential-backoff'
    }
  },
  
  // Solana Mainnet Configuration
  solana: {
    networkName: 'Solana Mainnet',
    chainId: 'mainnet-beta',
    providers: [
      {
        url: 'https://api.mainnet-beta.solana.com',
        priority: 1,
        maxRequestsPerMinute: 100,
        timeout: 30000,
        requiresAuth: false
      },
      {
        url: 'https://solana-api.projectserum.com',
        priority: 2,
        maxRequestsPerMinute: 80,
        timeout: 30000,
        requiresAuth: false
      },
      {
        url: 'https://rpc.ankr.com/solana/${ANKR_API_KEY}',
        priority: 3,
        apiKey: '${ANKR_API_KEY}',
        maxRequestsPerMinute: 150,
        timeout: 20000,
        requiresAuth: true
      }
    ],
    networkOptions: {
      commitment: 'finalized',
      healthCheckInterval: 45000, // 45 seconds
      reconnectStrategy: 'immediate'
    }
  },
  
  // Flow Mainnet Configuration
  flow: {
    networkName: 'Flow Mainnet',
    chainId: 'mainnet',
    providers: [
      {
        url: 'https://rest-mainnet.onflow.org',
        priority: 1,
        maxRequestsPerMinute: 60,
        timeout: 10000,
        requiresAuth: false
      },
      {
        url: 'https://flow-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
        priority: 2,
        apiKey: '${ALCHEMY_API_KEY}',
        maxRequestsPerMinute: 100,
        timeout: 15000,
        requiresAuth: true
      }
    ],
    networkOptions: {
      healthCheckInterval: 60000, // 1 minute
      reconnectStrategy: 'immediate'
    }
  }
};

/**
 * Health monitoring configuration for blockchain connections
 */
export const HEALTH_MONITORING_CONFIG = {
  pingInterval: 30000, // 30 seconds
  timeoutThreshold: 5000, // 5 seconds
  errorThreshold: 3, // Number of consecutive errors before switching provider
  recoveryInterval: 300000, // 5 minutes before trying a failed provider again
  metricsRetention: 86400000, // 24 hours of metrics history
  alertThresholds: {
    highLatency: 2000, // Alert if response time exceeds 2 seconds
    errorRate: 0.1, // Alert if error rate exceeds 10%
    downtime: 60000 // Alert if service is down for more than 1 minute
  }
};

/**
 * Rate limiting configuration to prevent API throttling
 */
export const RATE_LIMITING_CONFIG = {
  defaultCooldown: 1100, // Default cooldown between requests (1.1 seconds)
  burstSize: 5, // Number of requests allowed in a burst
  queueSize: 100, // Maximum size of the request queue
  priorityLevels: {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
  },
  retryStrategy: {
    initialDelay: 1000,
    maxDelay: 60000,
    factor: 2,
    maxRetries: 5
  }
};
# Node Connection Management

This module provides robust connection handling for various blockchain networks including Ethereum, Polygon, Solana, Flow, and other EVM-compatible chains.

## Overview

The Node Connection Management component implements the following features:

- Connection handlers for different blockchains
- Provider management system with fallback mechanisms
- Health checking and automatic rotation
- Rate limit awareness and throttling
- Connection pooling for efficiency
- Secure credentials management

## Architecture

The implementation consists of the following key classes:

### NodeConnectionManager

The main class that manages blockchain node connections. It handles:
- Provider initialization and configuration
- Network management
- Health monitoring
- Provider selection based on health and priority

### ProviderHealthCheck

Implements the `HealthCheck` interface to monitor provider health:
- Performs health checks on providers
- Tracks health history
- Provides status change notifications
- Calculates overall health metrics

### ProviderConnectionPool

Implements the `ConnectionPool` interface to manage provider connections:
- Maintains a pool of providers
- Selects the best available provider
- Handles provider rotation
- Tracks pool status

## Implementation Details

### Health Checking

The health checking system:
- Monitors provider connection status
- Tracks response times and error rates
- Detects rate limiting
- Provides historical health data
- Notifies when provider health status changes

### Connection Pooling

The connection pooling system:
- Maintains a pool of providers for each network
- Selects providers based on health and priority
- Handles provider failover
- Manages connection lifecycle

## Usage Example

```typescript
// Create configuration
const ethereumConfig = {
  networks: {
    mainnet: {
      providers: [
        {
          url: 'https://mainnet.infura.io/v3/your-api-key',
          priority: 1,
          apiKey: 'your-api-key'
        },
        {
          url: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
          priority: 2,
          apiKey: 'your-api-key'
        }
      ],
      chainId: '1',
      networkName: 'mainnet'
    }
  },
  defaultNetwork: 'mainnet',
  healthCheckIntervalMs: 30000 // 30 seconds
};

// Create and initialize connection manager
const connectionManager = new EthereumConnectionManager(ethereumConfig);
await connectionManager.initialize();

// Get a provider
const provider = await connectionManager.getProvider('ethereum', 'mainnet');

// Use the provider
const blockNumber = await provider.getBlockNumber();
console.log(`Current block number: ${blockNumber}`);

// Get provider health
const health = await connectionManager.getProviderHealth(provider.getUrl());
console.log('Provider health:', health);

// Shutdown when done
await connectionManager.shutdown();
```

## Extending for Other Blockchains

To add support for a new blockchain:

1. Create a new provider class that implements the `BlockchainProvider` interface
2. Create a new connection manager class that extends `NodeConnectionManager`
3. Implement the `createProvider` method to create instances of your provider

See `EthereumConnectionManager` and `EthereumProvider` for examples.

## Error Handling

The system includes robust error handling:

- Connection failures are logged and tracked
- Rate limiting is detected and respected
- Circuit breaker pattern prevents cascading failures
- Automatic failover to healthy providers
- Exponential backoff for retries

## Monitoring

The system provides comprehensive monitoring capabilities:

- Provider health status
- Response times
- Error rates
- Rate limit information
- Overall system health
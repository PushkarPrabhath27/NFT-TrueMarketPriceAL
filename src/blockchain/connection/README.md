# Multi-Chain Connection Framework

This module implements a resilient system for connecting to and extracting data from multiple blockchain networks.

## Components

### Node Connection Management

The Node Connection Management component provides robust connection handling for various blockchain networks including Ethereum, Polygon, Solana, Flow, and other EVM-compatible chains. It includes:

- Connection handlers for different blockchains
- Provider management system with fallback mechanisms
- Health checking and automatic rotation
- Rate limit awareness and throttling
- Connection pooling for efficiency
- Secure credentials management

### Directory Structure

```
/connection
  /interfaces
    BlockchainProvider.ts       # Base interface for all blockchain providers
    ConnectionConfig.ts         # Configuration interfaces
    ConnectionPool.ts           # Connection pooling interface
    HealthCheck.ts              # Health checking interface
  /providers
    /ethereum
      EthereumProvider.ts       # Ethereum implementation
      EthereumConfig.ts         # Ethereum-specific configuration
    /polygon
      PolygonProvider.ts        # Polygon implementation
    /solana
      SolanaProvider.ts         # Solana implementation
    /flow
      FlowProvider.ts           # Flow implementation
    /evm
      EVMBaseProvider.ts        # Base for EVM-compatible chains
  /management
    ProviderManager.ts          # Provider management and fallback
    HealthMonitor.ts            # Health checking implementation
    RateLimiter.ts              # Rate limiting implementation
  /utils
    ConnectionUtils.ts          # Utility functions
    CredentialManager.ts        # Secure credential management
```

## Usage

```typescript
// Example usage of the provider manager
import { ProviderManager } from './management/ProviderManager';
import { EthereumConfig } from './providers/ethereum/EthereumConfig';

// Create a provider manager with configuration
const providerManager = new ProviderManager({
  ethereum: {
    mainnet: [
      { url: 'https://mainnet.infura.io/v3/YOUR_API_KEY', priority: 1 },
      { url: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY', priority: 2 }
    ],
    rinkeby: [
      { url: 'https://rinkeby.infura.io/v3/YOUR_API_KEY', priority: 1 }
    ]
  },
  polygon: {
    mainnet: [
      { url: 'https://polygon-rpc.com', priority: 1 },
      { url: 'https://rpc-mainnet.matic.network', priority: 2 }
    ]
  }
});

// Get a provider for a specific blockchain
const ethereumProvider = await providerManager.getProvider('ethereum', 'mainnet');

// Use the provider
const blockNumber = await ethereumProvider.getBlockNumber();
```
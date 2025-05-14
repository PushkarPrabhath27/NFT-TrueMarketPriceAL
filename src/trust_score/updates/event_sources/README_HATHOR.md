# Hathor Event Source Integration

## Overview

The `HathorEventSource` module enables the TrustScore system to process blockchain events from the Hathor network in real-time. This integration captures relevant events like NFT transfers, token movements, and contract executions, mapping them to updates in the TrustScore system.

## Features

- Real-time monitoring of Hathor blockchain events
- Support for NFT transfers, token transfers, and contract executions
- Automatic backfilling of historical events
- Robust error handling and reconnection logic
- Configurable event filtering and processing

## Integration with TrustScore System

The `HathorEventSource` extends the existing event source framework and connects to the TrustScore update pipeline. When events occur on the Hathor network, they are captured, processed, and used to trigger updates to relevant trust scores.

## Usage

### Basic Setup

```typescript
import { HathorEventSource } from '../event_sources/HathorEventSource';

// Configure the Hathor event source
const hathorConfig = {
  network: 'mainnet',
  apiUrl: 'https://node1.hathor.network/v1a/',
  pollingInterval: 10000, // 10 seconds
  enableBackfill: true,
  maxBackfillBlocks: 1000,
  enabledEvents: {
    nftTransfers: true,
    tokenTransfers: true,
    contractExecutions: true
  }
};

// Create and start the Hathor event source
const hathorEventSource = new HathorEventSource(hathorConfig);

// Set up event listeners
hathorEventSource.on('event', (event) => {
  console.log(`Received ${event.eventType} event for ${event.entityType} ${event.entityId}`);
  // Process the event
});

hathorEventSource.on('error', (error) => {
  console.error('Hathor event source error:', error);
});

// Start listening for events
hathorEventSource.start();
```

### Integration with RealTimeUpdateEngine

```typescript
import { TrustScoreEngine } from '../../TrustScoreEngine';
import { TrustScoreUpdateManager } from '../TrustScoreUpdateManager';
import { IncrementalUpdateManager } from '../IncrementalUpdateManager';
import { RealTimeUpdateEngine } from '../RealTimeUpdateEngine';

// Create the core TrustScore components
const trustScoreEngine = new TrustScoreEngine();
const trustScoreUpdateManager = new TrustScoreUpdateManager(trustScoreEngine);
const incrementalUpdateManager = new IncrementalUpdateManager(trustScoreEngine);

// Create the real-time update engine with Hathor support
const updateEngine = new RealTimeUpdateEngine(
  trustScoreUpdateManager,
  incrementalUpdateManager,
  {
    enabledEventSources: {
      blockchain: true,
      fraudDetection: true,
      socialMedia: true,
      marketCondition: true,
      hathor: true // Enable Hathor event source
    },
    hathorEventSourceConfig: hathorConfig,
    // Other engine configurations
  }
);

// Start the update engine
updateEngine.start();
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|--------|
| `network` | Hathor network to connect to ('mainnet', 'testnet', 'nano-testnet') | 'mainnet' |
| `apiUrl` | URL of the Hathor node API | 'https://node1.hathor.network/v1a/' |
| `apiKey` | Optional API key for authenticated access | undefined |
| `pollingInterval` | Interval in milliseconds between polls for new blocks | 10000 |
| `maxRetries` | Maximum number of reconnection attempts | 5 |
| `backoffMultiplier` | Multiplier for exponential backoff on reconnection | 1.5 |
| `enableBackfill` | Whether to backfill historical events on startup | true |
| `maxBackfillBlocks` | Maximum number of blocks to backfill | 1000 |
| `enabledEvents.nftTransfers` | Whether to process NFT transfer events | true |
| `enabledEvents.tokenTransfers` | Whether to process token transfer events | true |
| `enabledEvents.contractExecutions` | Whether to process contract execution events | true |

## Event Types

The `HathorEventSource` emits the following event types:

### NFT Transfers

Emitted when an NFT is transferred from one address to another.

```typescript
{
  eventType: 'nft_transfer',
  entityId: tokenId,
  entityType: 'nft',
  timestamp: blockTimestamp,
  data: {
    from: senderAddress,
    to: recipientAddress,
    tokenId: nftTokenId,
    blockHeight: height,
    transactionHash: txHash
  },
  priority: 8 // High priority
}
```

### Token Transfers

Emitted when tokens are transferred between addresses.

```typescript
{
  eventType: 'token_transfer',
  entityId: tokenId,
  entityType: 'collection',
  timestamp: blockTimestamp,
  data: {
    from: senderAddress,
    to: recipientAddress,
    tokenId: tokenId,
    amount: transferAmount,
    blockHeight: height,
    transactionHash: txHash
  },
  priority: 6 // Medium priority
}
```

### Contract Executions

Emitted when a nano contract is executed.

```typescript
{
  eventType: 'contract_execution',
  entityId: contractId,
  entityType: 'nft',
  timestamp: blockTimestamp,
  data: {
    contractId: contractId,
    method: methodName,
    params: methodParameters,
    result: executionResult,
    blockHeight: height,
    transactionHash: txHash
  },
  priority: 9 // Very high priority
}
```

## Error Handling

The `HathorEventSource` includes robust error handling with automatic reconnection using exponential backoff. It also performs regular health checks to ensure the connection to the Hathor network remains active.

## Examples

See the `HathorEventSourceExample.ts` file in the `examples` directory for a complete example of how to use the `HathorEventSource` with the TrustScore update system.
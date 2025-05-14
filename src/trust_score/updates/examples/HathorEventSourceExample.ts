/**
 * HathorEventSourceExample.ts
 * 
 * Example implementation showing how to integrate the Hathor Event Source
 * with the TrustScore update system to process blockchain events from the Hathor network.
 */

import { TrustScoreEngine } from '../../TrustScoreEngine';
import { TrustScoreUpdateManager } from '../TrustScoreUpdateManager';
import { IncrementalUpdateManager } from '../IncrementalUpdateManager';
import { RealTimeUpdateEngine } from '../RealTimeUpdateEngine';
import { HathorEventSource } from '../event_sources/HathorEventSource';
import { TrustScoreTypes } from '../../types';

/**
 * This example demonstrates how to set up a Hathor event source to listen for
 * blockchain events from the Hathor network and process them through the
 * TrustScore update system.
 */

// Create the core TrustScore components
const trustScoreEngine = new TrustScoreEngine();
const trustScoreUpdateManager = new TrustScoreUpdateManager(trustScoreEngine);
const incrementalUpdateManager = new IncrementalUpdateManager(trustScoreEngine);

// Configure the Hathor event source
const hathorConfig = {
  network: 'mainnet' as const,
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

// Create the real-time update engine with Hathor support
const updateEngine = new RealTimeUpdateEngine(
  trustScoreUpdateManager,
  incrementalUpdateManager,
  {
    // Only enable the Hathor event source for this example
    enabledEventSources: {
      blockchain: false,
      fraudDetection: false,
      socialMedia: false,
      marketCondition: false,
      hathor: true
    },
    // Pass the Hathor configuration
    hathorEventSourceConfig: hathorConfig,
    // Other engine configurations
    maxConcurrentUpdates: 5,
    updateQueueSize: 100
  }
);

// Set up event listeners for the update engine
updateEngine.on('started', () => {
  console.log('Update engine started');
});

updateEngine.on('stopped', () => {
  console.log('Update engine stopped');
});

updateEngine.on('error', (error) => {
  console.error('Update engine error:', error);
});

updateEngine.on('eventProcessed', (event: TrustScoreTypes.UpdateEvent) => {
  console.log(`Processed ${event.eventType} event for ${event.entityType} ${event.entityId}`);
});

// Start the update engine
updateEngine.start();

/**
 * Alternative: Standalone Hathor Event Source
 * 
 * If you prefer to use the Hathor event source directly without the full update engine,
 * you can set it up as follows:
 */

// Create a standalone Hathor event source
const standaloneHathorSource = new HathorEventSource(hathorConfig);

// Set up event listeners
standaloneHathorSource.on('event', (event: TrustScoreTypes.UpdateEvent) => {
  console.log(`Received ${event.eventType} event for ${event.entityType} ${event.entityId}`);
  
  // Process the event manually
  // For example, update the trust score directly
  trustScoreUpdateManager.processEvent(event);
});

standaloneHathorSource.on('error', (error) => {
  console.error('Hathor event source error:', error);
});

standaloneHathorSource.on('started', () => {
  console.log('Hathor event source started');
});

standaloneHathorSource.on('stopped', () => {
  console.log('Hathor event source stopped');
});

standaloneHathorSource.on('backfillCompleted', (data) => {
  console.log(`Backfill completed from block ${data.fromBlock} to ${data.toBlock}`);
});

// Start the standalone event source
// Note: Comment this out if you're using the update engine above
// standaloneHathorSource.start();

/**
 * Example: Processing specific Hathor events
 * 
 * This example shows how to handle specific types of Hathor events
 * and map them to TrustScore updates.
 */

// Example handler for NFT transfer events
function handleNFTTransfer(event: TrustScoreTypes.UpdateEvent): void {
  if (event.eventType === 'nft_transfer') {
    console.log(`NFT transfer detected: ${event.data.tokenId} from ${event.data.from} to ${event.data.to}`);
    
    // Update the NFT's trust score
    trustScoreUpdateManager.processEvent(event);
    
    // You might also want to update the trust scores of the sender and recipient
    const senderEvent: TrustScoreTypes.UpdateEvent = {
      eventType: 'user_activity',
      entityId: event.data.from,
      entityType: 'creator', // Assuming the sender is a creator
      timestamp: event.timestamp,
      data: {
        activityType: 'nft_transfer_out',
        tokenId: event.data.tokenId,
        transactionHash: event.data.transactionHash
      },
      priority: 5 // Medium priority
    };
    
    const recipientEvent: TrustScoreTypes.UpdateEvent = {
      eventType: 'user_activity',
      entityId: event.data.to,
      entityType: 'creator', // Assuming the recipient is a creator
      timestamp: event.timestamp,
      data: {
        activityType: 'nft_transfer_in',
        tokenId: event.data.tokenId,
        transactionHash: event.data.transactionHash
      },
      priority: 5 // Medium priority
    };
    
    trustScoreUpdateManager.processEvent(senderEvent);
    trustScoreUpdateManager.processEvent(recipientEvent);
  }
}

// Example handler for contract execution events
function handleContractExecution(event: TrustScoreTypes.UpdateEvent): void {
  if (event.eventType === 'contract_execution') {
    console.log(`Contract execution detected: ${event.data.contractId}, method: ${event.data.method}`);
    
    // Different handling based on the contract method
    switch (event.data.method) {
      case 'initialize':
        // Handle contract initialization
        console.log('New contract initialized');
        break;
        
      case 'swap':
        // Handle token swap
        console.log('Token swap executed');
        // Update trust scores for involved parties
        break;
        
      case 'get_state':
        // Read-only operation, no trust score impact
        console.log('Contract state queried');
        break;
        
      default:
        console.log(`Unknown contract method: ${event.data.method}`);
    }
    
    // Process the event through the trust score update manager
    trustScoreUpdateManager.processEvent(event);
  }
}

// Register these handlers with the standalone event source
standaloneHathorSource.on('event', (event: TrustScoreTypes.UpdateEvent) => {
  if (event.eventType === 'nft_transfer') {
    handleNFTTransfer(event);
  } else if (event.eventType === 'contract_execution') {
    handleContractExecution(event);
  }
});

/**
 * Cleanup function to properly shut down the event sources
 * Call this when your application is shutting down
 */
function cleanup(): void {
  console.log('Shutting down Hathor event sources...');
  
  // Stop the update engine if it's running
  if (updateEngine) {
    updateEngine.stop();
  }
  
  // Stop the standalone event source if it's running
  if (standaloneHathorSource) {
    standaloneHathorSource.stop();
  }
  
  console.log('Shutdown complete');
}

// Example of handling application shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT signal');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal');
  cleanup();
  process.exit(0);
});
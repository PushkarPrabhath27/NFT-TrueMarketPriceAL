/**
 * BlockchainEventSource.ts
 * 
 * Implements the Blockchain Event Monitoring component of the Real-Time Update System.
 * Responsible for listening to blockchain events such as NFT transfers, sales, minting,
 * contract updates, and creator activities.
 */

import { EventEmitter } from 'events';
import { Provider } from '@ethersproject/providers';
import { EventManager } from '../../../blockchain/events/EventManager';
import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the blockchain event source
 */
export interface BlockchainEventSourceConfig {
  // List of blockchain providers to use for redundancy
  providers: Provider[];
  // Number of confirmations required for finality
  confirmations: number;
  // Polling interval in milliseconds
  pollingInterval: number;
  // Maximum number of retries for failed connections
  maxRetries: number;
  // Backoff multiplier for retry delays
  backoffMultiplier: number;
  // Whether to enable historical event backfilling
  enableBackfill: boolean;
  // Maximum number of blocks to backfill
  maxBackfillBlocks: number;
  // Enabled event types
  enabledEvents: {
    transfers: boolean;
    sales: boolean;
    minting: boolean;
    contractUpdates: boolean;
    creatorActivities: boolean;
  };
}

/**
 * Manages blockchain event monitoring and emits events when relevant changes occur
 */
export class BlockchainEventSource extends EventEmitter {
  private config: BlockchainEventSourceConfig;
  private eventManagers: EventManager[] = [];
  private activeProviderIndex: number = 0;
  private isRunning: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  
  /**
   * Initialize the Blockchain Event Source
   * 
   * @param config Configuration for the blockchain event source
   */
  constructor(config: BlockchainEventSourceConfig) {
    super();
    this.config = this.getDefaultConfig(config);
    this.setupEventManagers();
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<BlockchainEventSourceConfig>): BlockchainEventSourceConfig {
    return {
      providers: [],
      confirmations: 12,
      pollingInterval: 1000,
      maxRetries: 5,
      backoffMultiplier: 1.5,
      enableBackfill: true,
      maxBackfillBlocks: 10000,
      enabledEvents: {
        transfers: true,
        sales: true,
        minting: true,
        contractUpdates: true,
        creatorActivities: true,
        ...config.enabledEvents
      },
      ...config
    };
  }
  
  /**
   * Set up event managers for each provider
   */
  private setupEventManagers(): void {
    if (this.config.providers.length === 0) {
      throw new Error('At least one provider is required for BlockchainEventSource');
    }
    
    // Create event managers for each provider
    this.eventManagers = this.config.providers.map(provider => {
      const eventManager = new EventManager({
        provider,
        confirmations: this.config.confirmations,
        pollingInterval: this.config.pollingInterval,
        maxRetries: this.config.maxRetries,
        backoffMultiplier: this.config.backoffMultiplier,
        enabledEvents: {
          transfer: this.config.enabledEvents.transfers,
          marketplace: this.config.enabledEvents.sales,
          metadata: this.config.enabledEvents.contractUpdates || this.config.enabledEvents.minting
        }
      });
      
      // Set up event listeners
      this.setupEventManagerListeners(eventManager);
      
      return eventManager;
    });
  }
  
  /**
   * Set up listeners for an event manager
   * 
   * @param eventManager The event manager to set up listeners for
   */
  private setupEventManagerListeners(eventManager: EventManager): void {
    // Transfer events (ownership changes)
    eventManager.on('transfer', (eventData: any) => {
      const updateEvent: TrustScoreTypes.UpdateEvent = {
        eventType: 'nft_transfer',
        entityId: `${eventData.contractAddress}-${eventData.tokenId}`,
        entityType: 'nft',
        timestamp: eventData.timestamp,
        data: {
          from: eventData.from,
          to: eventData.to,
          contractAddress: eventData.contractAddress,
          tokenId: eventData.tokenId,
          blockNumber: eventData.blockNumber,
          transactionHash: eventData.transactionHash
        },
        priority: 8 // High priority
      };
      
      this.emit('event', updateEvent);
    });
    
    // Sale events
    eventManager.on('marketplace', (eventData: any) => {
      const updateEvent: TrustScoreTypes.UpdateEvent = {
        eventType: 'nft_sale',
        entityId: `${eventData.contractAddress}-${eventData.tokenId}`,
        entityType: 'nft',
        timestamp: eventData.timestamp,
        data: {
          from: eventData.seller,
          to: eventData.buyer,
          contractAddress: eventData.contractAddress,
          tokenId: eventData.tokenId,
          price: eventData.price,
          marketplace: eventData.marketplace,
          blockNumber: eventData.blockNumber,
          transactionHash: eventData.transactionHash
        },
        priority: 9 // Very high priority
      };
      
      this.emit('event', updateEvent);
      
      // Also emit collection price update event
      const collectionUpdateEvent: TrustScoreTypes.UpdateEvent = {
        eventType: 'collection_price_update',
        entityId: eventData.contractAddress,
        entityType: 'collection',
        timestamp: eventData.timestamp,
        data: {
          contractAddress: eventData.contractAddress,
          tokenId: eventData.tokenId,
          price: eventData.price,
          marketplace: eventData.marketplace
        },
        priority: 7 // Medium-high priority
      };
      
      this.emit('event', collectionUpdateEvent);
    });
    
    // Metadata events (minting, contract updates)
    eventManager.on('metadata', (eventData: any) => {
      if (eventData.isNewToken) {
        // New NFT minting event
        const mintEvent: TrustScoreTypes.UpdateEvent = {
          eventType: 'nft_mint',
          entityId: `${eventData.contractAddress}-${eventData.tokenId}`,
          entityType: 'nft',
          timestamp: eventData.timestamp,
          data: {
            creator: eventData.creator,
            contractAddress: eventData.contractAddress,
            tokenId: eventData.tokenId,
            metadata: eventData.metadata,
            blockNumber: eventData.blockNumber,
            transactionHash: eventData.transactionHash
          },
          priority: 8 // High priority
        };
        
        this.emit('event', mintEvent);
        
        // Also emit creator activity event
        const creatorEvent: TrustScoreTypes.UpdateEvent = {
          eventType: 'creator_activity',
          entityId: eventData.creator,
          entityType: 'creator',
          timestamp: eventData.timestamp,
          data: {
            activityType: 'mint',
            contractAddress: eventData.contractAddress,
            tokenId: eventData.tokenId
          },
          priority: 6 // Medium priority
        };
        
        this.emit('event', creatorEvent);
      } else {
        // Contract update event
        const contractUpdateEvent: TrustScoreTypes.UpdateEvent = {
          eventType: 'contract_update',
          entityId: eventData.contractAddress,
          entityType: 'collection',
          timestamp: eventData.timestamp,
          data: {
            contractAddress: eventData.contractAddress,
            updateType: eventData.updateType,
            blockNumber: eventData.blockNumber,
            transactionHash: eventData.transactionHash
          },
          priority: 7 // Medium-high priority
        };
        
        this.emit('event', contractUpdateEvent);
      }
    });
    
    // Error handling
    eventManager.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }
  
  /**
   * Start listening for blockchain events
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.reconnectAttempts = 0;
    
    // Start the active event manager
    this.startActiveEventManager();
    
    // Set up health check interval
    this.healthCheckInterval = setInterval(() => {
      this.checkProviderHealth();
    }, 30000); // Check every 30 seconds
    
    // Backfill historical events if enabled
    if (this.config.enableBackfill) {
      this.backfillHistoricalEvents();
    }
    
    this.emit('started');
  }
  
  /**
   * Start the currently active event manager
   */
  private startActiveEventManager(): void {
    const activeManager = this.eventManagers[this.activeProviderIndex];
    activeManager.startListening();
  }
  
  /**
   * Check the health of the current provider and switch if necessary
   */
  private async checkProviderHealth(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    try {
      const activeProvider = this.config.providers[this.activeProviderIndex];
      const blockNumber = await activeProvider.getBlockNumber();
      
      // Reset reconnect attempts on successful health check
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Provider health check failed:', error);
      this.switchToNextProvider();
    }
  }
  
  /**
   * Switch to the next available provider
   */
  private switchToNextProvider(): void {
    if (!this.isRunning) {
      return;
    }
    
    // Stop the current event manager
    const currentManager = this.eventManagers[this.activeProviderIndex];
    currentManager.stopListening();
    
    // Switch to the next provider
    this.activeProviderIndex = (this.activeProviderIndex + 1) % this.eventManagers.length;
    
    // Start the new event manager with exponential backoff
    this.reconnectAttempts++;
    const delay = Math.min(
      30000, // Max 30 seconds
      1000 * Math.pow(this.config.backoffMultiplier, this.reconnectAttempts)
    );
    
    this.reconnectTimeout = setTimeout(() => {
      this.startActiveEventManager();
    }, delay);
    
    this.emit('providerSwitched', {
      newProviderIndex: this.activeProviderIndex,
      reconnectAttempts: this.reconnectAttempts,
      reconnectDelay: delay
    });
  }
  
  /**
   * Backfill historical events
   */
  private async backfillHistoricalEvents(): Promise<void> {
    try {
      const activeProvider = this.config.providers[this.activeProviderIndex];
      const currentBlock = await activeProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - this.config.maxBackfillBlocks);
      
      // Use the active event manager to backfill events
      const activeManager = this.eventManagers[this.activeProviderIndex];
      activeManager.backfillEvents(fromBlock, currentBlock);
      
      this.emit('backfillStarted', { fromBlock, toBlock: currentBlock });
    } catch (error) {
      console.error('Error starting backfill:', error);
      this.emit('error', { source: 'backfill', error });
    }
  }
  
  /**
   * Stop listening for blockchain events
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Stop all event managers
    this.eventManagers.forEach(manager => {
      manager.stopListening();
    });
    
    // Clear intervals and timeouts
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    
    this.emit('stopped');
  }
  
  /**
   * Get the current status of the blockchain event source
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      activeProviderIndex: this.activeProviderIndex,
      reconnectAttempts: this.reconnectAttempts,
      providerCount: this.eventManagers.length,
      enabledEvents: this.config.enabledEvents
    };
  }
}
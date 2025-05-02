/**
 * EventProcessingExample.ts
 * 
 * Example implementation of the Event Processing and Routing system.
 * This file demonstrates how to set up and use the event processing components
 * to handle real-time updates for NFT trust scores.
 */

import { EventEmitter } from 'events';
import { TrustScoreTypes } from '../../../types';
import { 
  EventProcessingSystem,
  EventClassifier, 
  EventPrioritizer,
  ProcessingQueueManager,
  EventRouter,
  EventDispatcher,
  EventHandlerFunction
} from '../index';

/**
 * Example class that demonstrates the usage of the Event Processing System
 */
export class EventProcessingExample extends EventEmitter {
  private eventProcessingSystem: EventProcessingSystem;
  
  /**
   * Initialize the example
   */
  constructor() {
    super();
    
    // Initialize the event processing system with custom configuration
    this.eventProcessingSystem = new EventProcessingSystem({
      classifierConfig: {
        enableDetailedClassification: true,
        enableImpactAssessment: true,
        enableDependencyIdentification: true
      },
      prioritizerConfig: {
        enableDynamicPriority: true
      },
      queueManagerConfig: {
        enableBatching: true,
        enableDeduplication: true,
        enableConflation: true,
        maxQueueSize: 5000,
        partitionCount: 4
      },
      routerConfig: {
        enableSmartRouting: true
      },
      dispatcherConfig: {
        enableRuleBasedRouting: true,
        enableLoadBalancing: true,
        enableAffinityRouting: true
      }
    });
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Register handlers
    this.registerEventHandlers();
  }
  
  /**
   * Set up event listeners for the event processing system
   */
  private setupEventListeners(): void {
    // Listen for events from the event processing system
    this.eventProcessingSystem.on('event_processed', (data) => {
      console.log(`Event processed: ${data.event.id}`);
    });
    
    this.eventProcessingSystem.on('event_enqueued', (data) => {
      console.log(`Event enqueued: ${data.event.id} in topic ${data.topic}`);
    });
    
    this.eventProcessingSystem.on('event_pipeline_complete', (data) => {
      console.log(`Event pipeline complete: ${data.event.id}`);
      console.log(`  Classification: ${data.classification.eventCategory}`);
      console.log(`  Impact Score: ${data.classification.impactScore}`);
      console.log(`  Urgency Level: ${data.classification.urgencyLevel}`);
      console.log(`  Should Update: ${data.routingResult.shouldUpdate}`);
      console.log(`  Should Notify: ${data.routingResult.shouldNotify}`);
    });
    
    this.eventProcessingSystem.on('event_pipeline_error', (data) => {
      console.error(`Event pipeline error: ${data.event.id}`);
      console.error(`  Error: ${data.error}`);
    });
    
    this.eventProcessingSystem.on('event_dispatched', (data) => {
      console.log(`Event dispatched: ${data.event.id} to handler ${data.handlerId}`);
      console.log(`  Synchronous: ${data.synchronous}`);
    });
    
    this.eventProcessingSystem.on('dispatch_error', (data) => {
      console.error(`Dispatch error: ${data.event.id}`);
      console.error(`  Handler: ${data.handlerId}`);
      console.error(`  Error: ${data.error}`);
    });
  }
  
  /**
   * Register event handlers for different event types
   */
  private registerEventHandlers(): void {
    // Register handler for blockchain events
    this.eventProcessingSystem.registerHandler(
      'blockchain-handler',
      ['nft_transfer', 'nft_sale', 'nft_mint', 'contract_update'],
      ['nft', 'collection', 'creator'],
      this.createBlockchainEventHandler(),
      { priority: 8, requiresSync: true }
    );
    
    // Register handler for fraud detection events
    this.eventProcessingSystem.registerHandler(
      'fraud-detection-handler',
      ['fraud_image_analysis', 'fraud_similarity_score', 'fraud_wash_trading', 'fraud_metadata_validation'],
      ['nft', 'collection'],
      this.createFraudDetectionEventHandler(),
      { priority: 9 }
    );
    
    // Register handler for social media events
    this.eventProcessingSystem.registerHandler(
      'social-media-handler',
      ['social_mention_frequency', 'social_sentiment_shift', 'social_follower_change', 'social_creator_announcement', 'social_community_growth'],
      ['nft', 'collection', 'creator'],
      this.createSocialMediaEventHandler(),
      { priority: 5 }
    );
    
    // Register handler for market condition events
    this.eventProcessingSystem.registerHandler(
      'market-condition-handler',
      ['market_floor_price_change', 'market_volume_anomaly', 'market_trend_shift', 'market_similar_nft_sale', 'market_creator_portfolio_change'],
      ['nft', 'collection', 'creator', 'market'],
      this.createMarketConditionEventHandler(),
      { priority: 7 }
    );
    
    // Register handler for notification events
    this.eventProcessingSystem.registerHandler(
      'notification-handler',
      ['notification_nft_transfer', 'notification_nft_sale', 'notification_fraud_wash_trading', 'notification_market_floor_price_change'],
      ['nft', 'collection', 'creator'],
      this.createNotificationEventHandler(),
      { priority: 6 }
    );
  }
  
  /**
   * Create a handler for blockchain events
   * 
   * @returns Event handler function
   */
  private createBlockchainEventHandler(): EventHandlerFunction {
    return async (event: TrustScoreTypes.UpdateEvent): Promise<void> => {
      // In a real implementation, this would update trust scores based on blockchain events
      console.log(`Processing blockchain event: ${event.eventType} for ${event.entityType} ${event.entityId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log(`Blockchain event processed: ${event.id}`);
    };
  }
  
  /**
   * Create a handler for fraud detection events
   * 
   * @returns Event handler function
   */
  private createFraudDetectionEventHandler(): EventHandlerFunction {
    return async (event: TrustScoreTypes.UpdateEvent): Promise<void> => {
      // In a real implementation, this would update trust scores based on fraud detection events
      console.log(`Processing fraud detection event: ${event.eventType} for ${event.entityType} ${event.entityId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 75));
      
      console.log(`Fraud detection event processed: ${event.id}`);
    };
  }
  
  /**
   * Create a handler for social media events
   * 
   * @returns Event handler function
   */
  private createSocialMediaEventHandler(): EventHandlerFunction {
    return async (event: TrustScoreTypes.UpdateEvent): Promise<void> => {
      // In a real implementation, this would update trust scores based on social media events
      console.log(`Processing social media event: ${event.eventType} for ${event.entityType} ${event.entityId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 30));
      
      console.log(`Social media event processed: ${event.id}`);
    };
  }
  
  /**
   * Create a handler for market condition events
   * 
   * @returns Event handler function
   */
  private createMarketConditionEventHandler(): EventHandlerFunction {
    return async (event: TrustScoreTypes.UpdateEvent): Promise<void> => {
      // In a real implementation, this would update trust scores based on market condition events
      console.log(`Processing market condition event: ${event.eventType} for ${event.entityType} ${event.entityId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 60));
      
      console.log(`Market condition event processed: ${event.id}`);
    };
  }
  
  /**
   * Create a handler for notification events
   * 
   * @returns Event handler function
   */
  private createNotificationEventHandler(): EventHandlerFunction {
    return async (event: TrustScoreTypes.UpdateEvent): Promise<void> => {
      // In a real implementation, this would send notifications to users
      console.log(`Processing notification event: ${event.eventType} for ${event.entityType} ${event.entityId}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 20));
      
      console.log(`Notification event processed: ${event.id}`);
    };
  }
  
  /**
   * Process a sample event
   * 
   * @param eventType The event type
   * @param entityType The entity type
   * @param entityId The entity ID
   * @param data Additional event data
   */
  public async processSampleEvent(eventType: string, entityType: string, entityId: string, data: any = {}): Promise<void> {
    // Create a sample event
    const event: TrustScoreTypes.UpdateEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType,
      entityType,
      entityId,
      source: this.getSourceFromEventType(eventType),
      data
    };
    
    // Process the event
    await this.eventProcessingSystem.processEvent(event);
  }
  
  /**
   * Get the source from an event type
   * 
   * @param eventType The event type
   * @returns The source
   */
  private getSourceFromEventType(eventType: string): string {
    if (eventType.startsWith('nft_') || eventType.startsWith('contract_') || eventType.startsWith('creator_') || eventType.startsWith('collection_')) {
      return 'blockchain';
    } else if (eventType.startsWith('fraud_')) {
      return 'fraudDetection';
    } else if (eventType.startsWith('social_')) {
      return 'socialMedia';
    } else if (eventType.startsWith('market_')) {
      return 'marketCondition';
    } else if (eventType.startsWith('notification_')) {
      return 'notification';
    } else {
      return 'unknown';
    }
  }
  
  /**
   * Run a demo of the event processing system
   */
  public async runDemo(): Promise<void> {
    console.log('Starting Event Processing System Demo');
    console.log('====================================');
    
    // Process a blockchain event
    await this.processSampleEvent('nft_sale', 'nft', 'nft123', {
      price: 1.5,
      buyer: 'wallet456',
      seller: 'wallet789',
      marketplace: 'opensea'
    });
    
    // Process a fraud detection event
    await this.processSampleEvent('fraud_wash_trading', 'nft', 'nft123', {
      confidence: 0.85,
      relatedTransactions: ['tx1', 'tx2', 'tx3'],
      detectionMethod: 'pattern_analysis'
    });
    
    // Process a social media event
    await this.processSampleEvent('social_sentiment_shift', 'collection', 'collection456', {
      previousSentiment: 0.6,
      currentSentiment: 0.2,
      sentimentShift: -0.4,
      platform: 'twitter'
    });
    
    // Process a market condition event
    await this.processSampleEvent('market_floor_price_change', 'collection', 'collection456', {
      previousFloorPrice: 1.2,
      currentFloorPrice: 0.8,
      priceChange: -0.4,
      percentageChange: -33.33
    });
    
    console.log('====================================');
    console.log('Event Processing System Demo Complete');
  }
}

// Example usage
if (require.main === module) {
  const example = new EventProcessingExample();
  example.runDemo().catch(console.error);
}
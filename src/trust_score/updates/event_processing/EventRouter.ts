/**
 * EventRouter.ts
 * 
 * Implements the event routing component of the Real-Time Update System.
 * Responsible for determining how events should be processed based on their type,
 * content, and system configuration.
 */

import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the event router
 */
export interface EventRouterConfig {
  // Thresholds for different event types (0-1 where 1 means always update)
  updateThresholds: Record<string, number>;
  // Thresholds for notification generation (0-1 where 1 means always notify)
  notificationThresholds: Record<string, number>;
  // Whether to enable smart routing based on event content
  enableSmartRouting: boolean;
  // Cooldown periods for different entity types (in milliseconds)
  cooldownPeriods: Record<string, number>;
}

/**
 * Result of event routing decision
 */
export interface RoutingResult {
  // Whether the event should trigger an update
  shouldUpdate: boolean;
  // Whether the event should generate a notification
  shouldNotify: boolean;
  // The priority of the update (0-10, where 10 is highest)
  updatePriority?: number;
  // The priority of the notification (0-10, where 10 is highest)
  notificationPriority?: number;
}

/**
 * Manages event routing to determine how events should be processed
 */
export class EventRouter {
  private config: EventRouterConfig;
  private lastUpdateTimes: Map<string, number> = new Map();
  
  /**
   * Initialize the Event Router
   * 
   * @param config Configuration for the event router
   */
  constructor(config: Partial<EventRouterConfig> = {}) {
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<EventRouterConfig>): EventRouterConfig {
    return {
      updateThresholds: {
        // Blockchain events
        nft_transfer: 1.0, // Always update on transfers
        nft_sale: 1.0, // Always update on sales
        nft_mint: 1.0, // Always update on mints
        contract_update: 0.8,
        creator_activity: 0.7,
        collection_price_update: 0.9,
        
        // Fraud detection events
        fraud_image_analysis: 0.9,
        fraud_similarity_score: 0.8,
        fraud_wash_trading: 1.0, // Always update on wash trading
        fraud_metadata_validation: 0.7,
        
        // Social media events
        social_mention_frequency: 0.5,
        social_sentiment_shift: 0.7,
        social_follower_change: 0.4,
        social_creator_announcement: 0.8,
        social_community_growth: 0.6,
        
        // Market condition events
        market_floor_price_change: 0.8,
        market_volume_anomaly: 0.7,
        market_trend_shift: 0.6,
        market_similar_nft_sale: 0.7,
        market_creator_portfolio_change: 0.6,
        
        // Default for unknown event types
        default: 0.5
      },
      notificationThresholds: {
        // Blockchain events
        nft_transfer: 0.7,
        nft_sale: 0.8,
        nft_mint: 0.6,
        contract_update: 0.5,
        creator_activity: 0.4,
        collection_price_update: 0.6,
        
        // Fraud detection events
        fraud_image_analysis: 0.8,
        fraud_similarity_score: 0.6,
        fraud_wash_trading: 0.9,
        fraud_metadata_validation: 0.5,
        
        // Social media events
        social_mention_frequency: 0.3,
        social_sentiment_shift: 0.6,
        social_follower_change: 0.2,
        social_creator_announcement: 0.7,
        social_community_growth: 0.4,
        
        // Market condition events
        market_floor_price_change: 0.7,
        market_volume_anomaly: 0.6,
        market_trend_shift: 0.5,
        market_similar_nft_sale: 0.4,
        market_creator_portfolio_change: 0.3,
        
        // Default for unknown event types
        default: 0.3
      },
      enableSmartRouting: true,
      cooldownPeriods: {
        nft: 60000, // 1 minute
        collection: 300000, // 5 minutes
        creator: 600000, // 10 minutes
        market: 900000 // 15 minutes
      },
      ...config
    };
  }
  
  /**
   * Route an event to determine how it should be processed
   * 
   * @param event The event to route
   * @returns The routing result
   */
  public route(event: TrustScoreTypes.UpdateEvent): RoutingResult {
    // Check cooldown period
    if (this.isInCooldownPeriod(event)) {
      return {
        shouldUpdate: false,
        shouldNotify: false
      };
    }
    
    // Get base thresholds for event type
    const updateThreshold = this.getUpdateThreshold(event.eventType);
    const notificationThreshold = this.getNotificationThreshold(event.eventType);
    
    // Apply smart routing if enabled
    let adjustedUpdateThreshold = updateThreshold;
    let adjustedNotificationThreshold = notificationThreshold;
    
    if (this.config.enableSmartRouting) {
      const adjustments = this.calculateSmartRoutingAdjustments(event);
      adjustedUpdateThreshold -= adjustments.updateThresholdReduction;
      adjustedNotificationThreshold -= adjustments.notificationThresholdReduction;
    }
    
    // Make routing decisions
    const shouldUpdate = Math.random() < adjustedUpdateThreshold;
    const shouldNotify = shouldUpdate && Math.random() < adjustedNotificationThreshold;
    
    // Update last update time if updating
    if (shouldUpdate) {
      this.lastUpdateTimes.set(this.getEntityKey(event), Date.now());
    }
    
    return {
      shouldUpdate,
      shouldNotify,
      updatePriority: event.priority,
      notificationPriority: shouldNotify ? this.calculateNotificationPriority(event) : undefined
    };
  }
  
  /**
   * Check if an entity is in its cooldown period
   * 
   * @param event The event to check
   * @returns Whether the entity is in cooldown
   */
  private isInCooldownPeriod(event: TrustScoreTypes.UpdateEvent): boolean {
    const entityKey = this.getEntityKey(event);
    const lastUpdateTime = this.lastUpdateTimes.get(entityKey);
    
    if (!lastUpdateTime) {
      return false;
    }
    
    const cooldownPeriod = this.config.cooldownPeriods[event.entityType] || 0;
    const now = Date.now();
    
    return now - lastUpdateTime < cooldownPeriod;
  }
  
  /**
   * Get a unique key for an entity
   * 
   * @param event The event containing entity information
   * @returns A unique entity key
   */
  private getEntityKey(event: TrustScoreTypes.UpdateEvent): string {
    return `${event.entityType}-${event.entityId}`;
  }
  
  /**
   * Get the update threshold for an event type
   * 
   * @param eventType The event type
   * @returns The update threshold
   */
  private getUpdateThreshold(eventType: string): number {
    return this.config.updateThresholds[eventType] || this.config.updateThresholds.default;
  }
  
  /**
   * Get the notification threshold for an event type
   * 
   * @param eventType The event type
   * @returns The notification threshold
   */
  private getNotificationThreshold(eventType: string): number {
    return this.config.notificationThresholds[eventType] || this.config.notificationThresholds.default;
  }
  
  /**
   * Calculate smart routing adjustments based on event content
   * 
   * @param event The event to analyze
   * @returns Threshold reductions for update and notification
   */
  private calculateSmartRoutingAdjustments(event: TrustScoreTypes.UpdateEvent): {
    updateThresholdReduction: number;
    notificationThresholdReduction: number;
  } {
    let updateThresholdReduction = 0;
    let notificationThresholdReduction = 0;
    
    // Check for specific conditions based on event type
    switch (event.eventType) {
      case 'nft_sale':
        // Reduce thresholds for high-value sales
        if (event.data?.price && event.data.price > 10) {
          updateThresholdReduction += 0.2;
          notificationThresholdReduction += 0.3;
        }
        break;
      
      case 'fraud_wash_trading':
        // Reduce thresholds for high-confidence fraud detections
        if (event.data?.confidence && event.data.confidence > 0.8) {
          updateThresholdReduction += 0.3;
          notificationThresholdReduction += 0.4;
        }
        break;
      
      case 'social_sentiment_shift':
        // Reduce thresholds for major sentiment shifts
        if (event.data?.magnitude && event.data.magnitude > 0.5) {
          updateThresholdReduction += 0.2;
          notificationThresholdReduction += 0.2;
        }
        break;
      
      case 'market_floor_price_change':
        // Reduce thresholds for significant price changes
        if (event.data?.percentageChange && Math.abs(event.data.percentageChange) > 20) {
          updateThresholdReduction += 0.2;
          notificationThresholdReduction += 0.3;
        }
        break;
    }
    
    // Ensure reductions don't exceed thresholds
    updateThresholdReduction = Math.min(updateThresholdReduction, this.getUpdateThreshold(event.eventType));
    notificationThresholdReduction = Math.min(notificationThresholdReduction, this.getNotificationThreshold(event.eventType));
    
    return {
      updateThresholdReduction,
      notificationThresholdReduction
    };
  }
  
  /**
   * Calculate the priority of a notification
   * 
   * @param event The event that triggered the notification
   * @returns The notification priority
   */
  private calculateNotificationPriority(event: TrustScoreTypes.UpdateEvent): number {
    // Start with event priority
    let priority = event.priority || 5;
    
    // Adjust based on event type
    switch (event.eventType) {
      case 'fraud_wash_trading':
      case 'fraud_image_analysis':
        // Fraud events get higher notification priority
        priority += 1;
        break;
      
      case 'nft_sale':
      case 'market_floor_price_change':
        // Price-related events get higher notification priority
        priority += 0.5;
        break;
    }
    
    // Ensure priority is within valid range (0-10)
    return Math.max(0, Math.min(10, priority));
  }
}
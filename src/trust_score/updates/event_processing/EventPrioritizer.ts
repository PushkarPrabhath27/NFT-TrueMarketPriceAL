/**
 * EventPrioritizer.ts
 * 
 * Implements the event prioritization component of the Real-Time Update System.
 * Responsible for assigning priorities to events based on their type, source,
 * and content to ensure the most important updates are processed first.
 */

import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the event prioritizer
 */
export interface EventPrioritizerConfig {
  // Base priorities for different event types (0-10, where 10 is highest)
  basePriorities: Record<string, number>;
  // Priority modifiers for different entity types
  entityTypeModifiers: Record<string, number>;
  // Priority modifiers for different event sources
  sourceModifiers: Record<string, number>;
  // Whether to use dynamic priority adjustment based on event content
  enableDynamicPriority: boolean;
  // Threshold for significant price changes (percentage)
  significantPriceChangeThreshold: number;
  // Threshold for significant fraud detection confidence
  significantFraudConfidenceThreshold: number;
}

/**
 * Manages event prioritization to ensure the most important updates are processed first
 */
export class EventPrioritizer {
  private config: EventPrioritizerConfig;
  
  /**
   * Initialize the Event Prioritizer
   * 
   * @param config Configuration for the event prioritizer
   */
  constructor(config: Partial<EventPrioritizerConfig> = {}) {
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<EventPrioritizerConfig>): EventPrioritizerConfig {
    return {
      basePriorities: {
        // Blockchain events
        nft_transfer: 7,
        nft_sale: 8,
        nft_mint: 7,
        contract_update: 6,
        creator_activity: 5,
        collection_price_update: 6,
        
        // Fraud detection events
        fraud_image_analysis: 7,
        fraud_similarity_score: 6,
        fraud_wash_trading: 8,
        fraud_metadata_validation: 5,
        
        // Social media events
        social_mention_frequency: 4,
        social_sentiment_shift: 5,
        social_follower_change: 3,
        social_creator_announcement: 6,
        social_community_growth: 4,
        
        // Market condition events
        market_floor_price_change: 7,
        market_volume_anomaly: 6,
        market_trend_shift: 5,
        market_similar_nft_sale: 6,
        market_creator_portfolio_change: 5,
        
        // Default for unknown event types
        default: 5
      },
      entityTypeModifiers: {
        nft: 0,
        collection: -1,
        creator: -1,
        market: -2
      },
      sourceModifiers: {
        blockchain: 1,
        fraudDetection: 0,
        socialMedia: -1,
        marketCondition: 0
      },
      enableDynamicPriority: true,
      significantPriceChangeThreshold: 20, // 20% change
      significantFraudConfidenceThreshold: 0.8, // 80% confidence
      ...config
    };
  }
  
  /**
   * Prioritize an event based on its type, source, and content
   * 
   * @param event The event to prioritize
   * @returns The event with an assigned priority
   */
  public prioritize(event: TrustScoreTypes.UpdateEvent): TrustScoreTypes.UpdateEvent {
    // Start with base priority for event type
    let priority = this.getBasePriority(event.eventType);
    
    // Apply entity type modifier
    priority += this.getEntityTypeModifier(event.entityType);
    
    // Apply source modifier
    if (event.source) {
      priority += this.getSourceModifier(event.source);
    }
    
    // Apply dynamic priority adjustment if enabled
    if (this.config.enableDynamicPriority) {
      priority += this.calculateDynamicPriorityModifier(event);
    }
    
    // Ensure priority is within valid range (0-10)
    priority = Math.max(0, Math.min(10, priority));
    
    // Return event with assigned priority
    return {
      ...event,
      priority
    };
  }
  
  /**
   * Get the base priority for an event type
   * 
   * @param eventType The event type
   * @returns The base priority
   */
  private getBasePriority(eventType: string): number {
    return this.config.basePriorities[eventType] || this.config.basePriorities.default;
  }
  
  /**
   * Get the priority modifier for an entity type
   * 
   * @param entityType The entity type
   * @returns The priority modifier
   */
  private getEntityTypeModifier(entityType: string): number {
    return this.config.entityTypeModifiers[entityType] || 0;
  }
  
  /**
   * Get the priority modifier for an event source
   * 
   * @param source The event source
   * @returns The priority modifier
   */
  private getSourceModifier(source: string): number {
    return this.config.sourceModifiers[source] || 0;
  }
  
  /**
   * Calculate a dynamic priority modifier based on event content
   * 
   * @param event The event to analyze
   * @returns The dynamic priority modifier
   */
  private calculateDynamicPriorityModifier(event: TrustScoreTypes.UpdateEvent): number {
    let modifier = 0;
    
    // Check for specific conditions based on event type
    switch (event.eventType) {
      case 'nft_sale':
        // Prioritize high-value sales
        if (event.data?.price && event.data.price > 10) {
          modifier += 1;
        }
        break;
      
      case 'collection_price_update':
      case 'market_floor_price_change':
        // Prioritize significant price changes
        if (event.data?.percentageChange && 
            Math.abs(event.data.percentageChange) >= this.config.significantPriceChangeThreshold) {
          modifier += 1;
        }
        break;
      
      case 'fraud_wash_trading':
      case 'fraud_image_analysis':
        // Prioritize high-confidence fraud detections
        if (event.data?.confidence && 
            event.data.confidence >= this.config.significantFraudConfidenceThreshold) {
          modifier += 2;
        }
        break;
      
      case 'social_sentiment_shift':
        // Prioritize major sentiment shifts
        if (event.data?.magnitude && event.data.magnitude > 0.5) {
          modifier += 1;
        }
        break;
      
      case 'market_volume_anomaly':
        // Prioritize extreme volume anomalies
        if (event.data?.standardDeviations && event.data.standardDeviations > 3) {
          modifier += 1;
        }
        break;
    }
    
    return modifier;
  }
}
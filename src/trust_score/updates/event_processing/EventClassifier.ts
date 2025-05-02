/**
 * EventClassifier.ts
 * 
 * Implements the event classification component of the Real-Time Update System.
 * Responsible for categorizing events, mapping their entity associations,
 * and assessing their impact for prioritization.
 */

import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the event classifier
 */
export interface EventClassifierConfig {
  // Whether to enable detailed classification
  enableDetailedClassification: boolean;
  // Whether to enable impact assessment
  enableImpactAssessment: boolean;
  // Whether to enable dependency identification
  enableDependencyIdentification: boolean;
  // Threshold for high impact events (0-1)
  highImpactThreshold: number;
  // Threshold for medium impact events (0-1)
  mediumImpactThreshold: number;
}

/**
 * Event classification result
 */
export interface ClassificationResult {
  // Original event
  event: TrustScoreTypes.UpdateEvent;
  // Classified event type category
  eventCategory: string;
  // Associated entity types
  entityAssociations: string[];
  // Impact assessment score (0-1)
  impactScore: number;
  // Urgency level (high, medium, low)
  urgencyLevel: string;
  // Dependencies for processing
  dependencies: string[];
}

/**
 * Manages event classification to determine event characteristics
 */
export class EventClassifier {
  private config: EventClassifierConfig;
  
  // Event type category mappings
  private eventTypeCategories: Map<string, string> = new Map();
  
  // Entity association mappings
  private entityAssociationMappings: Map<string, string[]> = new Map();
  
  // Event type impact scores
  private eventTypeImpactScores: Map<string, number> = new Map();
  
  // Event type urgency levels
  private eventTypeUrgencyLevels: Map<string, string> = new Map();
  
  // Event type dependencies
  private eventTypeDependencies: Map<string, string[]> = new Map();
  
  /**
   * Initialize the Event Classifier
   * 
   * @param config Configuration for the event classifier
   */
  constructor(config: Partial<EventClassifierConfig> = {}) {
    this.config = this.getDefaultConfig(config);
    this.initializeClassificationMappings();
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<EventClassifierConfig>): EventClassifierConfig {
    return {
      enableDetailedClassification: true,
      enableImpactAssessment: true,
      enableDependencyIdentification: true,
      highImpactThreshold: 0.7,
      mediumImpactThreshold: 0.4,
      ...config
    };
  }
  
  /**
   * Initialize classification mappings
   */
  private initializeClassificationMappings(): void {
    // Initialize event type categories
    this.initializeEventTypeCategories();
    
    // Initialize entity association mappings
    this.initializeEntityAssociationMappings();
    
    // Initialize event type impact scores
    this.initializeEventTypeImpactScores();
    
    // Initialize event type urgency levels
    this.initializeEventTypeUrgencyLevels();
    
    // Initialize event type dependencies
    this.initializeEventTypeDependencies();
  }
  
  /**
   * Initialize event type categories
   */
  private initializeEventTypeCategories(): void {
    // Blockchain events
    this.eventTypeCategories.set('nft_transfer', 'ownership_change');
    this.eventTypeCategories.set('nft_sale', 'market_activity');
    this.eventTypeCategories.set('nft_mint', 'creation_activity');
    this.eventTypeCategories.set('contract_update', 'metadata_change');
    this.eventTypeCategories.set('creator_activity', 'creation_activity');
    this.eventTypeCategories.set('collection_price_update', 'market_activity');
    
    // Fraud detection events
    this.eventTypeCategories.set('fraud_image_analysis', 'risk_assessment');
    this.eventTypeCategories.set('fraud_similarity_score', 'risk_assessment');
    this.eventTypeCategories.set('fraud_wash_trading', 'market_manipulation');
    this.eventTypeCategories.set('fraud_metadata_validation', 'metadata_change');
    
    // Social media events
    this.eventTypeCategories.set('social_mention_frequency', 'social_activity');
    this.eventTypeCategories.set('social_sentiment_shift', 'social_activity');
    this.eventTypeCategories.set('social_follower_change', 'social_activity');
    this.eventTypeCategories.set('social_creator_announcement', 'creator_activity');
    this.eventTypeCategories.set('social_community_growth', 'social_activity');
    
    // Market condition events
    this.eventTypeCategories.set('market_floor_price_change', 'market_activity');
    this.eventTypeCategories.set('market_volume_anomaly', 'market_activity');
    this.eventTypeCategories.set('market_trend_shift', 'market_activity');
    this.eventTypeCategories.set('market_similar_nft_sale', 'market_activity');
    this.eventTypeCategories.set('market_creator_portfolio_change', 'creator_activity');
  }
  
  /**
   * Initialize entity association mappings
   */
  private initializeEntityAssociationMappings(): void {
    // Blockchain events
    this.entityAssociationMappings.set('nft_transfer', ['nft', 'collection', 'creator']);
    this.entityAssociationMappings.set('nft_sale', ['nft', 'collection', 'creator']);
    this.entityAssociationMappings.set('nft_mint', ['nft', 'collection', 'creator']);
    this.entityAssociationMappings.set('contract_update', ['collection']);
    this.entityAssociationMappings.set('creator_activity', ['creator']);
    this.entityAssociationMappings.set('collection_price_update', ['collection']);
    
    // Fraud detection events
    this.entityAssociationMappings.set('fraud_image_analysis', ['nft']);
    this.entityAssociationMappings.set('fraud_similarity_score', ['nft', 'collection']);
    this.entityAssociationMappings.set('fraud_wash_trading', ['nft', 'collection', 'creator']);
    this.entityAssociationMappings.set('fraud_metadata_validation', ['nft', 'collection']);
    
    // Social media events
    this.entityAssociationMappings.set('social_mention_frequency', ['nft', 'collection', 'creator']);
    this.entityAssociationMappings.set('social_sentiment_shift', ['nft', 'collection', 'creator']);
    this.entityAssociationMappings.set('social_follower_change', ['creator']);
    this.entityAssociationMappings.set('social_creator_announcement', ['creator']);
    this.entityAssociationMappings.set('social_community_growth', ['collection']);
    
    // Market condition events
    this.entityAssociationMappings.set('market_floor_price_change', ['collection']);
    this.entityAssociationMappings.set('market_volume_anomaly', ['collection', 'market']);
    this.entityAssociationMappings.set('market_trend_shift', ['market']);
    this.entityAssociationMappings.set('market_similar_nft_sale', ['nft', 'collection']);
    this.entityAssociationMappings.set('market_creator_portfolio_change', ['creator']);
  }
  
  /**
   * Initialize event type impact scores
   */
  private initializeEventTypeImpactScores(): void {
    // Blockchain events
    this.eventTypeImpactScores.set('nft_transfer', 0.7);
    this.eventTypeImpactScores.set('nft_sale', 0.8);
    this.eventTypeImpactScores.set('nft_mint', 0.6);
    this.eventTypeImpactScores.set('contract_update', 0.5);
    this.eventTypeImpactScores.set('creator_activity', 0.4);
    this.eventTypeImpactScores.set('collection_price_update', 0.7);
    
    // Fraud detection events
    this.eventTypeImpactScores.set('fraud_image_analysis', 0.6);
    this.eventTypeImpactScores.set('fraud_similarity_score', 0.7);
    this.eventTypeImpactScores.set('fraud_wash_trading', 0.9);
    this.eventTypeImpactScores.set('fraud_metadata_validation', 0.5);
    
    // Social media events
    this.eventTypeImpactScores.set('social_mention_frequency', 0.3);
    this.eventTypeImpactScores.set('social_sentiment_shift', 0.5);
    this.eventTypeImpactScores.set('social_follower_change', 0.2);
    this.eventTypeImpactScores.set('social_creator_announcement', 0.4);
    this.eventTypeImpactScores.set('social_community_growth', 0.3);
    
    // Market condition events
    this.eventTypeImpactScores.set('market_floor_price_change', 0.6);
    this.eventTypeImpactScores.set('market_volume_anomaly', 0.5);
    this.eventTypeImpactScores.set('market_trend_shift', 0.4);
    this.eventTypeImpactScores.set('market_similar_nft_sale', 0.5);
    this.eventTypeImpactScores.set('market_creator_portfolio_change', 0.3);
  }
  
  /**
   * Initialize event type urgency levels
   */
  private initializeEventTypeUrgencyLevels(): void {
    // Blockchain events
    this.eventTypeUrgencyLevels.set('nft_transfer', 'high');
    this.eventTypeUrgencyLevels.set('nft_sale', 'high');
    this.eventTypeUrgencyLevels.set('nft_mint', 'medium');
    this.eventTypeUrgencyLevels.set('contract_update', 'medium');
    this.eventTypeUrgencyLevels.set('creator_activity', 'low');
    this.eventTypeUrgencyLevels.set('collection_price_update', 'high');
    
    // Fraud detection events
    this.eventTypeUrgencyLevels.set('fraud_image_analysis', 'medium');
    this.eventTypeUrgencyLevels.set('fraud_similarity_score', 'medium');
    this.eventTypeUrgencyLevels.set('fraud_wash_trading', 'high');
    this.eventTypeUrgencyLevels.set('fraud_metadata_validation', 'medium');
    
    // Social media events
    this.eventTypeUrgencyLevels.set('social_mention_frequency', 'low');
    this.eventTypeUrgencyLevels.set('social_sentiment_shift', 'medium');
    this.eventTypeUrgencyLevels.set('social_follower_change', 'low');
    this.eventTypeUrgencyLevels.set('social_creator_announcement', 'medium');
    this.eventTypeUrgencyLevels.set('social_community_growth', 'low');
    
    // Market condition events
    this.eventTypeUrgencyLevels.set('market_floor_price_change', 'high');
    this.eventTypeUrgencyLevels.set('market_volume_anomaly', 'medium');
    this.eventTypeUrgencyLevels.set('market_trend_shift', 'medium');
    this.eventTypeUrgencyLevels.set('market_similar_nft_sale', 'medium');
    this.eventTypeUrgencyLevels.set('market_creator_portfolio_change', 'low');
  }
  
  /**
   * Initialize event type dependencies
   */
  private initializeEventTypeDependencies(): void {
    // Blockchain events
    this.eventTypeDependencies.set('nft_transfer', []);
    this.eventTypeDependencies.set('nft_sale', []);
    this.eventTypeDependencies.set('nft_mint', []);
    this.eventTypeDependencies.set('contract_update', []);
    this.eventTypeDependencies.set('creator_activity', []);
    this.eventTypeDependencies.set('collection_price_update', []);
    
    // Fraud detection events - some depend on blockchain events
    this.eventTypeDependencies.set('fraud_image_analysis', ['nft_mint']);
    this.eventTypeDependencies.set('fraud_similarity_score', ['nft_mint']);
    this.eventTypeDependencies.set('fraud_wash_trading', ['nft_sale']);
    this.eventTypeDependencies.set('fraud_metadata_validation', ['contract_update']);
    
    // Social media events - some depend on blockchain events
    this.eventTypeDependencies.set('social_mention_frequency', []);
    this.eventTypeDependencies.set('social_sentiment_shift', []);
    this.eventTypeDependencies.set('social_follower_change', []);
    this.eventTypeDependencies.set('social_creator_announcement', []);
    this.eventTypeDependencies.set('social_community_growth', []);
    
    // Market condition events - some depend on blockchain events
    this.eventTypeDependencies.set('market_floor_price_change', ['nft_sale']);
    this.eventTypeDependencies.set('market_volume_anomaly', ['nft_sale']);
    this.eventTypeDependencies.set('market_trend_shift', ['market_floor_price_change']);
    this.eventTypeDependencies.set('market_similar_nft_sale', ['nft_sale']);
    this.eventTypeDependencies.set('market_creator_portfolio_change', ['nft_sale', 'nft_mint']);
  }
  
  /**
   * Classify an event
   * 
   * @param event The event to classify
   * @returns Classification result
   */
  public classify(event: TrustScoreTypes.UpdateEvent): ClassificationResult {
    // Get event type
    const eventType = event.eventType || 'unknown';
    
    // Get event category
    const eventCategory = this.getEventCategory(eventType);
    
    // Get entity associations
    const entityAssociations = this.getEntityAssociations(eventType);
    
    // Get impact score
    const impactScore = this.getImpactScore(event);
    
    // Get urgency level
    const urgencyLevel = this.getUrgencyLevel(eventType, impactScore);
    
    // Get dependencies
    const dependencies = this.getDependencies(eventType);
    
    // Return classification result
    return {
      event,
      eventCategory,
      entityAssociations,
      impactScore,
      urgencyLevel,
      dependencies
    };
  }
  
  /**
   * Get event category for an event type
   * 
   * @param eventType The event type
   * @returns Event category
   */
  private getEventCategory(eventType: string): string {
    return this.eventTypeCategories.get(eventType) || 'unknown';
  }
  
  /**
   * Get entity associations for an event type
   * 
   * @param eventType The event type
   * @returns Entity associations
   */
  private getEntityAssociations(eventType: string): string[] {
    return this.entityAssociationMappings.get(eventType) || [];
  }
  
  /**
   * Get impact score for an event
   * 
   * @param event The event
   * @returns Impact score
   */
  private getImpactScore(event: TrustScoreTypes.UpdateEvent): number {
    if (!this.config.enableImpactAssessment) {
      return 0.5; // Default medium impact
    }
    
    const eventType = event.eventType || 'unknown';
    const baseImpact = this.eventTypeImpactScores.get(eventType) || 0.5;
    
    // Apply modifiers based on event content
    let modifiedImpact = baseImpact;
    
    // Modify based on entity type
    if (event.entityType === 'nft') {
      modifiedImpact += 0.1; // NFT-level events are more impactful
    } else if (event.entityType === 'collection') {
      modifiedImpact += 0.05; // Collection-level events are somewhat impactful
    }
    
    // Modify based on event data
    if (event.data) {
      // Price changes are more impactful
      if (event.data.priceChange && Math.abs(event.data.priceChange) > 0.2) {
        modifiedImpact += 0.2;
      }
      
      // Fraud confidence is more impactful
      if (event.data.fraudConfidence && event.data.fraudConfidence > 0.7) {
        modifiedImpact += 0.3;
      }
      
      // Social sentiment shifts are more impactful
      if (event.data.sentimentShift && Math.abs(event.data.sentimentShift) > 0.5) {
        modifiedImpact += 0.1;
      }
    }
    
    // Ensure impact is between 0 and 1
    return Math.max(0, Math.min(1, modifiedImpact));
  }
  
  /**
   * Get urgency level for an event type and impact score
   * 
   * @param eventType The event type
   * @param impactScore The impact score
   * @returns Urgency level
   */
  private getUrgencyLevel(eventType: string, impactScore: number): string {
    // Get base urgency level
    const baseUrgency = this.eventTypeUrgencyLevels.get(eventType) || 'medium';
    
    // Adjust based on impact score
    if (impactScore >= this.config.highImpactThreshold) {
      return 'high';
    } else if (impactScore >= this.config.mediumImpactThreshold) {
      return baseUrgency;
    } else {
      return 'low';
    }
  }
  
  /**
   * Get dependencies for an event type
   * 
   * @param eventType The event type
   * @returns Dependencies
   */
  private getDependencies(eventType: string): string[] {
    if (!this.config.enableDependencyIdentification) {
      return [];
    }
    
    return this.eventTypeDependencies.get(eventType) || [];
  }
  
  /**
   * Get all event types
   * 
   * @returns Array of event types
   */
  public getAllEventTypes(): string[] {
    return Array.from(this.eventTypeCategories.keys());
  }
  
  /**
   * Get all event categories
   * 
   * @returns Array of event categories
   */
  public getAllEventCategories(): string[] {
    return Array.from(new Set(this.eventTypeCategories.values()));
  }
  
  /**
   * Get all entity types
   * 
   * @returns Array of entity types
   */
  public getAllEntityTypes(): string[] {
    const entityTypes = new Set<string>();
    for (const associations of this.entityAssociationMappings.values()) {
      for (const entityType of associations) {
        entityTypes.add(entityType);
      }
    }
    return Array.from(entityTypes);
  }
}
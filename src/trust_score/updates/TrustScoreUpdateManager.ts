/**
 * TrustScoreUpdateManager.ts
 * 
 * Implements the real-time update system that maintains score freshness
 * and processes events that might affect trust scores.
 * 
 * Key features:
 * - Event-based triggers for score recalculation
 * - Incremental update logic for efficient processing
 * - Significant change tracking for notifications
 * - Score history maintenance with timestamps
 * - Change explanation generation
 */

import { TrustScoreEngine } from '../TrustScoreEngine';
import { TrustScoreTypes } from '../types';
import { ScoreHistoryRepository } from '../repositories/ScoreHistoryRepository';

/**
 * Configuration for update thresholds and processing
 */
interface UpdateConfig {
  // Thresholds for different event types (0-1 where 1 means always update)
  thresholds: Map<string, number>;
  // Minimum time between updates for the same entity (in milliseconds)
  minTimeBetweenUpdates: number;
  // Maximum number of pending updates before forcing an update
  maxPendingUpdates: number;
  // Whether to track history for this entity type
  trackHistory: boolean;
}

/**
 * Responsible for processing events and triggering trust score updates
 * when relevant changes occur.
 */
export class TrustScoreUpdateManager {
  private trustScoreEngine: TrustScoreEngine;
  private pendingUpdates: Map<string, TrustScoreTypes.UpdateEvent[]>;
  private lastUpdateTimestamps: Map<string, string>;
  private scoreHistoryRepository?: ScoreHistoryRepository;
  private updateConfigs: Map<string, UpdateConfig>;
  private entityDependencies: Map<string, Set<string>>; // Tracks dependencies between entities
  
  /**
   * Initialize the Trust Score Update Manager
   * 
   * @param trustScoreEngine Reference to the main trust score engine
   * @param scoreHistoryRepository Optional repository for storing score history
   */
  constructor(trustScoreEngine: TrustScoreEngine, scoreHistoryRepository?: ScoreHistoryRepository) {
    this.trustScoreEngine = trustScoreEngine;
    this.pendingUpdates = new Map<string, TrustScoreTypes.UpdateEvent[]>();
    this.lastUpdateTimestamps = new Map<string, string>();
    this.scoreHistoryRepository = scoreHistoryRepository;
    this.entityDependencies = new Map<string, Set<string>>();
    
    // Initialize default update configurations for each entity type
    this.updateConfigs = new Map<string, UpdateConfig>([
      ['nft', {
        thresholds: new Map<string, number>([
          ['transfer', 0.7], // High importance
          ['sale', 0.9], // Very high importance
          ['metadata_update', 0.8], // High importance
          ['fraud_detection', 1.0], // Always update
          ['social_signal', 0.4], // Medium importance
          ['marketplace_verification', 0.8] // High importance
        ]),
        minTimeBetweenUpdates: 5 * 60 * 1000, // 5 minutes
        maxPendingUpdates: 3,
        trackHistory: true
      }],
      ['creator', {
        thresholds: new Map<string, number>([
          ['nft_update', 0.5], // Medium importance
          ['verification_change', 0.9], // Very high importance
          ['social_presence_change', 0.7], // High importance
          ['project_delivery', 0.8] // High importance
        ]),
        minTimeBetweenUpdates: 30 * 60 * 1000, // 30 minutes
        maxPendingUpdates: 5,
        trackHistory: true
      }],
      ['collection', {
        thresholds: new Map<string, number>([
          ['nft_update', 0.3], // Low importance for individual NFT updates
          ['floor_price_change', 0.8], // High importance
          ['volume_change', 0.7], // High importance
          ['holder_distribution_change', 0.6] // Medium importance
        ]),
        minTimeBetweenUpdates: 15 * 60 * 1000, // 15 minutes
        maxPendingUpdates: 5,
        trackHistory: true
      }]
    ]);
    
    // Setup entity dependencies
    this.setupEntityDependencies();
  }

  /**
   * Process an event that might trigger a trust score update
   * 
   * @param event The event data that might affect trust scores
   * @returns True if an update was triggered, false otherwise
   */
  public processEvent(event: TrustScoreTypes.UpdateEvent): boolean {
    // Create a unique key for the entity
    const entityKey = this.getEntityKey(event.entityType, event.entityId);
    
    // Get or create the pending updates array for this entity
    const updates = this.pendingUpdates.get(entityKey) || [];
    updates.push(event);
    this.pendingUpdates.set(entityKey, updates);
    
    // Check if we should trigger an update now
    if (this.shouldTriggerUpdate(event)) {
      this.triggerUpdate(event.entityType, event.entityId);
      
      // Process dependent entities
      this.processDependentEntities(event.entityType, event.entityId, event);
      
      return true;
    }
    
    return false;
  }

  /**
   * Determine if an event should trigger an immediate update
   * 
   * @param event The event to evaluate
   * @returns True if the event should trigger an immediate update
   */
  private shouldTriggerUpdate(event: TrustScoreTypes.UpdateEvent): boolean {
    const entityType = event.entityType;
    const entityKey = this.getEntityKey(entityType, event.entityId);
    
    // Get the configuration for this entity type
    const config = this.updateConfigs.get(entityType);
    if (!config) return false;
    
    // Get the threshold for this event type
    const threshold = config.thresholds.get(event.eventType) || 0.5;
    
    // High-impact events always trigger updates
    if (threshold >= 0.9) return true;
    
    // Check when this entity was last updated
    const lastUpdateTimestamp = this.lastUpdateTimestamps.get(entityKey);
    if (lastUpdateTimestamp) {
      const lastUpdate = new Date(lastUpdateTimestamp).getTime();
      const now = new Date().getTime();
      
      // If we updated recently, don't update again unless it's a high-impact event
      if (now - lastUpdate < config.minTimeBetweenUpdates && threshold < 0.8) {
        return false;
      }
    }
    
    // For medium-impact events, check if we have accumulated enough
    const updates = this.pendingUpdates.get(entityKey) || [];
    
    // If we have enough pending updates, trigger an update
    if (updates.length >= config.maxPendingUpdates) return true;
    
    // Otherwise, use a random factor with the threshold
    return Math.random() < threshold;
  }

  /**
   * Trigger a trust score update for an entity
   * 
   * @param entityType The type of entity to update
   * @param entityId The ID of the entity to update
   * @returns The updated trust score if successful, undefined otherwise
   */
  private triggerUpdate(entityType: 'nft' | 'creator' | 'collection', entityId: string): any {
    // Get the entity key
    const entityKey = this.getEntityKey(entityType, entityId);
    
    // Get pending updates for this entity
    const pendingUpdates = this.pendingUpdates.get(entityKey) || [];
    
    // Clear pending updates for this entity
    this.pendingUpdates.delete(entityKey);
    
    // Update the last update timestamp
    const currentTimestamp = new Date().toISOString();
    this.lastUpdateTimestamps.set(entityKey, currentTimestamp);
    
    // Get the previous score if available
    let previousScore: any;
    let updatedScore: any;
    
    try {
      // In a real implementation, this would fetch the latest data and recalculate
      console.log(`Triggering update for ${entityType} ${entityId} with ${pendingUpdates.length} pending events`);
      
      // 1. Fetch the latest data for the entity
      const latestData = this.fetchLatestData(entityType, entityId, pendingUpdates);
      if (!latestData) {
        console.error(`Failed to fetch latest data for ${entityType} ${entityId}`);
        return undefined;
      }
      
      // 2. Get the previous score if available
      previousScore = this.getPreviousScore(entityType, entityId);
      
      // 3. Call the appropriate calculation method on the trust score engine with incremental update
      updatedScore = this.calculateUpdatedScore(entityType, entityId, latestData, previousScore, pendingUpdates);
      if (!updatedScore) {
        console.error(`Failed to calculate updated score for ${entityType} ${entityId}`);
        return undefined;
      }
      
      // 4. Store the updated score and history if configured
      this.storeUpdatedScore(entityType, entityId, updatedScore);
      
      // 5. Check for significant changes and generate notifications if needed
      if (previousScore) {
        const significantChanges = this.detectSignificantChanges(updatedScore, previousScore);
        if (significantChanges.length > 0) {
          this.generateChangeNotifications(entityType, entityId, updatedScore, previousScore, significantChanges);
        }
      }
      
      return updatedScore;
    } catch (error) {
      console.error(`Error updating ${entityType} ${entityId}:`, error);
      return undefined;
    }
  }

  /**
   * Process all pending updates
   * This would be called periodically in a production system
   * 
   * @returns Number of entities updated
   */
  public processPendingUpdates(): number {
    let updatedCount = 0;
    
    for (const [entityKey, updates] of this.pendingUpdates.entries()) {
      if (updates.length === 0) continue;
      
      // Parse the entity key
      const [entityType, entityId] = entityKey.split(':') as [TrustScoreTypes.UpdateEvent['entityType'], string];
      
      // Trigger the update
      const updatedScore = this.triggerUpdate(entityType, entityId);
      if (updatedScore) {
        updatedCount++;
      }
    }
    
    return updatedCount;
  }

  /**
   * Set the update threshold for an event type for a specific entity type
   * 
   * @param entityType The type of entity
   * @param eventType The type of event
   * @param threshold The threshold value (0-1)
   */
  public setUpdateThreshold(entityType: 'nft' | 'creator' | 'collection', eventType: string, threshold: number): void {
    const config = this.updateConfigs.get(entityType);
    if (config) {
      config.thresholds.set(eventType, Math.max(0, Math.min(1, threshold)));
    }
  }

  /**
   * Get the current update threshold for an event type for a specific entity type
   * 
   * @param entityType The type of entity
   * @param eventType The type of event
   * @returns The current threshold value
   */
  public getUpdateThreshold(entityType: 'nft' | 'creator' | 'collection', eventType: string): number {
    const config = this.updateConfigs.get(entityType);
    return config?.thresholds.get(eventType) || 0.5;
  }
  
  /**
   * Configure update settings for an entity type
   * 
   * @param entityType The type of entity
   * @param config The update configuration
   */
  public setUpdateConfig(entityType: 'nft' | 'creator' | 'collection', config: Partial<UpdateConfig>): void {
    const existingConfig = this.updateConfigs.get(entityType) || {
      thresholds: new Map<string, number>(),
      minTimeBetweenUpdates: 5 * 60 * 1000,
      maxPendingUpdates: 3,
      trackHistory: true
    };
    
    // Merge the new config with the existing one
    this.updateConfigs.set(entityType, {
      ...existingConfig,
      ...config,
      thresholds: config.thresholds || existingConfig.thresholds
    });
  }

  /**
   * Setup dependencies between different entity types
   * This defines which entities should be updated when related entities change
   */
  private setupEntityDependencies(): void {
    // When an NFT is updated, we might need to update its creator and collection
    this.addEntityDependency('nft', 'creator', (nftId) => {
      // In a real implementation, this would look up the creator for this NFT
      // For now, we'll just use a placeholder
      return `creator_for_${nftId}`;
    });
    
    this.addEntityDependency('nft', 'collection', (nftId) => {
      // In a real implementation, this would look up the collection for this NFT
      // For now, we'll just use a placeholder
      return `collection_for_${nftId}`;
    });
  }
  
  /**
   * Add a dependency between two entity types
   * 
   * @param sourceType The source entity type
   * @param targetType The target entity type
   * @param idMapper Function to map source ID to target ID
   */
  public addEntityDependency(
    sourceType: 'nft' | 'creator' | 'collection',
    targetType: 'nft' | 'creator' | 'collection',
    idMapper: (sourceId: string) => string | undefined
  ): void {
    const key = `${sourceType}:${targetType}`;
    this.entityDependencies.set(key, new Set([...(this.entityDependencies.get(key) || []), idMapper]));
  }
  
  /**
   * Process dependent entities when an entity is updated
   * 
   * @param entityType The type of entity that was updated
   * @param entityId The ID of the entity that was updated
   * @param originalEvent The original event that triggered the update
   */
  private processDependentEntities(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string,
    originalEvent: TrustScoreTypes.UpdateEvent
  ): void {
    // Check for each possible target type
    const targetTypes: Array<'nft' | 'creator' | 'collection'> = ['nft', 'creator', 'collection'];
    
    for (const targetType of targetTypes) {
      if (targetType === entityType) continue; // Skip self-dependencies
      
      const key = `${entityType}:${targetType}`;
      const mappers = this.entityDependencies.get(key);
      
      if (mappers) {
        for (const mapper of mappers) {
          const targetId = mapper(entityId);
          if (targetId) {
            // Create a derived event for the dependent entity
            const derivedEvent: TrustScoreTypes.UpdateEvent = {
              eventType: `${entityType}_update`,
              timestamp: new Date().toISOString(),
              entityId: targetId,
              entityType: targetType,
              data: {
                sourceEntityType: entityType,
                sourceEntityId: entityId,
                sourceEventType: originalEvent.eventType
              }
            };
            
            // Process the derived event with a lower threshold to avoid cascade updates
            this.processEvent(derivedEvent);
          }
        }
      }
    }
  }
  
  /**
   * Get a unique key for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns A unique key for the entity
   */
  private getEntityKey(entityType: string, entityId: string): string {
    return `${entityType}:${entityId}`;
  }
  
  /**
   * Fetch the latest data for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @param pendingUpdates Pending updates for this entity
   * @returns The latest data for the entity
   */
  private fetchLatestData(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string,
    pendingUpdates: TrustScoreTypes.UpdateEvent[]
  ): any {
    // In a real implementation, this would fetch the latest data from a data source
    // For now, we'll just return a placeholder
    return {
      entityType,
      entityId,
      pendingUpdateCount: pendingUpdates.length,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get the previous score for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns The previous score for the entity, if available
   */
  private getPreviousScore(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string
  ): any {
    // In a real implementation, this would fetch the previous score from storage
    // For now, we'll just return undefined
    return undefined;
  }
  
  /**
   * Calculate the updated score for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @param latestData The latest data for the entity
   * @param previousScore The previous score for the entity, if available
   * @param pendingUpdates Pending updates for this entity
   * @returns The updated score for the entity
   */
  private calculateUpdatedScore(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string,
    latestData: any,
    previousScore: any,
    pendingUpdates: TrustScoreTypes.UpdateEvent[]
  ): any {
    // In a real implementation, this would call the appropriate method on the trust score engine
    // For now, we'll just return a placeholder
    return {
      entityType,
      entityId,
      overallScore: 75,
      confidence: 0.8,
      timestamp: new Date().toISOString(),
      factorScores: new Map(),
      explanation: 'Updated score based on recent events',
      history: []
    };
  }
  
  /**
   * Store the updated score for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @param updatedScore The updated score for the entity
   */
  private storeUpdatedScore(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string,
    updatedScore: any
  ): void {
    // In a real implementation, this would store the updated score in a database
    // For now, we'll just log it
    console.log(`Stored updated score for ${entityType} ${entityId}:`, updatedScore.overallScore);
    
    // Store history if configured and repository is available
    const config = this.updateConfigs.get(entityType);
    if (config?.trackHistory && this.scoreHistoryRepository) {
      this.scoreHistoryRepository.saveScoreHistory({
        entityId,
        entityType,
        history: updatedScore.history || []
      });
    }
  }
  
  /**
   * Detect significant changes between current and previous scores
   * 
   * @param currentScore Current score
   * @param previousScore Previous score
   * @returns Array of significant score changes
   */
  private detectSignificantChanges(currentScore: any, previousScore: any): TrustScoreTypes.ScoreChange[] {
    // In a real implementation, this would compare the scores and detect significant changes
    // For now, we'll just return an empty array
    return [];
  }
  
  /**
   * Generate notifications for significant changes
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @param currentScore Current score
   * @param previousScore Previous score
   * @param significantChanges Array of significant score changes
   */
  private generateChangeNotifications(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string,
    currentScore: any,
    previousScore: any,
    significantChanges: TrustScoreTypes.ScoreChange[]
  ): void {
    // In a real implementation, this would generate and send notifications
    // For now, we'll just log them
    console.log(`Generated ${significantChanges.length} change notifications for ${entityType} ${entityId}`);
  }
}
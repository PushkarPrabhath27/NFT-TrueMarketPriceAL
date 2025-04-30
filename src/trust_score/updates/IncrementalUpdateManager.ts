/**
 * IncrementalUpdateManager.ts
 * 
 * Implements the Incremental Update Logic component of the Real-Time Update System.
 * Responsible for efficient recalculation strategies, dependency tracking between factors,
 * change significance evaluation, and update propagation across related entities.
 */

import { TrustScoreTypes } from '../types';
import { TrustScoreUpdateManager } from './TrustScoreUpdateManager';
import { FactorCalculator } from '../factors/FactorCalculator';

/**
 * Configuration for incremental updates
 */
export interface IncrementalUpdateConfig {
  // Threshold for considering a change significant (0-1)
  significanceThreshold: number;
  // Whether to use incremental updates when possible
  enableIncrementalUpdates: boolean;
  // Maximum age of cached data before forcing full recalculation (in milliseconds)
  maxCacheAge: number;
  // Whether to propagate updates to related entities
  propagateUpdates: boolean;
}

/**
 * Manages incremental updates to trust scores for efficient processing
 */
export class IncrementalUpdateManager {
  private updateManager: TrustScoreUpdateManager;
  private factorCalculators: Map<string, FactorCalculator>;
  private config: IncrementalUpdateConfig;
  private factorDependencies: Map<string, Set<string>>;
  private entityDependencies: Map<string, Set<string>>;
  private lastCalculationTimes: Map<string, Map<string, number>>;
  private cachedFactorData: Map<string, Map<string, any>>;
  
  /**
   * Initialize the Incremental Update Manager
   * 
   * @param updateManager Reference to the trust score update manager
   * @param factorCalculators Map of factor calculators
   * @param config Configuration for incremental updates
   */
  constructor(
    updateManager: TrustScoreUpdateManager,
    factorCalculators: Map<string, FactorCalculator>,
    config: IncrementalUpdateConfig = {
      significanceThreshold: 0.05, // 5% change is considered significant
      enableIncrementalUpdates: true,
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      propagateUpdates: true
    }
  ) {
    this.updateManager = updateManager;
    this.factorCalculators = factorCalculators;
    this.config = config;
    this.factorDependencies = new Map();
    this.entityDependencies = new Map();
    this.lastCalculationTimes = new Map();
    this.cachedFactorData = new Map();
    
    // Setup factor dependencies
    this.setupFactorDependencies();
    
    // Setup entity dependencies
    this.setupEntityDependencies();
  }
  
  /**
   * Determine if an incremental update is possible for a specific entity and factor
   * 
   * @param entityId The entity ID
   * @param entityType The entity type (nft, creator, collection)
   * @param factorKey The factor key
   * @param updateEvent The update event that triggered the recalculation
   * @returns Whether an incremental update is possible
   */
  public canUpdateIncrementally(
    entityId: string,
    entityType: string,
    factorKey: string,
    updateEvent: TrustScoreTypes.UpdateEvent
  ): boolean {
    // If incremental updates are disabled, always do full recalculation
    if (!this.config.enableIncrementalUpdates) {
      return false;
    }
    
    // Check if the factor calculator supports incremental updates
    const calculator = this.factorCalculators.get(factorKey);
    if (!calculator || !calculator.supportsIncrementalUpdate) {
      return false;
    }
    
    // Check if we have cached data for this entity and factor
    const entityCache = this.cachedFactorData.get(entityType)?.get(entityId);
    if (!entityCache || !entityCache[factorKey]) {
      return false;
    }
    
    // Check if the cached data is too old
    const lastCalculationTime = this.lastCalculationTimes.get(entityType)?.get(entityId) || 0;
    const cacheAge = Date.now() - lastCalculationTime;
    if (cacheAge > this.config.maxCacheAge) {
      return false;
    }
    
    // Check if the update event affects dependencies that would invalidate incremental update
    const dependencies = this.factorDependencies.get(factorKey);
    if (dependencies && dependencies.has(updateEvent.eventType)) {
      // If the event directly affects a dependency, we need full recalculation
      return false;
    }
    
    return true;
  }
  
  /**
   * Perform an incremental update for a specific entity and factor
   * 
   * @param entityId The entity ID
   * @param entityType The entity type (nft, creator, collection)
   * @param factorKey The factor key
   * @param currentScore The current factor score
   * @param updateEvent The update event that triggered the recalculation
   * @returns The updated factor score
   */
  public async updateIncrementally(
    entityId: string,
    entityType: string,
    factorKey: string,
    currentScore: TrustScoreTypes.FactorScore,
    updateEvent: TrustScoreTypes.UpdateEvent
  ): Promise<TrustScoreTypes.FactorScore> {
    // Get the factor calculator
    const calculator = this.factorCalculators.get(factorKey);
    if (!calculator || !calculator.updateIncrementally) {
      throw new Error(`Factor calculator for ${factorKey} does not support incremental updates`);
    }
    
    // Get cached data for this entity and factor
    const entityCache = this.cachedFactorData.get(entityType)?.get(entityId);
    if (!entityCache || !entityCache[factorKey]) {
      throw new Error(`No cached data found for ${entityType} ${entityId} factor ${factorKey}`);
    }
    
    // Perform the incremental update
    const updatedScore = await calculator.updateIncrementally(
      currentScore,
      updateEvent,
      entityCache[factorKey]
    );
    
    // Update the cache with the new data
    this.updateCache(entityId, entityType, factorKey, updatedScore, calculator.getCacheableData());
    
    // Check if the change is significant
    const isSignificant = this.isChangeSignificant(currentScore, updatedScore);
    
    // If the change is significant and propagation is enabled, propagate to dependent entities
    if (isSignificant && this.config.propagateUpdates) {
      this.propagateUpdate(entityId, entityType, factorKey, updatedScore);
    }
    
    return updatedScore;
  }
  
  /**
   * Update the cache with new factor data
   * 
   * @param entityId The entity ID
   * @param entityType The entity type (nft, creator, collection)
   * @param factorKey The factor key
   * @param score The updated factor score
   * @param cacheableData The cacheable data from the factor calculator
   */
  public updateCache(
    entityId: string,
    entityType: string,
    factorKey: string,
    score: TrustScoreTypes.FactorScore,
    cacheableData: any
  ): void {
    // Initialize maps if they don't exist
    if (!this.cachedFactorData.has(entityType)) {
      this.cachedFactorData.set(entityType, new Map());
    }
    
    if (!this.cachedFactorData.get(entityType)!.has(entityId)) {
      this.cachedFactorData.get(entityType)!.set(entityId, {});
    }
    
    if (!this.lastCalculationTimes.has(entityType)) {
      this.lastCalculationTimes.set(entityType, new Map());
    }
    
    // Update the cache
    const entityCache = this.cachedFactorData.get(entityType)!.get(entityId)!;
    entityCache[factorKey] = cacheableData;
    
    // Update the last calculation time
    this.lastCalculationTimes.get(entityType)!.set(entityId, Date.now());
  }
  
  /**
   * Invalidate cache for a specific entity and factor
   * 
   * @param entityId The entity ID
   * @param entityType The entity type (nft, creator, collection)
   * @param factorKey Optional factor key (if not provided, invalidate all factors)
   */
  public invalidateCache(
    entityId: string,
    entityType: string,
    factorKey?: string
  ): void {
    if (!this.cachedFactorData.has(entityType)) {
      return;
    }
    
    const entityCache = this.cachedFactorData.get(entityType)!.get(entityId);
    if (!entityCache) {
      return;
    }
    
    if (factorKey) {
      // Invalidate specific factor
      delete entityCache[factorKey];
    } else {
      // Invalidate all factors
      this.cachedFactorData.get(entityType)!.delete(entityId);
      
      if (this.lastCalculationTimes.has(entityType)) {
        this.lastCalculationTimes.get(entityType)!.delete(entityId);
      }
    }
  }
  
  /**
   * Check if a change in factor score is significant
   * 
   * @param oldScore The old factor score
   * @param newScore The new factor score
   * @returns Whether the change is significant
   */
  public isChangeSignificant(
    oldScore: TrustScoreTypes.FactorScore,
    newScore: TrustScoreTypes.FactorScore
  ): boolean {
    // Calculate the percentage change in the score
    const scoreDiff = Math.abs(newScore.score - oldScore.score);
    const percentageChange = scoreDiff / 100; // Scores are 0-100
    
    // Check if the change exceeds the significance threshold
    if (percentageChange >= this.config.significanceThreshold) {
      return true;
    }
    
    // Check if there are new red flags
    const oldRedFlagCount = oldScore.redFlags.length;
    const newRedFlagCount = newScore.redFlags.length;
    if (newRedFlagCount > oldRedFlagCount) {
      return true;
    }
    
    // Check if there are new strengths
    const oldStrengthCount = oldScore.strengths.length;
    const newStrengthCount = newScore.strengths.length;
    if (newStrengthCount > oldStrengthCount) {
      return true;
    }
    
    // Check if confidence changed significantly
    const confidenceDiff = Math.abs(newScore.confidence - oldScore.confidence);
    if (confidenceDiff >= this.config.significanceThreshold) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Propagate an update to dependent entities
   * 
   * @param entityId The entity ID that was updated
   * @param entityType The entity type that was updated
   * @param factorKey The factor key that was updated
   * @param updatedScore The updated factor score
   */
  private async propagateUpdate(
    entityId: string,
    entityType: string,
    factorKey: string,
    updatedScore: TrustScoreTypes.FactorScore
  ): Promise<void> {
    // Get dependent entities
    const dependentEntities = this.getDependentEntities(entityId, entityType);
    
    // Create update events for dependent entities
    for (const dependent of dependentEntities) {
      const updateEvent: TrustScoreTypes.UpdateEvent = {
        entityId: dependent.entityId,
        entityType: dependent.entityType,
        eventType: `${entityType}_update`,
        timestamp: new Date().toISOString(),
        data: {
          sourceEntityId: entityId,
          sourceEntityType: entityType,
          updatedFactor: factorKey,
          scoreChange: updatedScore.score
        }
      };
      
      // Queue the update
      await this.updateManager.queueUpdate(updateEvent);
    }
  }
  
  /**
   * Get entities that depend on the specified entity
   * 
   * @param entityId The entity ID
   * @param entityType The entity type
   * @returns Array of dependent entities
   */
  private getDependentEntities(
    entityId: string,
    entityType: string
  ): Array<{entityId: string, entityType: string}> {
    const dependentEntities: Array<{entityId: string, entityType: string}> = [];
    
    // Implementation would query a database or in-memory structure to find
    // entities that depend on the specified entity
    // This is a placeholder for the actual implementation
    
    // Example: If an NFT is updated, the collection and creator might be dependent
    if (entityType === 'nft') {
      // Get collection ID from NFT data
      const collectionId = 'collection_id_placeholder'; // Would be retrieved from actual data
      dependentEntities.push({
        entityId: collectionId,
        entityType: 'collection'
      });
      
      // Get creator ID from NFT data
      const creatorId = 'creator_id_placeholder'; // Would be retrieved from actual data
      dependentEntities.push({
        entityId: creatorId,
        entityType: 'creator'
      });
    }
    
    return dependentEntities;
  }
  
  /**
   * Setup factor dependencies
   */
  private setupFactorDependencies(): void {
    // Map of factors and the event types that affect them
    this.factorDependencies.set('originality', new Set([
      'fraud_detection',
      'image_similarity'
    ]));
    
    this.factorDependencies.set('transaction', new Set([
      'transfer',
      'sale',
      'mint',
      'burn'
    ]));
    
    this.factorDependencies.set('creator', new Set([
      'creator_verification',
      'project_delivery',
      'social_presence_change'
    ]));
    
    this.factorDependencies.set('collection', new Set([
      'floor_price_change',
      'volume_spike',
      'holder_distribution_change'
    ]));
    
    this.factorDependencies.set('metadata', new Set([
      'metadata_update'
    ]));
    
    this.factorDependencies.set('marketplace', new Set([
      'marketplace_verification',
      'listing',
      'delisting'
    ]));
    
    this.factorDependencies.set('social', new Set([
      'social_signal',
      'social_sentiment'
    ]));
  }
  
  /**
   * Setup entity dependencies
   */
  private setupEntityDependencies(): void {
    // NFTs depend on their creator and collection
    this.entityDependencies.set('nft', new Set([
      'creator',
      'collection'
    ]));
    
    // Collections depend on their NFTs
    this.entityDependencies.set('collection', new Set([
      'nft'
    ]));
    
    // Creators depend on their NFTs and collections
    this.entityDependencies.set('creator', new Set([
      'nft',
      'collection'
    ]));
  }
}
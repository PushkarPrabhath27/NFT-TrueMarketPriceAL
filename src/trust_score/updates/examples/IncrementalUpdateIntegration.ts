/**
 * IncrementalUpdateIntegration.ts
 * 
 * Example demonstrating how to integrate the Incremental Update System components
 * with the existing IncrementalUpdateManager.
 */

import { TrustScoreTypes } from '../../types';
import { TrustScoreUpdateManager } from '../TrustScoreUpdateManager';
import { IncrementalUpdateManager, IncrementalUpdateConfig } from '../IncrementalUpdateManager';
import { DependencyTracker, RelationshipType } from '../incremental/DependencyTracker';
import { SelectiveRecalculator } from '../incremental/SelectiveRecalculator';
import { CacheInvalidator } from '../incremental/CacheInvalidator';
import { FactorCalculator } from '../../factors/FactorCalculator';

/**
 * Example showing how to set up and use the Incremental Update System
 */
async function setupIncrementalUpdateSystem() {
  console.log('Setting up Incremental Update System...');
  
  // Create mock dependencies
  const trustScoreUpdateManager = {} as TrustScoreUpdateManager;
  const factorCalculators = new Map<string, FactorCalculator>();
  
  // Initialize incremental update components
  const dependencyTracker = new DependencyTracker();
  const selectiveRecalculator = new SelectiveRecalculator(
    dependencyTracker,
    factorCalculators as any
  );
  const cacheInvalidator = new CacheInvalidator(dependencyTracker);
  
  // Configure the IncrementalUpdateManager
  const incrementalUpdateConfig: IncrementalUpdateConfig = {
    significanceThreshold: 0.05,
    enableIncrementalUpdates: true,
    maxCacheAge: 3600000, // 1 hour
    propagateUpdates: true
  };
  
  // Create the IncrementalUpdateManager with our components
  const incrementalUpdateManager = new IncrementalUpdateManager(
    trustScoreUpdateManager,
    factorCalculators,
    incrementalUpdateConfig
  );
  
  // Extend the IncrementalUpdateManager with our new components
  Object.assign(incrementalUpdateManager, {
    dependencyTracker,
    selectiveRecalculator,
    cacheInvalidator,
    
    // Override the determineUpdateStrategy method to use our components
    determineUpdateStrategy: function(event: TrustScoreTypes.UpdateEvent) {
      // Analyze the impact of the change
      const changeImpact = this.dependencyTracker.analyzeChangeImpact(
        event.entityId,
        event.entityType,
        event.changeType,
        event.changeData
      );
      
      // Plan recalculation tasks
      const tasks = this.selectiveRecalculator.planRecalculation(changeImpact);
      
      // Return the update strategy
      return {
        requiresFullRecalculation: changeImpact.impactSeverity > 0.7,
        affectedFactors: tasks.flatMap(task => task.factors.length > 0 ? task.factors : []),
        propagationPath: changeImpact.propagationPath,
        updatePriority: changeImpact.impactSeverity
      };
    },
    
    // Override the invalidateCache method to use our CacheInvalidator
    invalidateCache: function(event: TrustScoreTypes.UpdateEvent) {
      // Analyze the impact of the change
      const changeImpact = this.dependencyTracker.analyzeChangeImpact(
        event.entityId,
        event.entityType,
        event.changeType,
        event.changeData
      );
      
      // Invalidate affected cache entries
      return this.cacheInvalidator.invalidateBasedOnChangeImpact(changeImpact);
    }
  });
  
  console.log('Incremental Update System setup complete');
  
  // Example usage
  console.log('\nRegistering entity relationships...');
  
  // Register some entity relationships
  const nft = { id: 'nft123', type: TrustScoreTypes.EntityType.NFT };
  const collection = { id: 'collection456', type: TrustScoreTypes.EntityType.COLLECTION };
  
  dependencyTracker.registerRelationship({
    sourceId: nft.id,
    sourceType: nft.type,
    targetId: collection.id,
    targetType: collection.type,
    relationshipType: RelationshipType.BELONGS_TO,
    strength: 1.0,
    lastUpdated: Date.now()
  });
  
  console.log('Relationship registered');
  
  // Simulate an update event
  const updateEvent: TrustScoreTypes.UpdateEvent = {
    eventId: 'evt123',
    entityId: nft.id,
    entityType: nft.type,
    changeType: TrustScoreTypes.ChangeType.PRICE_CHANGE,
    timestamp: Date.now(),
    source: TrustScoreTypes.EventSource.BLOCKCHAIN,
    priority: 0.8,
    changeData: {
      oldPrice: 1.5,
      newPrice: 2.0
    }
  };
  
  console.log('\nProcessing update event...');
  
  // Determine update strategy
  const updateStrategy = incrementalUpdateManager.determineUpdateStrategy(updateEvent);
  
  console.log('Update strategy determined:');
  console.log(`- Requires full recalculation: ${updateStrategy.requiresFullRecalculation}`);
  console.log(`- Update priority: ${updateStrategy.updatePriority.toFixed(2)}`);
  
  // Invalidate cache
  const invalidationResult = incrementalUpdateManager.invalidateCache(updateEvent);
  
  console.log('\nCache invalidation results:');
  console.log(`- Invalidated entries: ${invalidationResult.invalidatedCount}`);
  console.log(`- Critical data invalidated: ${invalidationResult.criticalDataInvalidated}`);
  
  console.log('\nIncremental Update System integration example completed');
}

// Run the example
setupIncrementalUpdateSystem().catch(error => {
  console.error('Error in example:', error);
});
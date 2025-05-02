/**
 * IncrementalUpdateTest.ts
 * 
 * Test file demonstrating the usage of the Incremental Update System components.
 */

import { TrustScoreTypes } from '../../../types';
import { DependencyTracker, RelationshipType, UpdateScope } from '../DependencyTracker';
import { SelectiveRecalculator } from '../SelectiveRecalculator';
import { CacheInvalidator, CacheEntryType } from '../CacheInvalidator';

/**
 * Example factor calculator functions
 */
const factorCalculators = new Map<string, Function>();

// Simple price history factor calculator
factorCalculators.set('priceHistory', async (entity: TrustScoreTypes.EntityReference) => {
  console.log(`Calculating price history for ${entity.type}:${entity.id}`);
  // Simulate calculation
  await new Promise(resolve => setTimeout(resolve, 100));
  return { trend: 'increasing', volatility: 0.2 };
});

// Simple ownership history factor calculator
factorCalculators.set('ownershipHistory', async (entity: TrustScoreTypes.EntityReference) => {
  console.log(`Calculating ownership history for ${entity.type}:${entity.id}`);
  // Simulate calculation
  await new Promise(resolve => setTimeout(resolve, 150));
  return { transfers: 5, averageHoldingTime: 30 };
});

// Simple rarity factor calculator
factorCalculators.set('rarity', async (entity: TrustScoreTypes.EntityReference) => {
  console.log(`Calculating rarity for ${entity.type}:${entity.id}`);
  // Simulate calculation
  await new Promise(resolve => setTimeout(resolve, 120));
  return { score: 0.85, rank: 120 };
});

/**
 * Run a demonstration of the incremental update system
 */
async function runIncrementalUpdateDemo() {
  console.log('Starting Incremental Update System Demo');
  
  // Initialize components
  const dependencyTracker = new DependencyTracker();
  const selectiveRecalculator = new SelectiveRecalculator(dependencyTracker, factorCalculators);
  const cacheInvalidator = new CacheInvalidator(dependencyTracker);
  
  console.log('\n1. Registering entity relationships...');
  
  // Register some entity relationships
  const nft1 = { id: 'nft1', type: TrustScoreTypes.EntityType.NFT };
  const nft2 = { id: 'nft2', type: TrustScoreTypes.EntityType.NFT };
  const collection1 = { id: 'collection1', type: TrustScoreTypes.EntityType.COLLECTION };
  const creator1 = { id: 'creator1', type: TrustScoreTypes.EntityType.CREATOR };
  
  // NFT1 belongs to Collection1
  dependencyTracker.registerRelationship({
    sourceId: nft1.id,
    sourceType: nft1.type,
    targetId: collection1.id,
    targetType: collection1.type,
    relationshipType: RelationshipType.BELONGS_TO,
    strength: 1.0,
    lastUpdated: Date.now()
  });
  
  // NFT2 belongs to Collection1
  dependencyTracker.registerRelationship({
    sourceId: nft2.id,
    sourceType: nft2.type,
    targetId: collection1.id,
    targetType: collection1.type,
    relationshipType: RelationshipType.BELONGS_TO,
    strength: 1.0,
    lastUpdated: Date.now()
  });
  
  // Collection1 created by Creator1
  dependencyTracker.registerRelationship({
    sourceId: collection1.id,
    sourceType: collection1.type,
    targetId: creator1.id,
    targetType: creator1.type,
    relationshipType: RelationshipType.CREATED_BY,
    strength: 1.0,
    lastUpdated: Date.now()
  });
  
  console.log('Registered 3 entity relationships');
  
  console.log('\n2. Simulating a price change event for NFT1...');
  
  // Analyze the impact of a price change to NFT1
  const changeImpact = dependencyTracker.analyzeChangeImpact(
    nft1.id,
    nft1.type,
    TrustScoreTypes.ChangeType.PRICE_CHANGE
  );
  
  console.log(`Change impact analysis results:`);
  console.log(`- Directly affected entities: ${changeImpact.directlyAffectedEntities.length}`);
  console.log(`- Indirectly affected entities: ${changeImpact.indirectlyAffectedEntities.length}`);
  console.log(`- Impact severity: ${changeImpact.impactSeverity.toFixed(2)}`);
  console.log(`- Recommended update scope: ${changeImpact.recommendedUpdateScope}`);
  
  console.log('\n3. Planning recalculation tasks...');
  
  // Plan recalculation tasks based on the change impact
  const tasks = selectiveRecalculator.planRecalculation(changeImpact);
  
  console.log(`Planned ${tasks.length} calculation tasks`);
  tasks.forEach((task, index) => {
    console.log(`Task ${index + 1}: ${task.entity.type}:${task.entity.id} (Priority: ${task.priority.toFixed(2)})`);
  });
  
  console.log('\n4. Executing calculation tasks...');
  
  // Execute the calculation tasks
  const results = await Promise.all(tasks.map(task => 
    selectiveRecalculator.executeCalculationTask(task)
  ));
  
  console.log(`Completed ${results.length} calculation tasks`);
  results.forEach((result, index) => {
    console.log(`Result ${index + 1}: ${result.entity.type}:${result.entity.id} (Success: ${result.success})`);
    console.log(`  Calculated factors: ${result.factors.join(', ')}`);
    console.log(`  Calculation time: ${result.calculationTime}ms`);
  });
  
  console.log('\n5. Registering cache entries...');
  
  // Register some cache entries
  const nft1CacheKey = cacheInvalidator.registerCacheEntry({
    key: `nft:${nft1.id}:data`,
    type: CacheEntryType.ENTITY,
    value: { name: 'Cool NFT', image: 'https://example.com/nft1.png' },
    relatedEntities: [nft1],
    isCritical: false
  });
  
  const collection1CacheKey = cacheInvalidator.registerCacheEntry({
    key: `collection:${collection1.id}:data`,
    type: CacheEntryType.ENTITY,
    value: { name: 'Awesome Collection', items: 100 },
    relatedEntities: [collection1],
    isCritical: true
  });
  
  const queryResultCacheKey = cacheInvalidator.registerCacheEntry({
    key: `query:collection:${collection1.id}:nfts`,
    type: CacheEntryType.QUERY_RESULT,
    value: [{ id: nft1.id, name: 'Cool NFT' }, { id: nft2.id, name: 'Another NFT' }],
    relatedEntities: [collection1, nft1, nft2],
    isCritical: false
  });
  
  console.log(`Registered 3 cache entries`);
  
  console.log('\n6. Invalidating cache based on change impact...');
  
  // Invalidate cache entries based on the change impact
  const invalidationResult = cacheInvalidator.invalidateBasedOnChangeImpact(changeImpact);
  
  console.log(`Invalidation results:`);
  console.log(`- Invalidated entries: ${invalidationResult.invalidatedCount}`);
  console.log(`- Critical data invalidated: ${invalidationResult.criticalDataInvalidated}`);
  console.log(`- Partially updated entries: ${invalidationResult.partiallyUpdatedEntries.size}`);
  
  console.log('\n7. Verifying cache consistency...');
  
  // Verify cache consistency
  const fixedEntries = cacheInvalidator.verifyConsistency();
  
  console.log(`Fixed ${fixedEntries} inconsistent cache entries`);
  
  console.log('\nIncremental Update System Demo Completed');
}

// Run the demo
runIncrementalUpdateDemo().catch(error => {
  console.error('Error in demo:', error);
});
# Incremental Update System

The Incremental Update System is a core component of the NFT TrustScore Real-Time Update Engine. It enables efficient updates to trust scores, price predictions, and risk assessments without unnecessary recalculation of all factors.

## Purpose

The primary goal of this system is to optimize the update process by:

1. Tracking dependencies between entities (NFTs, collections, creators, etc.)
2. Analyzing the impact of changes to determine update scope
3. Selectively recalculating only the necessary factors
4. Managing cache invalidation with precision

This approach significantly reduces computational overhead and improves response time for real-time updates.

## Components

The Incremental Update System consists of three main components:

### 1. Dependency Tracker

The `DependencyTracker` manages relationships between entities and analyzes the impact of changes:

- **Entity Relationship Mapping**: Tracks connections between NFTs, collections, creators, wallets, etc.
- **Change Impact Analysis**: Determines which entities are affected by a change and how severely

### 2. Selective Recalculator

The `SelectiveRecalculator` efficiently updates only the necessary components:

- **Efficient Update Strategies**: Uses factor-specific recalculation and delta-based updates
- **Optimization Techniques**: Implements caching, batching, and parallel processing

### 3. Cache Invalidator

The `CacheInvalidator` precisely manages cached data:

- **Invalidation Strategies**: Implements entity-level and query-result invalidation
- **Cache Management**: Handles versioning, partial updates, and background refresh

## Usage

### Basic Integration

```typescript
import { DependencyTracker, SelectiveRecalculator, CacheInvalidator } from './incremental';
import { TrustScoreTypes } from '../../types';

// Initialize components
const dependencyTracker = new DependencyTracker();
const selectiveRecalculator = new SelectiveRecalculator(dependencyTracker, factorCalculators);
const cacheInvalidator = new CacheInvalidator(dependencyTracker);

// Register entity relationships
dependencyTracker.registerRelationship({
  sourceId: 'nft123',
  sourceType: TrustScoreTypes.EntityType.NFT,
  targetId: 'collection456',
  targetType: TrustScoreTypes.EntityType.COLLECTION,
  relationshipType: RelationshipType.BELONGS_TO,
  strength: 1.0,
  lastUpdated: Date.now()
});

// When an event occurs, analyze its impact
const changeImpact = dependencyTracker.analyzeChangeImpact(
  'nft123',
  TrustScoreTypes.EntityType.NFT,
  TrustScoreTypes.ChangeType.PRICE_CHANGE
);

// Plan and execute recalculation tasks
const tasks = selectiveRecalculator.planRecalculation(changeImpact);
const results = await Promise.all(tasks.map(task => 
  selectiveRecalculator.executeCalculationTask(task)
));

// Invalidate affected cache entries
cacheInvalidator.invalidateBasedOnChangeImpact(changeImpact);
```

### Advanced Features

- **Dependency Graph Maintenance**: `dependencyTracker.rebuildDependencyGraph()`
- **Significance Thresholds**: Configure `changeSignificanceThreshold` in `SelectiveRecalculatorConfig`
- **Cache Warming**: `cacheInvalidator.warmCache(entities, refreshFunction)`
- **Partial Cache Updates**: Enable with `enablePartialUpdates` in `CacheInvalidatorConfig`

## Performance Considerations

- The system is designed to scale with increasing numbers of entities and relationships
- Dependency tracking has O(n) space complexity where n is the number of relationships
- Cache invalidation is optimized to minimize unnecessary recalculations
- Background refresh ensures critical data remains available even after invalidation

## Integration with Real-Time Update Engine

This system is designed to work seamlessly with the existing `RealTimeUpdateEngine` and `IncrementalUpdateManager`. It provides the underlying implementation for efficient incremental updates based on event-driven changes.
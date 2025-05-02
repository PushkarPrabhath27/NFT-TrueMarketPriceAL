/**
 * CacheInvalidator.ts
 * 
 * Implements the Cache Invalidation component of the Incremental Update System.
 * Responsible for precisely invalidating cached data when changes occur.
 */

import { TrustScoreTypes } from '../../types';
import { DependencyTracker, ChangeImpactResult, UpdateScope } from './DependencyTracker';

/**
 * Configuration for cache invalidation
 */
export interface CacheInvalidatorConfig {
  // Whether to use versioned cache entries
  useVersionedCache: boolean;
  // Whether to enable partial cache updates
  enablePartialUpdates: boolean;
  // Time-to-live for cache entries (in milliseconds)
  defaultTTL: number;
  // Whether to refresh critical data in the background
  backgroundRefresh: boolean;
  // Interval for cache consistency verification (in milliseconds)
  consistencyCheckInterval: number;
}

/**
 * Types of cache entries
 */
export enum CacheEntryType {
  ENTITY = 'entity',           // Single entity data
  QUERY_RESULT = 'query_result', // Result of a query
  COMPUTED_VALUE = 'computed_value', // Computed value
  AGGREGATE = 'aggregate',     // Aggregate data
}

/**
 * Represents a cache entry
 */
export interface CacheEntry {
  // Unique key for the cache entry
  key: string;
  // Type of cache entry
  type: CacheEntryType;
  // Value stored in the cache
  value: any;
  // Version of the cache entry
  version: number;
  // When the entry was created
  createdAt: number;
  // When the entry expires
  expiresAt: number;
  // Related entities that could invalidate this entry
  relatedEntities: TrustScoreTypes.EntityReference[];
  // Whether this is critical data that should be refreshed in the background
  isCritical: boolean;
}

/**
 * Result of a cache invalidation operation
 */
export interface InvalidationResult {
  // Number of entries invalidated
  invalidatedCount: number;
  // Keys of invalidated entries
  invalidatedKeys: string[];
  // Whether any critical data was invalidated
  criticalDataInvalidated: boolean;
  // Entries that were partially updated
  partiallyUpdatedEntries: Map<string, any>;
}

/**
 * Manages cache invalidation for the incremental update system
 */
export class CacheInvalidator {
  private config: CacheInvalidatorConfig;
  private dependencyTracker: DependencyTracker;
  private cacheEntries: Map<string, CacheEntry>;
  private entityToCacheKeys: Map<string, Set<string>>;
  private versionCounter: number;
  private lastConsistencyCheck: number;
  private refreshQueue: Set<string>;
  private refreshInProgress: boolean;
  
  /**
   * Initialize the Cache Invalidator
   * 
   * @param dependencyTracker Reference to the dependency tracker
   * @param config Configuration for cache invalidation
   */
  constructor(
    dependencyTracker: DependencyTracker,
    config: CacheInvalidatorConfig = {
      useVersionedCache: true,
      enablePartialUpdates: true,
      defaultTTL: 3600000, // 1 hour
      backgroundRefresh: true,
      consistencyCheckInterval: 86400000, // 24 hours
    }
  ) {
    this.dependencyTracker = dependencyTracker;
    this.config = config;
    this.cacheEntries = new Map();
    this.entityToCacheKeys = new Map();
    this.versionCounter = 1;
    this.lastConsistencyCheck = Date.now();
    this.refreshQueue = new Set();
    this.refreshInProgress = false;
    
    // Start background refresh if enabled
    if (this.config.backgroundRefresh) {
      this.startBackgroundRefresh();
    }
    
    // Schedule consistency check
    this.scheduleConsistencyCheck();
  }
  
  /**
   * Register a cache entry
   * 
   * @param entry Cache entry to register
   * @returns Key of the registered entry
   */
  public registerCacheEntry(entry: Omit<CacheEntry, 'version' | 'createdAt' | 'expiresAt'>): string {
    const now = Date.now();
    const version = this.versionCounter++;
    const expiresAt = now + this.config.defaultTTL;
    
    const fullEntry: CacheEntry = {
      ...entry,
      version,
      createdAt: now,
      expiresAt,
    };
    
    // Store the entry
    this.cacheEntries.set(entry.key, fullEntry);
    
    // Update entity to cache key mappings
    entry.relatedEntities.forEach(entity => {
      const entityKey = this.getEntityKey(entity);
      
      if (!this.entityToCacheKeys.has(entityKey)) {
        this.entityToCacheKeys.set(entityKey, new Set());
      }
      
      this.entityToCacheKeys.get(entityKey)!.add(entry.key);
    });
    
    return entry.key;
  }
  
  /**
   * Get a cache entry
   * 
   * @param key Key of the entry to get
   * @returns The cache entry, or undefined if not found or expired
   */
  public getCacheEntry(key: string): CacheEntry | undefined {
    if (!this.cacheEntries.has(key)) {
      return undefined;
    }
    
    const entry = this.cacheEntries.get(key)!;
    const now = Date.now();
    
    // Check if the entry has expired
    if (entry.expiresAt < now) {
      // Remove expired entry
      this.cacheEntries.delete(key);
      this.removeEntityMappings(entry);
      return undefined;
    }
    
    return entry;
  }
  
  /**
   * Invalidate cache entries based on a change impact analysis
   * 
   * @param changeImpact Result of change impact analysis
   * @returns Result of the invalidation operation
   */
  public invalidateBasedOnChangeImpact(changeImpact: ChangeImpactResult): InvalidationResult {
    const invalidatedKeys: string[] = [];
    const partiallyUpdatedEntries = new Map<string, any>();
    let criticalDataInvalidated = false;
    
    // Determine which entities to invalidate based on update scope
    const entitiesToInvalidate: TrustScoreTypes.EntityReference[] = [];
    
    // Always invalidate directly affected entities
    entitiesToInvalidate.push(...changeImpact.directlyAffectedEntities);
    
    // Invalidate indirectly affected entities based on update scope
    if (
      changeImpact.recommendedUpdateScope === UpdateScope.FULL_PROPAGATION ||
      (changeImpact.recommendedUpdateScope === UpdateScope.SELECTIVE && changeImpact.impactSeverity >= 0.5)
    ) {
      entitiesToInvalidate.push(...changeImpact.indirectlyAffectedEntities);
    }
    
    // Process each entity
    entitiesToInvalidate.forEach(entity => {
      const entityKey = this.getEntityKey(entity);
      
      if (this.entityToCacheKeys.has(entityKey)) {
        const cacheKeys = this.entityToCacheKeys.get(entityKey)!;
        
        cacheKeys.forEach(cacheKey => {
          if (!invalidatedKeys.includes(cacheKey)) {
            const entry = this.cacheEntries.get(cacheKey);
            
            if (entry) {
              // Check if this is critical data
              if (entry.isCritical) {
                criticalDataInvalidated = true;
                
                // Add to refresh queue if background refresh is enabled
                if (this.config.backgroundRefresh) {
                  this.refreshQueue.add(cacheKey);
                }
              }
              
              // Handle partial updates if enabled
              if (this.config.enablePartialUpdates && entry.type === CacheEntryType.QUERY_RESULT) {
                const partialUpdate = this.createPartialUpdate(entry, entity);
                
                if (partialUpdate) {
                  partiallyUpdatedEntries.set(cacheKey, partialUpdate);
                  return; // Skip full invalidation
                }
              }
              
              // Perform full invalidation
              this.cacheEntries.delete(cacheKey);
              invalidatedKeys.push(cacheKey);
            }
          }
        });
      }
    });
    
    // Update entity mappings for invalidated entries
    invalidatedKeys.forEach(key => {
      const entry = this.cacheEntries.get(key);
      
      if (entry) {
        this.removeEntityMappings(entry);
      }
    });
    
    // Start background refresh if critical data was invalidated
    if (criticalDataInvalidated && this.config.backgroundRefresh && !this.refreshInProgress) {
      this.processRefreshQueue();
    }
    
    return {
      invalidatedCount: invalidatedKeys.length,
      invalidatedKeys,
      criticalDataInvalidated,
      partiallyUpdatedEntries,
    };
  }
  
  /**
   * Invalidate a specific cache entry
   * 
   * @param key Key of the entry to invalidate
   * @returns True if the entry was invalidated
   */
  public invalidateCacheEntry(key: string): boolean {
    if (!this.cacheEntries.has(key)) {
      return false;
    }
    
    const entry = this.cacheEntries.get(key)!;
    
    // Remove the entry
    this.cacheEntries.delete(key);
    this.removeEntityMappings(entry);
    
    return true;
  }
  
  /**
   * Invalidate all cache entries related to an entity
   * 
   * @param entity Entity to invalidate cache for
   * @returns Number of entries invalidated
   */
  public invalidateEntityCache(
    entity: TrustScoreTypes.EntityReference
  ): number {
    const entityKey = this.getEntityKey(entity);
    
    if (!this.entityToCacheKeys.has(entityKey)) {
      return 0;
    }
    
    const cacheKeys = Array.from(this.entityToCacheKeys.get(entityKey)!);
    let invalidatedCount = 0;
    
    cacheKeys.forEach(key => {
      if (this.invalidateCacheEntry(key)) {
        invalidatedCount++;
      }
    });
    
    return invalidatedCount;
  }
  
  /**
   * Warm the cache after mass invalidation
   * 
   * @param entities Entities to warm cache for
   * @param refreshFunction Function to refresh cache entries
   */
  public async warmCache(
    entities: TrustScoreTypes.EntityReference[],
    refreshFunction: (entity: TrustScoreTypes.EntityReference) => Promise<any>
  ): Promise<void> {
    // Process entities in batches to avoid overwhelming the system
    const batchSize = 10;
    
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      const promises = batch.map(entity => refreshFunction(entity));
      
      await Promise.all(promises);
    }
  }
  
  /**
   * Verify cache consistency
   * 
   * @returns Number of inconsistent entries fixed
   */
  public verifyConsistency(): number {
    const now = Date.now();
    let fixedCount = 0;
    
    // Check for expired entries
    this.cacheEntries.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        this.cacheEntries.delete(key);
        this.removeEntityMappings(entry);
        fixedCount++;
      }
    });
    
    // Check for orphaned entity mappings
    this.entityToCacheKeys.forEach((cacheKeys, entityKey) => {
      const validKeys = new Set<string>();
      
      cacheKeys.forEach(key => {
        if (this.cacheEntries.has(key)) {
          validKeys.add(key);
        }
      });
      
      if (validKeys.size !== cacheKeys.size) {
        this.entityToCacheKeys.set(entityKey, validKeys);
        fixedCount++;
      }
    });
    
    this.lastConsistencyCheck = now;
    
    return fixedCount;
  }
  
  /**
   * Get a unique key for an entity
   * 
   * @param entity Entity reference
   * @returns Unique key for the entity
   */
  private getEntityKey(entity: TrustScoreTypes.EntityReference): string {
    return `${entity.type}:${entity.id}`;
  }
  
  /**
   * Remove entity to cache key mappings for an entry
   * 
   * @param entry Cache entry to remove mappings for
   */
  private removeEntityMappings(entry: CacheEntry): void {
    entry.relatedEntities.forEach(entity => {
      const entityKey = this.getEntityKey(entity);
      
      if (this.entityToCacheKeys.has(entityKey)) {
        const cacheKeys = this.entityToCacheKeys.get(entityKey)!;
        cacheKeys.delete(entry.key);
        
        if (cacheKeys.size === 0) {
          this.entityToCacheKeys.delete(entityKey);
        }
      }
    });
  }
  
  /**
   * Create a partial update for a cache entry
   * 
   * @param entry Cache entry to update
   * @param changedEntity Entity that changed
   * @returns Partial update, or undefined if not possible
   */
  private createPartialUpdate(entry: CacheEntry, changedEntity: TrustScoreTypes.EntityReference): any | undefined {
    // This is a simplified implementation that would need to be customized
    // based on the specific structure of cached data
    
    if (entry.type !== CacheEntryType.QUERY_RESULT || !Array.isArray(entry.value)) {
      return undefined;
    }
    
    // For array results, we can try to update just the changed entity
    const entityKey = this.getEntityKey(changedEntity);
    const updatedValue = [...entry.value];
    let updated = false;
    
    // Find and remove the changed entity from the array
    for (let i = 0; i < updatedValue.length; i++) {
      const item = updatedValue[i];
      
      if (item.id === changedEntity.id && item.type === changedEntity.type) {
        updatedValue.splice(i, 1);
        updated = true;
        break;
      }
    }
    
    if (updated) {
      // Update the cache entry with the new value
      const updatedEntry: CacheEntry = {
        ...entry,
        value: updatedValue,
        version: this.versionCounter++,
      };
      
      this.cacheEntries.set(entry.key, updatedEntry);
      return updatedValue;
    }
    
    return undefined;
  }
  
  /**
   * Start background refresh process
   */
  private startBackgroundRefresh(): void {
    // Check refresh queue periodically
    setInterval(() => {
      if (this.refreshQueue.size > 0 && !this.refreshInProgress) {
        this.processRefreshQueue();
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Process the refresh queue
   */
  private async processRefreshQueue(): Promise<void> {
    if (this.refreshInProgress || this.refreshQueue.size === 0) {
      return;
    }
    
    this.refreshInProgress = true;
    
    try {
      const keysToRefresh = Array.from(this.refreshQueue);
      this.refreshQueue.clear();
      
      // This would need to be implemented with actual refresh logic
      // For now, we just simulate the refresh
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`Refreshed ${keysToRefresh.length} cache entries in the background`);
    } catch (error) {
      console.error('Error refreshing cache:', error);
    } finally {
      this.refreshInProgress = false;
    }
  }
  
  /**
   * Schedule a consistency check
   */
  private scheduleConsistencyCheck(): void {
    setInterval(() => {
      const inconsistentEntries = this.verifyConsistency();
      
      if (inconsistentEntries > 0) {
        console.log(`Fixed ${inconsistentEntries} inconsistent cache entries`);
      }
    }, this.config.consistencyCheckInterval);
  }
}
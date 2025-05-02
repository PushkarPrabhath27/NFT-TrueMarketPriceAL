/**
 * DependencyTracker.ts
 * 
 * Implements the Dependency Tracking component of the Incremental Update System.
 * Responsible for tracking relationships between entities and analyzing the impact of changes.
 */

import { TrustScoreTypes } from '../../types';

/**
 * Configuration for dependency tracking
 */
export interface DependencyTrackerConfig {
  // Maximum depth for dependency graph traversal
  maxDependencyDepth: number;
  // Whether to cache dependency relationships
  cacheDependencies: boolean;
  // Maximum number of dependencies to track per entity
  maxDependenciesPerEntity: number;
  // Interval for refreshing dependency cache (in milliseconds)
  dependencyCacheRefreshInterval: number;
}

/**
 * Represents a relationship between entities
 */
export interface EntityRelationship {
  // Source entity ID
  sourceId: string;
  // Source entity type (NFT, collection, creator, etc.)
  sourceType: TrustScoreTypes.EntityType;
  // Target entity ID
  targetId: string;
  // Target entity type
  targetType: TrustScoreTypes.EntityType;
  // Type of relationship
  relationshipType: RelationshipType;
  // Strength of relationship (0-1)
  strength: number;
  // When the relationship was last updated
  lastUpdated: number;
}

/**
 * Types of relationships between entities
 */
export enum RelationshipType {
  BELONGS_TO = 'belongs_to',           // NFT belongs to collection
  CREATED_BY = 'created_by',           // NFT created by creator
  OWNED_BY = 'owned_by',               // NFT owned by wallet
  TRADED_IN = 'traded_in',             // NFT traded in transaction
  AFFECTS_RARITY = 'affects_rarity',   // Attribute affects rarity
  AFFECTS_PRICE = 'affects_price',     // Factor affects price
  RELATED_TO = 'related_to',           // General relationship
}

/**
 * Result of impact analysis for a change
 */
export interface ChangeImpactResult {
  // Entities directly affected by the change
  directlyAffectedEntities: TrustScoreTypes.EntityReference[];
  // Entities indirectly affected by the change
  indirectlyAffectedEntities: TrustScoreTypes.EntityReference[];
  // Severity of impact (0-1)
  impactSeverity: number;
  // Propagation path through the dependency graph
  propagationPath: EntityRelationship[];
  // Recommended update scope
  recommendedUpdateScope: UpdateScope;
}

/**
 * Scope of update to perform
 */
export enum UpdateScope {
  ENTITY_ONLY = 'entity_only',         // Update only the entity
  DIRECT_DEPENDENCIES = 'direct_dependencies', // Update entity and direct dependencies
  FULL_PROPAGATION = 'full_propagation', // Update all affected entities
  SELECTIVE = 'selective',             // Update based on impact severity
}

/**
 * Manages dependency tracking between entities and analyzes change impact
 */
export class DependencyTracker {
  private config: DependencyTrackerConfig;
  private entityRelationships: Map<string, Set<EntityRelationship>>;
  private dependencyGraph: Map<string, Map<string, EntityRelationship>>;
  private lastGraphUpdate: number;
  
  /**
   * Initialize the Dependency Tracker
   * 
   * @param config Configuration for dependency tracking
   */
  constructor(config: DependencyTrackerConfig = {
    maxDependencyDepth: 3,
    cacheDependencies: true,
    maxDependenciesPerEntity: 1000,
    dependencyCacheRefreshInterval: 3600000, // 1 hour
  }) {
    this.config = config;
    this.entityRelationships = new Map();
    this.dependencyGraph = new Map();
    this.lastGraphUpdate = Date.now();
  }
  
  /**
   * Register a relationship between entities
   * 
   * @param relationship The relationship to register
   * @returns True if the relationship was registered successfully
   */
  public registerRelationship(relationship: EntityRelationship): boolean {
    const sourceKey = this.getEntityKey(relationship.sourceId, relationship.sourceType);
    const targetKey = this.getEntityKey(relationship.targetId, relationship.targetType);
    
    // Initialize sets if they don't exist
    if (!this.entityRelationships.has(sourceKey)) {
      this.entityRelationships.set(sourceKey, new Set());
    }
    if (!this.entityRelationships.has(targetKey)) {
      this.entityRelationships.set(targetKey, new Set());
    }
    
    // Add relationship to source entity's relationships
    const sourceRelationships = this.entityRelationships.get(sourceKey)!;
    sourceRelationships.add(relationship);
    
    // Update dependency graph if caching is enabled
    if (this.config.cacheDependencies) {
      this.updateDependencyGraph(relationship);
    }
    
    return true;
  }
  
  /**
   * Remove a relationship between entities
   * 
   * @param sourceId Source entity ID
   * @param sourceType Source entity type
   * @param targetId Target entity ID
   * @param targetType Target entity type
   * @param relationshipType Type of relationship
   * @returns True if the relationship was removed successfully
   */
  public removeRelationship(
    sourceId: string,
    sourceType: TrustScoreTypes.EntityType,
    targetId: string,
    targetType: TrustScoreTypes.EntityType,
    relationshipType: RelationshipType
  ): boolean {
    const sourceKey = this.getEntityKey(sourceId, sourceType);
    const targetKey = this.getEntityKey(targetId, targetType);
    
    if (!this.entityRelationships.has(sourceKey)) {
      return false;
    }
    
    const sourceRelationships = this.entityRelationships.get(sourceKey)!;
    let removed = false;
    
    // Find and remove the relationship
    sourceRelationships.forEach(relationship => {
      if (
        relationship.targetId === targetId &&
        relationship.targetType === targetType &&
        relationship.relationshipType === relationshipType
      ) {
        sourceRelationships.delete(relationship);
        removed = true;
      }
    });
    
    // Update dependency graph if caching is enabled and a relationship was removed
    if (removed && this.config.cacheDependencies) {
      this.rebuildDependencyGraph();
    }
    
    return removed;
  }
  
  /**
   * Analyze the impact of a change to an entity
   * 
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param changeType Type of change
   * @param changeData Additional data about the change
   * @returns Analysis of the change impact
   */
  public analyzeChangeImpact(
    entityId: string,
    entityType: TrustScoreTypes.EntityType,
    changeType: TrustScoreTypes.ChangeType,
    changeData?: any
  ): ChangeImpactResult {
    const entityKey = this.getEntityKey(entityId, entityType);
    const directlyAffectedEntities: TrustScoreTypes.EntityReference[] = [];
    const indirectlyAffectedEntities: TrustScoreTypes.EntityReference[] = [];
    const propagationPath: EntityRelationship[] = [];
    
    // Add the changed entity itself
    directlyAffectedEntities.push({
      id: entityId,
      type: entityType
    });
    
    // Find directly affected entities
    if (this.entityRelationships.has(entityKey)) {
      const relationships = this.entityRelationships.get(entityKey)!;
      
      relationships.forEach(relationship => {
        // Add target entity to directly affected entities
        directlyAffectedEntities.push({
          id: relationship.targetId,
          type: relationship.targetType
        });
        
        // Add relationship to propagation path
        propagationPath.push(relationship);
      });
    }
    
    // Find indirectly affected entities through dependency graph traversal
    if (this.config.cacheDependencies) {
      this.findIndirectDependencies(
        entityKey,
        indirectlyAffectedEntities,
        propagationPath,
        new Set([entityKey]),
        1,
        this.config.maxDependencyDepth
      );
    }
    
    // Calculate impact severity based on number and type of affected entities
    const impactSeverity = this.calculateImpactSeverity(
      directlyAffectedEntities,
      indirectlyAffectedEntities,
      changeType
    );
    
    // Determine recommended update scope based on impact severity
    const recommendedUpdateScope = this.determineUpdateScope(impactSeverity);
    
    return {
      directlyAffectedEntities,
      indirectlyAffectedEntities,
      impactSeverity,
      propagationPath,
      recommendedUpdateScope
    };
  }
  
  /**
   * Get all relationships for an entity
   * 
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Set of relationships for the entity
   */
  public getEntityRelationships(
    entityId: string,
    entityType: TrustScoreTypes.EntityType
  ): Set<EntityRelationship> {
    const entityKey = this.getEntityKey(entityId, entityType);
    
    if (!this.entityRelationships.has(entityKey)) {
      return new Set();
    }
    
    return this.entityRelationships.get(entityKey)!;
  }
  
  /**
   * Rebuild the entire dependency graph
   * This is an expensive operation and should be used sparingly
   */
  public rebuildDependencyGraph(): void {
    if (!this.config.cacheDependencies) {
      return;
    }
    
    this.dependencyGraph.clear();
    
    // Iterate through all relationships and add them to the graph
    this.entityRelationships.forEach((relationships, sourceKey) => {
      relationships.forEach(relationship => {
        this.updateDependencyGraph(relationship);
      });
    });
    
    this.lastGraphUpdate = Date.now();
  }
  
  /**
   * Get a unique key for an entity
   * 
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Unique key for the entity
   */
  private getEntityKey(entityId: string, entityType: TrustScoreTypes.EntityType): string {
    return `${entityType}:${entityId}`;
  }
  
  /**
   * Update the dependency graph with a new relationship
   * 
   * @param relationship The relationship to add to the graph
   */
  private updateDependencyGraph(relationship: EntityRelationship): void {
    const sourceKey = this.getEntityKey(relationship.sourceId, relationship.sourceType);
    const targetKey = this.getEntityKey(relationship.targetId, relationship.targetType);
    
    // Initialize maps if they don't exist
    if (!this.dependencyGraph.has(sourceKey)) {
      this.dependencyGraph.set(sourceKey, new Map());
    }
    if (!this.dependencyGraph.has(targetKey)) {
      this.dependencyGraph.set(targetKey, new Map());
    }
    
    // Add relationship to source -> target mapping
    const sourceDependencies = this.dependencyGraph.get(sourceKey)!;
    sourceDependencies.set(targetKey, relationship);
  }
  
  /**
   * Find indirect dependencies through recursive graph traversal
   * 
   * @param entityKey Current entity key
   * @param indirectlyAffectedEntities Array to populate with indirectly affected entities
   * @param propagationPath Array to populate with the propagation path
   * @param visitedKeys Set of already visited entity keys
   * @param currentDepth Current depth in the traversal
   * @param maxDepth Maximum depth to traverse
   */
  private findIndirectDependencies(
    entityKey: string,
    indirectlyAffectedEntities: TrustScoreTypes.EntityReference[],
    propagationPath: EntityRelationship[],
    visitedKeys: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): void {
    if (currentDepth >= maxDepth || !this.dependencyGraph.has(entityKey)) {
      return;
    }
    
    const dependencies = this.dependencyGraph.get(entityKey)!;
    
    dependencies.forEach((relationship, targetKey) => {
      if (!visitedKeys.has(targetKey)) {
        // Add target entity to indirectly affected entities
        indirectlyAffectedEntities.push({
          id: relationship.targetId,
          type: relationship.targetType
        });
        
        // Add relationship to propagation path
        propagationPath.push(relationship);
        
        // Mark as visited to prevent cycles
        visitedKeys.add(targetKey);
        
        // Recursively find dependencies of this entity
        this.findIndirectDependencies(
          targetKey,
          indirectlyAffectedEntities,
          propagationPath,
          visitedKeys,
          currentDepth + 1,
          maxDepth
        );
      }
    });
  }
  
  /**
   * Calculate the severity of impact based on affected entities
   * 
   * @param directlyAffectedEntities Directly affected entities
   * @param indirectlyAffectedEntities Indirectly affected entities
   * @param changeType Type of change
   * @returns Impact severity (0-1)
   */
  private calculateImpactSeverity(
    directlyAffectedEntities: TrustScoreTypes.EntityReference[],
    indirectlyAffectedEntities: TrustScoreTypes.EntityReference[],
    changeType: TrustScoreTypes.ChangeType
  ): number {
    // Base impact from directly affected entities
    const directImpact = directlyAffectedEntities.length * 0.1;
    
    // Reduced impact from indirectly affected entities
    const indirectImpact = indirectlyAffectedEntities.length * 0.02;
    
    // Additional impact based on change type
    let changeTypeImpact = 0;
    switch (changeType) {
      case TrustScoreTypes.ChangeType.OWNERSHIP_CHANGE:
        changeTypeImpact = 0.3;
        break;
      case TrustScoreTypes.ChangeType.PRICE_CHANGE:
        changeTypeImpact = 0.4;
        break;
      case TrustScoreTypes.ChangeType.METADATA_UPDATE:
        changeTypeImpact = 0.2;
        break;
      case TrustScoreTypes.ChangeType.FRAUD_DETECTION:
        changeTypeImpact = 0.8;
        break;
      default:
        changeTypeImpact = 0.1;
    }
    
    // Calculate total impact, capped at 1.0
    const totalImpact = Math.min(directImpact + indirectImpact + changeTypeImpact, 1.0);
    
    return totalImpact;
  }
  
  /**
   * Determine the appropriate update scope based on impact severity
   * 
   * @param impactSeverity Severity of impact (0-1)
   * @returns Recommended update scope
   */
  private determineUpdateScope(impactSeverity: number): UpdateScope {
    if (impactSeverity < 0.2) {
      return UpdateScope.ENTITY_ONLY;
    } else if (impactSeverity < 0.5) {
      return UpdateScope.DIRECT_DEPENDENCIES;
    } else if (impactSeverity < 0.8) {
      return UpdateScope.SELECTIVE;
    } else {
      return UpdateScope.FULL_PROPAGATION;
    }
  }
}
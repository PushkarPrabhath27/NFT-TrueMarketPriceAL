/**
 * SelectiveRecalculator.ts
 * 
 * Implements the Selective Recalculation component of the Incremental Update System.
 * Responsible for efficiently updating only the necessary components without full recalculation.
 */

import { TrustScoreTypes } from '../../types';
import { DependencyTracker, UpdateScope, ChangeImpactResult } from './DependencyTracker';

/**
 * Configuration for selective recalculation
 */
export interface SelectiveRecalculatorConfig {
  // Threshold for considering a change significant enough to trigger recalculation (0-1)
  changeSignificanceThreshold: number;
  // Whether to use cached intermediate results when possible
  useCachedResults: boolean;
  // Maximum age of cached results to use (in milliseconds)
  maxCachedResultAge: number;
  // Whether to use parallel processing for independent calculations
  enableParallelProcessing: boolean;
  // Maximum number of parallel calculations
  maxParallelCalculations: number;
}

/**
 * Represents a calculation task to be performed
 */
export interface CalculationTask {
  // Entity to recalculate
  entity: TrustScoreTypes.EntityReference;
  // Factors to recalculate (empty array means all factors)
  factors: string[];
  // Priority of the calculation (0-1)
  priority: number;
  // Estimated cost of the calculation (arbitrary units)
  estimatedCost: number;
  // Whether the calculation can be performed lazily
  canBeLazy: boolean;
  // Dependencies that must be calculated first
  dependencies: CalculationTask[];
}

/**
 * Result of a calculation task
 */
export interface CalculationResult {
  // Entity that was recalculated
  entity: TrustScoreTypes.EntityReference;
  // Factors that were recalculated
  factors: string[];
  // Whether the calculation was successful
  success: boolean;
  // New values for the factors
  newValues: Map<string, any>;
  // Previous values for the factors
  previousValues: Map<string, any>;
  // Change magnitude for each factor (0-1)
  changeMagnitude: Map<string, number>;
  // Time taken for the calculation (in milliseconds)
  calculationTime: number;
  // Whether the calculation used cached results
  usedCache: boolean;
}

/**
 * Manages selective recalculation of trust score factors
 */
export class SelectiveRecalculator {
  private config: SelectiveRecalculatorConfig;
  private dependencyTracker: DependencyTracker;
  private factorCalculators: Map<string, Function>;
  private cachedResults: Map<string, Map<string, any>>;
  private cachedResultTimestamps: Map<string, Map<string, number>>;
  private activeCalculations: Set<string>;
  
  /**
   * Initialize the Selective Recalculator
   * 
   * @param dependencyTracker Reference to the dependency tracker
   * @param factorCalculators Map of factor calculator functions
   * @param config Configuration for selective recalculation
   */
  constructor(
    dependencyTracker: DependencyTracker,
    factorCalculators: Map<string, Function>,
    config: SelectiveRecalculatorConfig = {
      changeSignificanceThreshold: 0.05, // 5% change is significant
      useCachedResults: true,
      maxCachedResultAge: 3600000, // 1 hour
      enableParallelProcessing: true,
      maxParallelCalculations: 4,
    }
  ) {
    this.dependencyTracker = dependencyTracker;
    this.factorCalculators = factorCalculators;
    this.config = config;
    this.cachedResults = new Map();
    this.cachedResultTimestamps = new Map();
    this.activeCalculations = new Set();
  }
  
  /**
   * Plan recalculation tasks based on a change impact analysis
   * 
   * @param changeImpact Result of change impact analysis
   * @returns Array of calculation tasks to perform
   */
  public planRecalculation(changeImpact: ChangeImpactResult): CalculationTask[] {
    const tasks: CalculationTask[] = [];
    const processedEntities = new Set<string>();
    
    // Process directly affected entities first
    changeImpact.directlyAffectedEntities.forEach(entity => {
      const entityKey = this.getEntityKey(entity);
      
      if (!processedEntities.has(entityKey)) {
        processedEntities.add(entityKey);
        
        // Create a high-priority task for directly affected entities
        tasks.push(this.createCalculationTask(entity, [], 1.0));
      }
    });
    
    // Process indirectly affected entities based on update scope
    if (
      changeImpact.recommendedUpdateScope === UpdateScope.FULL_PROPAGATION ||
      changeImpact.recommendedUpdateScope === UpdateScope.SELECTIVE
    ) {
      changeImpact.indirectlyAffectedEntities.forEach(entity => {
        const entityKey = this.getEntityKey(entity);
        
        if (!processedEntities.has(entityKey)) {
          processedEntities.add(entityKey);
          
          // Create a lower-priority task for indirectly affected entities
          const priority = changeImpact.recommendedUpdateScope === UpdateScope.FULL_PROPAGATION ? 0.7 : 0.4;
          tasks.push(this.createCalculationTask(entity, [], priority));
        }
      });
    }
    
    // Organize tasks by dependencies
    this.organizeDependencies(tasks);
    
    return tasks;
  }
  
  /**
   * Execute a calculation task
   * 
   * @param task The calculation task to execute
   * @returns Result of the calculation
   */
  public async executeCalculationTask(task: CalculationTask): Promise<CalculationResult> {
    const entityKey = this.getEntityKey(task.entity);
    const startTime = Date.now();
    
    // Check if calculation is already in progress
    if (this.activeCalculations.has(entityKey)) {
      throw new Error(`Calculation for ${entityKey} is already in progress`);
    }
    
    this.activeCalculations.add(entityKey);
    
    try {
      // Determine which factors to calculate
      const factorsToCalculate = task.factors.length > 0 ?
        task.factors : Array.from(this.factorCalculators.keys());
      
      // Get previous values
      const previousValues = this.getPreviousValues(task.entity, factorsToCalculate);
      
      // Check if we can use cached results
      const usedCache = this.config.useCachedResults && this.canUseCachedResults(task.entity, factorsToCalculate);
      
      // Calculate new values
      const newValues = new Map<string, any>();
      
      // If we can use cached results, copy them
      if (usedCache) {
        factorsToCalculate.forEach(factor => {
          if (this.hasCachedResult(task.entity, factor)) {
            newValues.set(factor, this.getCachedResult(task.entity, factor));
          }
        });
      }
      
      // Calculate any remaining factors
      const remainingFactors = factorsToCalculate.filter(factor => !newValues.has(factor));
      
      if (remainingFactors.length > 0) {
        // Execute calculations in parallel if enabled
        if (this.config.enableParallelProcessing && remainingFactors.length > 1) {
          const calculationPromises = remainingFactors.map(factor => {
            return this.calculateFactor(task.entity, factor);
          });
          
          const results = await Promise.all(calculationPromises);
          
          remainingFactors.forEach((factor, index) => {
            newValues.set(factor, results[index]);
            this.cacheResult(task.entity, factor, results[index]);
          });
        } else {
          // Execute calculations sequentially
          for (const factor of remainingFactors) {
            const result = await this.calculateFactor(task.entity, factor);
            newValues.set(factor, result);
            this.cacheResult(task.entity, factor, result);
          }
        }
      }
      
      // Calculate change magnitude for each factor
      const changeMagnitude = new Map<string, number>();
      
      factorsToCalculate.forEach(factor => {
        const prevValue = previousValues.get(factor);
        const newValue = newValues.get(factor);
        
        if (prevValue !== undefined && newValue !== undefined) {
          changeMagnitude.set(factor, this.calculateChangeMagnitude(prevValue, newValue));
        } else {
          changeMagnitude.set(factor, 1.0); // Maximum change if no previous value
        }
      });
      
      const calculationTime = Date.now() - startTime;
      
      return {
        entity: task.entity,
        factors: factorsToCalculate,
        success: true,
        newValues,
        previousValues,
        changeMagnitude,
        calculationTime,
        usedCache
      };
    } catch (error) {
      console.error(`Error calculating ${entityKey}:`, error);
      
      return {
        entity: task.entity,
        factors: task.factors,
        success: false,
        newValues: new Map(),
        previousValues: new Map(),
        changeMagnitude: new Map(),
        calculationTime: Date.now() - startTime,
        usedCache: false
      };
    } finally {
      this.activeCalculations.delete(entityKey);
    }
  }
  
  /**
   * Check if a calculation result is significant enough to trigger updates
   * 
   * @param result Result of a calculation
   * @returns True if the change is significant
   */
  public isChangeSignificant(result: CalculationResult): boolean {
    // If any factor has a change magnitude greater than the threshold, it's significant
    for (const magnitude of result.changeMagnitude.values()) {
      if (magnitude >= this.config.changeSignificanceThreshold) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Clear all cached results
   */
  public clearCache(): void {
    this.cachedResults.clear();
    this.cachedResultTimestamps.clear();
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
   * Create a calculation task for an entity
   * 
   * @param entity Entity to calculate
   * @param factors Factors to calculate (empty array means all factors)
   * @param priority Priority of the calculation (0-1)
   * @returns Calculation task
   */
  private createCalculationTask(
    entity: TrustScoreTypes.EntityReference,
    factors: string[],
    priority: number
  ): CalculationTask {
    // Estimate the cost of the calculation based on entity type and factors
    const estimatedCost = this.estimateCalculationCost(entity, factors);
    
    // Determine if the calculation can be lazy based on priority
    const canBeLazy = priority < 0.5;
    
    return {
      entity,
      factors,
      priority,
      estimatedCost,
      canBeLazy,
      dependencies: []
    };
  }
  
  /**
   * Organize dependencies between calculation tasks
   * 
   * @param tasks Array of calculation tasks
   */
  private organizeDependencies(tasks: CalculationTask[]): void {
    const taskMap = new Map<string, CalculationTask>();
    
    // Create a map of tasks by entity key
    tasks.forEach(task => {
      taskMap.set(this.getEntityKey(task.entity), task);
    });
    
    // For each task, find its dependencies
    tasks.forEach(task => {
      const entityKey = this.getEntityKey(task.entity);
      
      // Get relationships for this entity
      const relationships = this.dependencyTracker.getEntityRelationships(
        task.entity.id,
        task.entity.type
      );
      
      // For each relationship, check if the target entity has a task
      relationships.forEach(relationship => {
        const targetKey = `${relationship.targetType}:${relationship.targetId}`;
        
        if (taskMap.has(targetKey)) {
          // Add the target task as a dependency
          task.dependencies.push(taskMap.get(targetKey)!);
        }
      });
    });
  }
  
  /**
   * Estimate the cost of a calculation
   * 
   * @param entity Entity to calculate
   * @param factors Factors to calculate
   * @returns Estimated cost in arbitrary units
   */
  private estimateCalculationCost(
    entity: TrustScoreTypes.EntityReference,
    factors: string[]
  ): number {
    // Base cost depends on entity type
    let baseCost = 1;
    
    switch (entity.type) {
      case TrustScoreTypes.EntityType.NFT:
        baseCost = 1;
        break;
      case TrustScoreTypes.EntityType.COLLECTION:
        baseCost = 5; // Collections are more expensive to calculate
        break;
      case TrustScoreTypes.EntityType.CREATOR:
        baseCost = 10; // Creators are even more expensive
        break;
      default:
        baseCost = 1;
    }
    
    // If specific factors are provided, adjust cost based on number of factors
    if (factors.length > 0) {
      return baseCost * factors.length;
    }
    
    // If calculating all factors, use the number of available calculators
    return baseCost * this.factorCalculators.size;
  }
  
  /**
   * Get previous values for factors
   * 
   * @param entity Entity to get values for
   * @param factors Factors to get values for
   * @returns Map of previous values
   */
  private getPreviousValues(entity: TrustScoreTypes.EntityReference, factors: string[]): Map<string, any> {
    const previousValues = new Map<string, any>();
    const entityKey = this.getEntityKey(entity);
    
    // Check if we have cached results for this entity
    if (this.cachedResults.has(entityKey)) {
      const entityCache = this.cachedResults.get(entityKey)!;
      
      // Copy cached values for each factor
      factors.forEach(factor => {
        if (entityCache.has(factor)) {
          previousValues.set(factor, entityCache.get(factor));
        }
      });
    }
    
    return previousValues;
  }
  
  /**
   * Check if we can use cached results for an entity and factors
   * 
   * @param entity Entity to check
   * @param factors Factors to check
   * @returns True if cached results can be used
   */
  private canUseCachedResults(entity: TrustScoreTypes.EntityReference, factors: string[]): boolean {
    const entityKey = this.getEntityKey(entity);
    const now = Date.now();
    
    // Check if we have cached timestamps for this entity
    if (!this.cachedResultTimestamps.has(entityKey)) {
      return false;
    }
    
    const timestamps = this.cachedResultTimestamps.get(entityKey)!;
    
    // Check if all factors have recent enough cached results
    for (const factor of factors) {
      if (!timestamps.has(factor)) {
        return false;
      }
      
      const timestamp = timestamps.get(factor)!;
      
      // Check if the cached result is too old
      if (now - timestamp > this.config.maxCachedResultAge) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if we have a cached result for an entity and factor
   * 
   * @param entity Entity to check
   * @param factor Factor to check
   * @returns True if a cached result exists
   */
  private hasCachedResult(entity: TrustScoreTypes.EntityReference, factor: string): boolean {
    const entityKey = this.getEntityKey(entity);
    
    return (
      this.cachedResults.has(entityKey) &&
      this.cachedResults.get(entityKey)!.has(factor)
    );
  }
  
  /**
   * Get a cached result for an entity and factor
   * 
   * @param entity Entity to get result for
   * @param factor Factor to get result for
   * @returns Cached result value
   */
  private getCachedResult(entity: TrustScoreTypes.EntityReference, factor: string): any {
    const entityKey = this.getEntityKey(entity);
    
    if (this.hasCachedResult(entity, factor)) {
      return this.cachedResults.get(entityKey)!.get(factor);
    }
    
    return undefined;
  }
  
  /**
   * Cache a result for an entity and factor
   * 
   * @param entity Entity to cache result for
   * @param factor Factor to cache result for
   * @param value Value to cache
   */
  private cacheResult(entity: TrustScoreTypes.EntityReference, factor: string, value: any): void {
    const entityKey = this.getEntityKey(entity);
    const now = Date.now();
    
    // Initialize maps if they don't exist
    if (!this.cachedResults.has(entityKey)) {
      this.cachedResults.set(entityKey, new Map());
    }
    if (!this.cachedResultTimestamps.has(entityKey)) {
      this.cachedResultTimestamps.set(entityKey, new Map());
    }
    
    // Cache the result and timestamp
    this.cachedResults.get(entityKey)!.set(factor, value);
    this.cachedResultTimestamps.get(entityKey)!.set(factor, now);
  }
  
  /**
   * Calculate a factor for an entity
   * 
   * @param entity Entity to calculate for
   * @param factor Factor to calculate
   * @returns Calculated value
   */
  private async calculateFactor(entity: TrustScoreTypes.EntityReference, factor: string): Promise<any> {
    // Get the calculator function for this factor
    const calculator = this.factorCalculators.get(factor);
    
    if (!calculator) {
      throw new Error(`No calculator found for factor ${factor}`);
    }
    
    // Call the calculator function with the entity
    return await calculator(entity);
  }
  
  /**
   * Calculate the magnitude of change between two values
   * 
   * @param prevValue Previous value
   * @param newValue New value
   * @returns Change magnitude (0-1)
   */
  private calculateChangeMagnitude(prevValue: any, newValue: any): number {
    // Handle different types of values
    if (typeof prevValue === 'number' && typeof newValue === 'number') {
      // For numbers, calculate relative change
      if (prevValue === 0) {
        return newValue === 0 ? 0 : 1;
      }
      
      return Math.min(Math.abs((newValue - prevValue) / prevValue), 1);
    } else if (typeof prevValue === 'boolean' && typeof newValue === 'boolean') {
      // For booleans, 1 if changed, 0 if not
      return prevValue === newValue ? 0 : 1;
    } else if (Array.isArray(prevValue) && Array.isArray(newValue)) {
      // For arrays, calculate Jaccard distance
      const prevSet = new Set(prevValue);
      const newSet = new Set(newValue);
      
      const union = new Set([...prevSet, ...newSet]);
      const intersection = new Set([...prevSet].filter(x => newSet.has(x)));
      
      return 1 - (intersection.size / union.size);
    } else if (typeof prevValue === 'object' && typeof newValue === 'object') {
      // For objects, calculate based on changed properties
      const prevKeys = Object.keys(prevValue || {});
      const newKeys = Object.keys(newValue || {});
      
      const allKeys = new Set([...prevKeys, ...newKeys]);
      let changedKeys = 0;
      
      allKeys.forEach(key => {
        if (prevValue[key] !== newValue[key]) {
          changedKeys++;
        }
      });
      
      return allKeys.size === 0 ? 0 : changedKeys / allKeys.size;
    } else {
      // For other types, 1 if changed, 0 if not
      return prevValue === newValue ? 0 : 1;
    }
  }
}
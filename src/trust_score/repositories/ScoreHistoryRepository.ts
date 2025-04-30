/**
 * ScoreHistoryRepository.ts
 * 
 * Repository for storing and retrieving trust score history.
 * This enables tracking of score changes over time and provides
 * data for historical analysis and visualization.
 */

import { TrustScoreTypes } from '../types';

/**
 * Responsible for storing and retrieving trust score history
 */
export class ScoreHistoryRepository {
  private historyRecords: Map<string, TrustScoreTypes.ScoreHistory>;
  private maxHistoryLength: number;
  
  /**
   * Initialize the Score History Repository
   * 
   * @param maxHistoryLength Maximum number of history points to keep per entity
   */
  constructor(maxHistoryLength: number = 100) {
    this.historyRecords = new Map<string, TrustScoreTypes.ScoreHistory>();
    this.maxHistoryLength = maxHistoryLength;
  }
  
  /**
   * Save score history for an entity
   * 
   * @param scoreHistory The score history to save
   */
  public saveScoreHistory(scoreHistory: TrustScoreTypes.ScoreHistory): void {
    const entityKey = this.getEntityKey(scoreHistory.entityType, scoreHistory.entityId);
    
    // Get existing history or create new
    const existingHistory = this.historyRecords.get(entityKey) || {
      entityId: scoreHistory.entityId,
      entityType: scoreHistory.entityType,
      history: []
    };
    
    // Merge histories, avoiding duplicates
    const mergedHistory = this.mergeHistories(existingHistory.history, scoreHistory.history);
    
    // Trim to max length if needed
    if (mergedHistory.length > this.maxHistoryLength) {
      // Sort by timestamp (newest first) and trim
      mergedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      mergedHistory.length = this.maxHistoryLength;
    }
    
    // Update the history record
    existingHistory.history = mergedHistory;
    this.historyRecords.set(entityKey, existingHistory);
  }
  
  /**
   * Get score history for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns The score history for the entity, or undefined if not found
   */
  public getScoreHistory(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string
  ): TrustScoreTypes.ScoreHistory | undefined {
    const entityKey = this.getEntityKey(entityType, entityId);
    return this.historyRecords.get(entityKey);
  }
  
  /**
   * Get score history for an entity within a time range
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @param startTime The start time of the range (ISO string)
   * @param endTime The end time of the range (ISO string)
   * @returns The score history for the entity within the time range
   */
  public getScoreHistoryInRange(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string,
    startTime: string,
    endTime: string
  ): TrustScoreTypes.ScoreHistory | undefined {
    const history = this.getScoreHistory(entityType, entityId);
    if (!history) return undefined;
    
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();
    
    // Filter history points within the time range
    const filteredHistory = history.history.filter(point => {
      const pointTimestamp = new Date(point.timestamp).getTime();
      return pointTimestamp >= startTimestamp && pointTimestamp <= endTimestamp;
    });
    
    return {
      entityId: history.entityId,
      entityType: history.entityType,
      history: filteredHistory
    };
  }
  
  /**
   * Get the most recent score history point for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns The most recent score history point, or undefined if not found
   */
  public getLatestScoreHistoryPoint(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string
  ): TrustScoreTypes.ScoreHistoryPoint | undefined {
    const history = this.getScoreHistory(entityType, entityId);
    if (!history || history.history.length === 0) return undefined;
    
    // Sort by timestamp (newest first) and return the first
    return [...history.history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }
  
  /**
   * Clear all history for an entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   */
  public clearHistory(
    entityType: 'nft' | 'creator' | 'collection',
    entityId: string
  ): void {
    const entityKey = this.getEntityKey(entityType, entityId);
    this.historyRecords.delete(entityKey);
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
   * Merge two history arrays, avoiding duplicates based on timestamp
   * 
   * @param existing Existing history points
   * @param newHistory New history points to merge
   * @returns Merged history array without duplicates
   */
  private mergeHistories(
    existing: TrustScoreTypes.ScoreHistoryPoint[],
    newHistory: TrustScoreTypes.ScoreHistoryPoint[]
  ): TrustScoreTypes.ScoreHistoryPoint[] {
    // Create a map of existing history points by timestamp
    const historyMap = new Map<string, TrustScoreTypes.ScoreHistoryPoint>();
    
    // Add existing history points to the map
    for (const point of existing) {
      historyMap.set(point.timestamp, point);
    }
    
    // Add or replace with new history points
    for (const point of newHistory) {
      historyMap.set(point.timestamp, point);
    }
    
    // Convert map back to array
    return Array.from(historyMap.values());
  }
}
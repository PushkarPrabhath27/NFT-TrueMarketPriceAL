/**
 * HistoricalTracker.ts
 * 
 * Implements the historical tracking system for trust scores.
 * This component maintains historical trust score data for NFTs, creators, and collections,
 * enabling trend analysis and significant change detection.
 */

import { TrustScoreTypes } from '../types';

/**
 * Responsible for tracking and retrieving historical trust score data
 */
export class HistoricalTracker {
  private nftHistory: Map<string, TrustScoreTypes.ScoreHistoryPoint[]>;
  private creatorHistory: Map<string, TrustScoreTypes.ScoreHistoryPoint[]>;
  private collectionHistory: Map<string, TrustScoreTypes.ScoreHistoryPoint[]>;
  
  /**
   * Initialize the Historical Tracker
   */
  constructor() {
    this.nftHistory = new Map<string, TrustScoreTypes.ScoreHistoryPoint[]>();
    this.creatorHistory = new Map<string, TrustScoreTypes.ScoreHistoryPoint[]>();
    this.collectionHistory = new Map<string, TrustScoreTypes.ScoreHistoryPoint[]>();
  }

  /**
   * Track a new NFT trust score by adding it to the history
   * 
   * @param nftId The unique identifier for the NFT
   * @param trustScore The newly calculated trust score
   */
  public trackNFTScore(nftId: string, trustScore: TrustScoreTypes.NFTTrustScore): void {
    // Get existing history or create new array
    const history = this.nftHistory.get(nftId) || [];
    
    // Create a history point from the trust score
    const historyPoint: TrustScoreTypes.ScoreHistoryPoint = {
      timestamp: trustScore.timestamp,
      score: trustScore.overallScore,
      confidence: trustScore.confidence
    };
    
    // If there's a previous score, detect significant changes
    if (history.length > 0) {
      const previousPoint = history[history.length - 1];
      const changes = this.detectSignificantChanges(
        previousPoint,
        trustScore
      );
      
      if (changes.length > 0) {
        historyPoint.significantChanges = changes;
      }
    }
    
    // Add to history and update the map
    history.push(historyPoint);
    this.nftHistory.set(nftId, history);
    
    // Update the trust score with history
    trustScore.history = [...history];
  }

  /**
   * Track a new creator trust score by adding it to the history
   * 
   * @param creatorAddress The unique address of the creator
   * @param trustScore The newly calculated trust score
   */
  public trackCreatorScore(creatorAddress: string, trustScore: TrustScoreTypes.CreatorTrustScore): void {
    // Get existing history or create new array
    const history = this.creatorHistory.get(creatorAddress) || [];
    
    // Create a history point from the trust score
    const historyPoint: TrustScoreTypes.ScoreHistoryPoint = {
      timestamp: trustScore.timestamp,
      score: trustScore.overallScore,
      confidence: trustScore.confidence
    };
    
    // If there's a previous score, detect significant changes
    if (history.length > 0) {
      const previousPoint = history[history.length - 1];
      // Implementation for detecting changes in creator scores would go here
    }
    
    // Add to history and update the map
    history.push(historyPoint);
    this.creatorHistory.set(creatorAddress, history);
    
    // Update the trust score with history
    trustScore.history = [...history];
  }

  /**
   * Track a new collection trust score by adding it to the history
   * 
   * @param collectionId The unique identifier for the collection
   * @param trustScore The newly calculated trust score
   */
  public trackCollectionScore(collectionId: string, trustScore: TrustScoreTypes.CollectionTrustScore): void {
    // Get existing history or create new array
    const history = this.collectionHistory.get(collectionId) || [];
    
    // Create a history point from the trust score
    const historyPoint: TrustScoreTypes.ScoreHistoryPoint = {
      timestamp: trustScore.timestamp,
      score: trustScore.overallScore,
      confidence: trustScore.confidence
    };
    
    // If there's a previous score, detect significant changes
    if (history.length > 0) {
      const previousPoint = history[history.length - 1];
      // Implementation for detecting changes in collection scores would go here
    }
    
    // Add to history and update the map
    history.push(historyPoint);
    this.collectionHistory.set(collectionId, history);
    
    // Update the trust score with history
    trustScore.history = [...history];
  }

  /**
   * Get the historical trust score data for an NFT
   * 
   * @param nftId The unique identifier for the NFT
   * @returns Historical trust score data
   */
  public getNFTHistory(nftId: string): TrustScoreTypes.ScoreHistory {
    const history = this.nftHistory.get(nftId) || [];
    
    return {
      entityId: nftId,
      entityType: 'nft',
      history: [...history]
    };
  }

  /**
   * Get the historical trust score data for a creator
   * 
   * @param creatorAddress The unique address of the creator
   * @returns Historical trust score data
   */
  public getCreatorHistory(creatorAddress: string): TrustScoreTypes.ScoreHistory {
    const history = this.creatorHistory.get(creatorAddress) || [];
    
    return {
      entityId: creatorAddress,
      entityType: 'creator',
      history: [...history]
    };
  }

  /**
   * Get the historical trust score data for a collection
   * 
   * @param collectionId The unique identifier for the collection
   * @returns Historical trust score data
   */
  public getCollectionHistory(collectionId: string): TrustScoreTypes.ScoreHistory {
    const history = this.collectionHistory.get(collectionId) || [];
    
    return {
      entityId: collectionId,
      entityType: 'collection',
      history: [...history]
    };
  }

  /**
   * Detect significant changes between two trust score points
   * 
   * @param previousPoint The previous score history point
   * @param currentScore The current trust score
   * @returns Array of significant score changes
   */
  private detectSignificantChanges(
    previousPoint: TrustScoreTypes.ScoreHistoryPoint,
    currentScore: TrustScoreTypes.NFTTrustScore
  ): TrustScoreTypes.ScoreChange[] {
    const changes: TrustScoreTypes.ScoreChange[] = [];
    
    // Check for significant overall score change (more than 10 points)
    const overallScoreDiff = Math.abs(currentScore.overallScore - previousPoint.score);
    if (overallScoreDiff >= 10) {
      changes.push({
        factor: 'overall',
        previousScore: previousPoint.score,
        newScore: currentScore.overallScore,
        reason: `Overall trust score changed by ${overallScoreDiff} points.`
      });
    }
    
    // For a real implementation, we would also check individual factor scores
    // by comparing previous factor scores to current ones
    // This would require storing factor scores in history points
    
    return changes;
  }

  /**
   * Prune historical data to prevent excessive memory usage
   * This would be called periodically in a production system
   * 
   * @param maxHistoryLength Maximum number of history points to keep per entity
   */
  public pruneHistory(maxHistoryLength: number = 100): void {
    // Prune NFT history
    for (const [nftId, history] of this.nftHistory.entries()) {
      if (history.length > maxHistoryLength) {
        this.nftHistory.set(nftId, history.slice(-maxHistoryLength));
      }
    }
    
    // Prune creator history
    for (const [creatorAddress, history] of this.creatorHistory.entries()) {
      if (history.length > maxHistoryLength) {
        this.creatorHistory.set(creatorAddress, history.slice(-maxHistoryLength));
      }
    }
    
    // Prune collection history
    for (const [collectionId, history] of this.collectionHistory.entries()) {
      if (history.length > maxHistoryLength) {
        this.collectionHistory.set(collectionId, history.slice(-maxHistoryLength));
      }
    }
  }
}
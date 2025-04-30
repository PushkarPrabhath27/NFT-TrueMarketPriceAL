/**
 * TrustScoreEngine.ts
 * 
 * Core implementation of the NFT Trust Score calculation system.
 * This engine processes multiple data points to calculate comprehensive
 * trust scores for NFTs, creators, and collections.
 */

import { FactorCalculator } from './factors/FactorCalculator';
import { OriginalityFactor } from './factors/OriginalityFactor';
import { TransactionLegitimacyFactor } from './factors/TransactionLegitimacyFactor';
import { CreatorReputationFactor } from './factors/CreatorReputationFactor';
import { CollectionPerformanceFactor } from './factors/CollectionPerformanceFactor';
import { MetadataConsistencyFactor } from './factors/MetadataConsistencyFactor';
import { MarketplaceVerificationFactor } from './factors/MarketplaceVerificationFactor';
import { SocialValidationFactor } from './factors/SocialValidationFactor';
import { ScoreAggregator } from './aggregation/ScoreAggregator';
import { HistoricalTracker } from './history/HistoricalTracker';
import { TrustScoreUpdateManager } from './updates/TrustScoreUpdateManager';
import { TrustFactorAnalyzer } from './analysis/TrustFactorAnalyzer';
import { RiskAssessmentEngine } from './risk/RiskAssessmentEngine';
import { TrustScoreTypes } from './types';

/**
 * Main Trust Score Engine class that orchestrates the calculation
 * of trust scores across multiple dimensions.
 */
export class TrustScoreEngine {
  private factorCalculators: Map<string, FactorCalculator>;
  private scoreAggregator: ScoreAggregator;
  private historyTracker: HistoricalTracker;
  private updateManager: TrustScoreUpdateManager;
  private factorAnalyzer: TrustFactorAnalyzer;
  private riskEngine: RiskAssessmentEngine;

  /**
   * Initialize the Trust Score Engine with all necessary components
   */
  constructor() {
    // Initialize factor calculators with their respective weights
    this.factorCalculators = new Map<string, FactorCalculator>();
    this.factorCalculators.set('originality', new OriginalityFactor(0.20)); // 20% weight
    this.factorCalculators.set('transaction', new TransactionLegitimacyFactor(0.20)); // 20% weight
    this.factorCalculators.set('creator', new CreatorReputationFactor(0.15)); // 15% weight
    this.factorCalculators.set('collection', new CollectionPerformanceFactor(0.15)); // 15% weight
    this.factorCalculators.set('metadata', new MetadataConsistencyFactor(0.10)); // 10% weight
    this.factorCalculators.set('marketplace', new MarketplaceVerificationFactor(0.10)); // 10% weight
    this.factorCalculators.set('social', new SocialValidationFactor(0.10)); // 10% weight

    // Initialize supporting components
    this.scoreAggregator = new ScoreAggregator(this.factorCalculators);
    this.historyTracker = new HistoricalTracker();
    this.updateManager = new TrustScoreUpdateManager(this);
    this.factorAnalyzer = new TrustFactorAnalyzer(this.factorCalculators);
    this.riskEngine = new RiskAssessmentEngine(this.factorCalculators, this.scoreAggregator);
  }

  /**
   * Calculate a trust score for an NFT based on all available data
   * 
   * @param nftId The unique identifier for the NFT
   * @param inputData All relevant data for trust score calculation
   * @returns A complete trust score with factor breakdown and confidence metrics
   */
  public async calculateNFTTrustScore(
    nftId: string, 
    inputData: TrustScoreTypes.NFTInputData
  ): Promise<TrustScoreTypes.NFTTrustScore> {
    // Process each factor calculation
    const factorScores: Map<string, TrustScoreTypes.FactorScore> = new Map();
    
    for (const [factorKey, calculator] of this.factorCalculators.entries()) {
      try {
        const factorScore = await calculator.calculate(inputData);
        factorScores.set(factorKey, factorScore);
      } catch (error) {
        console.error(`Error calculating ${factorKey} factor:`, error);
        // Set a default low-confidence score for this factor
        factorScores.set(factorKey, {
          score: 0,
          confidence: 0.1,
          explanation: `Unable to calculate due to error: ${error.message}`,
          details: {},
          redFlags: [],
          strengths: []
        });
      }
    }

    // Aggregate the scores
    const aggregatedScore = this.scoreAggregator.aggregateNFTScore(factorScores, inputData);
    
    // Track the history
    this.historyTracker.trackNFTScore(nftId, aggregatedScore);
    
    return aggregatedScore;
  }

  /**
   * Calculate a trust score for a creator based on their history and current NFTs
   * 
   * @param creatorAddress The blockchain address of the creator
   * @param inputData All relevant data for creator trust calculation
   * @returns A complete creator trust score with factor breakdown
   */
  public async calculateCreatorTrustScore(
    creatorAddress: string,
    inputData: TrustScoreTypes.CreatorInputData
  ): Promise<TrustScoreTypes.CreatorTrustScore> {
    // Implementation for creator trust score calculation
    // This would aggregate data across all of a creator's NFTs and collections
    
    // For now, return a placeholder implementation
    return {
      creatorAddress,
      overallScore: 0,
      confidence: 0,
      factorScores: new Map(),
      explanation: "Creator trust score calculation not yet implemented",
      timestamp: new Date().toISOString(),
      history: []
    };
  }

  /**
   * Calculate a trust score for an entire collection
   * 
   * @param collectionId The unique identifier for the collection
   * @param inputData All relevant data for collection trust calculation
   * @returns A complete collection trust score with factor breakdown
   */
  public async calculateCollectionTrustScore(
    collectionId: string,
    inputData: TrustScoreTypes.CollectionInputData
  ): Promise<TrustScoreTypes.CollectionTrustScore> {
    // Implementation for collection trust score calculation
    // This would analyze the entire collection for consistency and overall quality
    
    // For now, return a placeholder implementation
    return {
      collectionId,
      overallScore: 0,
      confidence: 0,
      factorScores: new Map(),
      explanation: "Collection trust score calculation not yet implemented",
      timestamp: new Date().toISOString(),
      history: []
    };
  }

  /**
   * Perform a detailed analysis of all trust factors for an NFT
   * 
   * @param nftId The unique identifier for the NFT
   * @param trustScore The previously calculated trust score
   * @returns Detailed analysis of all trust factors
   */
  public analyzeTrustFactors(
    nftId: string,
    trustScore: TrustScoreTypes.NFTTrustScore
  ): TrustScoreTypes.TrustFactorAnalysis {
    return this.factorAnalyzer.analyzeNFTFactors(nftId, trustScore);
  }

  /**
   * Assess the risk profile of an NFT based on its trust score
   * 
   * @param nftId The unique identifier for the NFT
   * @param trustScore The previously calculated trust score
   * @returns A comprehensive risk assessment
   */
  public assessRisk(
    nftId: string,
    trustScore: TrustScoreTypes.NFTTrustScore
  ): TrustScoreTypes.RiskAssessment {
    return this.riskEngine.assessNFTRisk(nftId, trustScore);
  }

  /**
   * Handle an event that might trigger a trust score update
   * 
   * @param event The event data that might affect trust scores
   */
  public handleUpdateEvent(event: TrustScoreTypes.UpdateEvent): void {
    this.updateManager.processEvent(event);
  }

  /**
   * Get the historical trust score data for an NFT
   * 
   * @param nftId The unique identifier for the NFT
   * @returns Historical trust score data
   */
  public getNFTScoreHistory(nftId: string): TrustScoreTypes.ScoreHistory {
    return this.historyTracker.getNFTHistory(nftId);
  }
}
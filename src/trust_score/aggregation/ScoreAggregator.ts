/**
 * ScoreAggregator.ts
 * 
 * Implements the score aggregation system that combines individual factor scores
 * into a comprehensive trust score with appropriate weighting and confidence calculations.
 * 
 * Key features:
 * - Weighted combination of all factors
 * - Weight adjustment based on data completeness and confidence
 * - Score normalization to 0-100% scale
 * - Confidence interval calculation
 * - Comprehensive explanation generation
 * - Visualization-ready data structures
 */

import { FactorCalculator } from '../factors/FactorCalculator';
import { TrustScoreTypes } from '../types';
import { VisualizationDataGenerator } from './VisualizationDataGenerator';

// Confidence interval configuration
interface ConfidenceIntervalConfig {
  confidenceLevel: number; // e.g., 0.95 for 95% confidence
  minSampleSize: number; // Minimum sample size for reliable intervals
}

/**
 * Responsible for aggregating individual factor scores into comprehensive trust scores
 * for NFTs, creators, and collections.
 */
export class ScoreAggregator {
  private factorCalculators: Map<string, FactorCalculator>;
  private visualizationGenerator: VisualizationDataGenerator;
  private confidenceConfig: ConfidenceIntervalConfig = {
    confidenceLevel: 0.95, // 95% confidence level by default
    minSampleSize: 5 // Need at least 5 data points for reliable intervals
  };

  /**
   * Initialize the Score Aggregator with factor calculators
   * 
   * @param factorCalculators Map of factor calculators to use for aggregation
   */
  constructor(factorCalculators: Map<string, FactorCalculator>) {
    this.factorCalculators = factorCalculators;
    this.visualizationGenerator = new VisualizationDataGenerator();
  }

  /**
   * Aggregate individual factor scores into a comprehensive NFT trust score
   * 
   * @param factorScores Map of factor scores to aggregate
   * @param inputData Original input data used for score calculation
   * @returns A comprehensive NFT trust score
   */
  /**
   * Aggregate individual factor scores into a comprehensive NFT trust score
   * 
   * @param factorScores Map of factor scores to aggregate
   * @param inputData Original input data used for score calculation
   * @param previousScore Optional previous score for historical tracking
   * @returns A comprehensive NFT trust score
   */
  public aggregateNFTScore(
    factorScores: Map<string, TrustScoreTypes.FactorScore>,
    inputData: TrustScoreTypes.NFTInputData,
    previousScore?: TrustScoreTypes.NFTTrustScore
  ): TrustScoreTypes.NFTTrustScore {
    // Get adjusted weights based on data completeness and confidence
    const adjustedWeights = this.adjustWeights(factorScores);
    
    // Calculate weighted score
    let weightedSum = 0;
    let weightSum = 0;
    let confidenceSum = 0;
    let factorCount = 0;
    
    // Process each factor score with adjusted weights
    for (const [factorKey, factorScore] of factorScores.entries()) {
      const adjustedWeight = adjustedWeights.get(factorKey) || 0;
      
      // Add to weighted sum
      weightedSum += factorScore.score * adjustedWeight;
      weightSum += adjustedWeight;
      confidenceSum += factorScore.confidence;
      factorCount++;
    }
    
    // Calculate final score and confidence
    const overallScore = weightSum > 0 ? Math.round(weightedSum / weightSum) : 50;
    
    // Normalize score to 0-100 scale
    const normalizedScore = Math.max(0, Math.min(100, overallScore));
    
    // Calculate confidence and confidence intervals
    const confidence = factorCount > 0 ? confidenceSum / factorCount : 0.3;
    const confidenceIntervals = this.calculateConfidenceIntervals(normalizedScore, confidence, factorCount);
    
    // Generate overall explanation
    const explanation = this.generateOverallExplanation(factorScores, normalizedScore);
    
    // Generate visualization data
    const visualizationData = this.visualizationGenerator.generateForNFT(factorScores, adjustedWeights, normalizedScore);
    
    // Create history point if we have a previous score
    const currentTimestamp = new Date().toISOString();
    const history: TrustScoreTypes.ScoreHistoryPoint[] = [];
    
    if (previousScore && previousScore.history) {
      // Copy previous history
      history.push(...previousScore.history);
    }
    
    // Add current score as a history point with significant changes
    if (previousScore) {
      const significantChanges = this.detectSignificantChanges(factorScores, previousScore.factorScores);
      
      if (significantChanges.length > 0 || Math.abs(normalizedScore - previousScore.overallScore) >= 5) {
        history.push({
          timestamp: currentTimestamp,
          score: normalizedScore,
          confidence,
          significantChanges
        });
      }
    }
    
    // Create the trust score object
    const trustScore: TrustScoreTypes.NFTTrustScore = {
      nftId: inputData.tokenId,
      overallScore: normalizedScore,
      confidence,
      factorScores,
      explanation,
      timestamp: currentTimestamp,
      confidenceIntervals,
      visualizationData,
      history
    };
    
    return trustScore;
  }

  /**
   * Generate a human-readable explanation of the overall trust score
   * 
   * @param factorScores Map of factor scores used in aggregation
   * @param overallScore The calculated overall score
   * @returns A comprehensive explanation of the trust score
   */
  private generateOverallExplanation(
    factorScores: Map<string, TrustScoreTypes.FactorScore>,
    overallScore: number
  ): string {
    // Get the top strengths and red flags across all factors
    const allRedFlags: Array<TrustScoreTypes.RedFlag & { factor: string }> = [];
    const allStrengths: Array<TrustScoreTypes.Strength & { factor: string }> = [];
    
    for (const [factor, score] of factorScores.entries()) {
      // Add factor name to each red flag and strength
      score.redFlags.forEach(flag => {
        allRedFlags.push({ ...flag, factor });
      });
      
      score.strengths.forEach(strength => {
        allStrengths.push({ ...strength, factor });
      });
    }
    
    // Sort red flags by severity (high to low)
    const sortedRedFlags = allRedFlags.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    // Sort strengths by significance (high to low)
    const sortedStrengths = allStrengths.sort((a, b) => {
      const significanceOrder = { high: 3, medium: 2, low: 1 };
      return significanceOrder[b.significance] - significanceOrder[a.significance];
    });
    
    // Generate the explanation based on overall score
    let explanation = '';
    
    if (overallScore >= 90) {
      explanation = 'This NFT has an excellent trust score, indicating high trustworthiness across multiple factors. ';
    } else if (overallScore >= 75) {
      explanation = 'This NFT has a good trust score, showing strong performance in most trust factors. ';
    } else if (overallScore >= 60) {
      explanation = 'This NFT has a moderate trust score, with some positive factors but room for improvement. ';
    } else if (overallScore >= 40) {
      explanation = 'This NFT has a below average trust score, with several concerning factors that warrant caution. ';
    } else {
      explanation = 'This NFT has a low trust score, indicating significant trust issues across multiple factors. ';
    }
    
    // Add information about top strengths
    if (sortedStrengths.length > 0) {
      explanation += 'Key strengths include: ';
      const topStrengths = sortedStrengths.slice(0, 2);
      explanation += topStrengths.map(s => `${s.description} (${s.factor})`).join(', ');
      explanation += '. ';
    }
    
    // Add information about top red flags
    if (sortedRedFlags.length > 0) {
      explanation += 'Areas of concern include: ';
      const topFlags = sortedRedFlags.slice(0, 2);
      explanation += topFlags.map(f => `${f.description} (${f.factor})`).join(', ');
      explanation += '.';
    }
    
    return explanation;
  }

  /**
   * Adjust factor weights based on data completeness and confidence
   * 
   * @param factorScores Map of factor scores to adjust
   * @returns Map of adjusted weights for each factor
   */
  /**
   * Adjust factor weights based on data completeness and confidence
   * 
   * @param factorScores Map of factor scores to adjust
   * @returns Map of adjusted weights for each factor
   */
  private adjustWeights(factorScores: Map<string, TrustScoreTypes.FactorScore>): Map<string, number> {
    const adjustedWeights = new Map<string, number>();
    let totalWeight = 0;
    
    // First pass: adjust weights based on confidence and data completeness
    for (const [factor, score] of factorScores.entries()) {
      const calculator = this.factorCalculators.get(factor);
      if (!calculator) continue;
      
      // Get base weight for this factor
      const baseWeight = calculator.weight;
      
      // Calculate data completeness factor (0-1)
      const dataCompleteness = this.calculateDataCompleteness(score);
      
      // Adjust weight based on confidence and data completeness
      const adjustedWeight = baseWeight * score.confidence * dataCompleteness;
      adjustedWeights.set(factor, adjustedWeight);
      totalWeight += adjustedWeight;
    }
    
    // Second pass: normalize weights to sum to 1
    if (totalWeight > 0) {
      for (const [factor, weight] of adjustedWeights.entries()) {
        adjustedWeights.set(factor, weight / totalWeight);
      }
    } else {
      // If all weights are zero, distribute evenly
      const evenWeight = 1 / factorScores.size;
      for (const factor of factorScores.keys()) {
        adjustedWeights.set(factor, evenWeight);
      }
    }
    
    return adjustedWeights;
  }
  
  /**
   * Calculate data completeness score for a factor
   * 
   * @param factorScore The factor score to evaluate
   * @returns A value between 0-1 representing data completeness
   */
  private calculateDataCompleteness(factorScore: TrustScoreTypes.FactorScore): number {
    // This is a simplified implementation
    // In a real system, this would analyze the factor's details to determine completeness
    
    // If confidence is very low, data is likely incomplete
    if (factorScore.confidence < 0.3) {
      return 0.5; // Reduce weight for low confidence factors
    }
    
    // Check if details object has expected properties
    const details = factorScore.details;
    if (!details || Object.keys(details).length === 0) {
      return 0.7; // Reduce weight for factors with missing details
    }
    
    return 1.0; // Full weight for complete data
  }
  
  /**
   * Calculate confidence intervals for the overall score
   * 
   * @param score The overall score
   * @param confidence The overall confidence value
   * @param sampleSize Number of factors used in calculation
   * @returns Confidence interval object
   */
  private calculateConfidenceIntervals(score: number, confidence: number, sampleSize: number): {
    lowerBound: number;
    upperBound: number;
    confidenceLevel: number;
  } {
    // This is a simplified implementation of confidence intervals
    // In a real system, this would use proper statistical methods
    
    // If we don't have enough samples, widen the interval
    const widthMultiplier = sampleSize < this.confidenceConfig.minSampleSize ? 2.0 : 1.0;
    
    // Calculate interval width based on confidence
    // Lower confidence = wider intervals
    const intervalWidth = (1 - confidence) * 25 * widthMultiplier;
    
    return {
      lowerBound: Math.max(0, Math.round(score - intervalWidth)),
      upperBound: Math.min(100, Math.round(score + intervalWidth)),
      confidenceLevel: this.confidenceConfig.confidenceLevel
    };
  }
  
  /**
   * Detect significant changes between current and previous factor scores
   * 
   * @param currentScores Current factor scores
   * @param previousScores Previous factor scores
   * @returns Array of significant score changes
   */
  private detectSignificantChanges(
    currentScores: Map<string, TrustScoreTypes.FactorScore>,
    previousScores: Map<string, TrustScoreTypes.FactorScore>
  ): TrustScoreTypes.ScoreChange[] {
    const changes: TrustScoreTypes.ScoreChange[] = [];
    
    // Check each current factor score against previous
    for (const [factor, currentScore] of currentScores.entries()) {
      const previousScore = previousScores.get(factor);
      if (!previousScore) continue; // New factor, no change to detect
      
      // Calculate score difference
      const scoreDifference = currentScore.score - previousScore.score;
      
      // Only record significant changes (more than 10 points or 20%)
      if (Math.abs(scoreDifference) >= 10 || Math.abs(scoreDifference / previousScore.score) >= 0.2) {
        changes.push({
          factor,
          previousScore: previousScore.score,
          newScore: currentScore.score,
          reason: this.generateChangeReason(factor, scoreDifference, currentScore, previousScore)
        });
      }
    }
    
    return changes;
  }
  
  /**
   * Generate a reason explanation for a significant score change
   */
  private generateChangeReason(
    factor: string,
    scoreDifference: number,
    currentScore: TrustScoreTypes.FactorScore,
    previousScore: TrustScoreTypes.FactorScore
  ): string {
    const direction = scoreDifference > 0 ? 'increased' : 'decreased';
    
    // Compare red flags
    const previousFlagCount = previousScore.redFlags.length;
    const currentFlagCount = currentScore.redFlags.length;
    
    if (direction === 'decreased' && currentFlagCount > previousFlagCount) {
      return `New concerns identified in ${factor} factor`;
    }
    
    if (direction === 'increased' && currentFlagCount < previousFlagCount) {
      return `Fewer concerns in ${factor} factor`;
    }
    
    // Compare strengths
    const previousStrengthCount = previousScore.strengths.length;
    const currentStrengthCount = currentScore.strengths.length;
    
    if (direction === 'increased' && currentStrengthCount > previousStrengthCount) {
      return `New strengths identified in ${factor} factor`;
    }
    
    if (direction === 'decreased' && currentStrengthCount < previousStrengthCount) {
      return `Fewer strengths in ${factor} factor`;
    }
    
    // Default reason
    return `${factor} factor ${direction} based on recent data`;
  }

}
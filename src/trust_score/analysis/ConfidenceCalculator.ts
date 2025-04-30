/**
 * ConfidenceCalculator.ts
 * 
 * Implements the Confidence Calculation component of the Trust Factor Analysis System.
 * This class is responsible for assessing data completeness, generating statistical
 * confidence intervals, explaining confidence limitations, providing improvement
 * recommendations, and designing visual indicators for confidence levels.
 */

import { TrustScoreTypes } from '../types';

/**
 * Responsible for calculating and analyzing confidence in trust scores
 */
export class ConfidenceCalculator {
  // Minimum data requirements for high confidence in each factor
  private dataRequirements: Record<string, string[]> = {
    'originality': ['imageSimilarityResults', 'metadata.image'],
    'transactionLegitimacy': ['transactionHistory', 'creationTimestamp'],
    'creatorReputation': ['creatorHistory', 'creatorAddress'],
    'collectionPerformance': ['collectionData', 'floorPriceHistory', 'tradingVolumeHistory'],
    'metadataConsistency': ['metadata', 'metadata.attributes'],
    'marketplaceVerification': ['marketplaceVerifications'],
    'socialValidation': ['socialSignals']
  };

  /**
   * Assess the completeness of data for confidence calculation
   * 
   * @param inputData The input data for trust score calculation
   * @returns Data completeness assessment with scores for each factor
   */
  public assessDataCompleteness(inputData: TrustScoreTypes.NFTInputData): Record<string, number> {
    const completenessScores: Record<string, number> = {};
    
    // Assess completeness for each factor
    for (const [factor, requirements] of Object.entries(this.dataRequirements)) {
      completenessScores[factor] = this.calculateCompletenessScore(inputData, requirements);
    }
    
    return completenessScores;
  }
  
  /**
   * Calculate completeness score for a specific factor
   * 
   * @param inputData The input data for trust score calculation
   * @param requirements Array of required data fields
   * @returns Completeness score (0-1)
   */
  private calculateCompletenessScore(
    inputData: TrustScoreTypes.NFTInputData,
    requirements: string[]
  ): number {
    let availableCount = 0;
    
    for (const requirement of requirements) {
      // Handle nested properties (e.g., 'metadata.attributes')
      if (requirement.includes('.')) {
        const [parent, child] = requirement.split('.');
        if (inputData[parent] && inputData[parent][child]) {
          availableCount++;
        }
      } else if (inputData[requirement]) {
        // Handle top-level properties
        availableCount++;
      }
    }
    
    return requirements.length > 0 ? availableCount / requirements.length : 0;
  }
  
  /**
   * Calculate statistical confidence intervals for a trust score
   * 
   * @param trustScore The trust score to analyze
   * @param completenessScores Data completeness scores by factor
   * @returns Confidence intervals for the overall score and each factor
   */
  public calculateConfidenceIntervals(
    trustScore: TrustScoreTypes.NFTTrustScore,
    completenessScores: Record<string, number>
  ): Record<string, { lower: number, upper: number }> {
    const intervals: Record<string, { lower: number, upper: number }> = {};
    
    // Calculate interval for overall score
    const overallConfidence = trustScore.confidence;
    const overallMargin = this.calculateMarginOfError(trustScore.overallScore, overallConfidence);
    intervals['overall'] = {
      lower: Math.max(0, trustScore.overallScore - overallMargin),
      upper: Math.min(100, trustScore.overallScore + overallMargin)
    };
    
    // Calculate intervals for each factor
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      const completeness = completenessScores[factorKey] || 0.5; // Default to 0.5 if not available
      const confidence = factorScore.confidence;
      const margin = this.calculateMarginOfError(factorScore.score, confidence);
      
      intervals[factorKey] = {
        lower: Math.max(0, factorScore.score - margin),
        upper: Math.min(100, factorScore.score + margin)
      };
    }
    
    return intervals;
  }
  
  /**
   * Calculate margin of error based on score and confidence
   * 
   * @param score The score value
   * @param confidence The confidence value (0-1)
   * @returns Margin of error
   */
  private calculateMarginOfError(score: number, confidence: number): number {
    // Simple margin calculation: higher confidence = smaller margin
    // This is a simplified approach; a real implementation would use statistical methods
    const baseMargin = 20; // Maximum margin at 0 confidence
    return baseMargin * (1 - confidence);
  }
  
  /**
   * Generate explanation of confidence limitations
   * 
   * @param trustScore The trust score to analyze
   * @param completenessScores Data completeness scores by factor
   * @returns Explanation of confidence limitations
   */
  public explainConfidenceLimitations(
    trustScore: TrustScoreTypes.NFTTrustScore,
    completenessScores: Record<string, number>
  ): string {
    let explanation = `The trust score has an overall confidence of ${(trustScore.confidence * 100).toFixed(1)}%. `;
    
    // Identify factors with lowest confidence
    const factorConfidences = Array.from(trustScore.factorScores.entries())
      .map(([key, score]) => ({ factor: key, confidence: score.confidence }))
      .sort((a, b) => a.confidence - b.confidence);
    
    const lowConfidenceFactors = factorConfidences
      .filter(f => f.confidence < 0.7)
      .slice(0, 3);
    
    if (lowConfidenceFactors.length > 0) {
      explanation += 'Confidence limitations exist in the following areas: ';
      
      for (const { factor, confidence } of lowConfidenceFactors) {
        const completeness = completenessScores[factor] || 0;
        explanation += `\n- ${this.getFactorName(factor)} (${(confidence * 100).toFixed(1)}% confidence): `;
        
        if (completeness < 0.5) {
          explanation += 'Limited by insufficient data. ';
        } else if (confidence < 0.5) {
          explanation += 'Limited by data quality or inconsistencies. ';
        } else {
          explanation += 'Moderate confidence with some data limitations. ';
        }
      }
    } else {
      explanation += 'All factors have reasonable confidence levels with no significant limitations.';
    }
    
    return explanation;
  }
  
  /**
   * Generate recommendations for improving confidence
   * 
   * @param trustScore The trust score to analyze
   * @param completenessScores Data completeness scores by factor
   * @returns Array of recommendations for improving confidence
   */
  public generateConfidenceImprovementRecommendations(
    trustScore: TrustScoreTypes.NFTTrustScore,
    completenessScores: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];
    
    // Identify factors with lowest confidence
    const factorConfidences = Array.from(trustScore.factorScores.entries())
      .map(([key, score]) => ({ 
        factor: key, 
        confidence: score.confidence,
        completeness: completenessScores[key] || 0
      }))
      .sort((a, b) => a.confidence - b.confidence);
    
    const lowConfidenceFactors = factorConfidences
      .filter(f => f.confidence < 0.7)
      .slice(0, 3);
    
    for (const { factor, confidence, completeness } of lowConfidenceFactors) {
      const factorName = this.getFactorName(factor);
      
      if (completeness < 0.5) {
        // Data completeness issues
        const missingData = this.identifyMissingData(factor, completeness);
        recommendations.push(`Gather more ${factorName} data: ${missingData}.`);
      } else if (confidence < 0.5) {
        // Data quality issues
        recommendations.push(`Improve quality of ${factorName} data by verifying sources and resolving inconsistencies.`);
      } else {
        // General improvement
        recommendations.push(`Enhance ${factorName} analysis with additional historical or comparative data.`);
      }
    }
    
    // Add general recommendations if needed
    if (recommendations.length === 0 && trustScore.confidence < 0.9) {
      recommendations.push('Gather more comprehensive transaction history to improve overall confidence.');
      recommendations.push('Obtain additional verification from major marketplaces.');
    }
    
    return recommendations;
  }
  
  /**
   * Identify specific missing data for a factor
   * 
   * @param factor The factor key
   * @param completeness The completeness score
   * @returns Description of missing data
   */
  private identifyMissingData(factor: string, completeness: number): string {
    switch (factor) {
      case 'originality':
        return 'image similarity analysis results';
      case 'transactionLegitimacy':
        return 'transaction history and wallet relationship data';
      case 'creatorReputation':
        return 'creator history and verification status';
      case 'collectionPerformance':
        return 'collection trading metrics and holder distribution';
      case 'metadataConsistency':
        return 'complete metadata and attribute information';
      case 'marketplaceVerification':
        return 'verification status across major marketplaces';
      case 'socialValidation':
        return 'social media mentions and engagement metrics';
      default:
        return 'relevant data points';
    }
  }
  
  /**
   * Generate data for visual confidence indicators
   * 
   * @param trustScore The trust score to analyze
   * @param confidenceIntervals Confidence intervals for scores
   * @returns Visual indicator data for confidence
   */
  public generateVisualIndicatorData(
    trustScore: TrustScoreTypes.NFTTrustScore,
    confidenceIntervals: Record<string, { lower: number, upper: number }>
  ): Record<string, any> {
    const visualData: Record<string, any> = {
      overall: {
        score: trustScore.overallScore,
        confidence: trustScore.confidence,
        confidenceLevel: this.getConfidenceLevel(trustScore.confidence),
        interval: confidenceIntervals['overall'],
        color: this.getConfidenceColor(trustScore.confidence)
      },
      factors: {}
    };
    
    // Generate visual data for each factor
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      visualData.factors[factorKey] = {
        score: factorScore.score,
        confidence: factorScore.confidence,
        confidenceLevel: this.getConfidenceLevel(factorScore.confidence),
        interval: confidenceIntervals[factorKey],
        color: this.getConfidenceColor(factorScore.confidence)
      };
    }
    
    return visualData;
  }
  
  /**
   * Get confidence level based on confidence value
   * 
   * @param confidence The confidence value (0-1)
   * @returns Confidence level (high, medium, low)
   */
  private getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }
  
  /**
   * Get color for confidence visualization
   * 
   * @param confidence The confidence value (0-1)
   * @returns Color code for visualization
   */
  private getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#4CAF50'; // Green
    if (confidence >= 0.5) return '#FFC107'; // Amber
    return '#F44336'; // Red
  }
  
  /**
   * Generate a comprehensive confidence analysis
   * 
   * @param trustScore The trust score to analyze
   * @returns Confidence analysis object
   */
  public generateConfidenceAnalysis(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.ConfidenceAnalysis {
    // Assess data completeness
    const completenessScores = this.assessDataCompleteness(trustScore as any); // Type assertion for demo
    
    // Calculate overall data completeness score
    const dataCompletenessScore = Object.values(completenessScores).reduce(
      (sum, score) => sum + score, 0
    ) / Object.values(completenessScores).length * 100;
    
    // Calculate confidence intervals
    const confidenceIntervals = this.calculateConfidenceIntervals(trustScore, completenessScores);
    
    // Generate confidence explanation
    const explanation = this.explainConfidenceLimitations(trustScore, completenessScores);
    
    // Generate improvement recommendations
    const recommendations = this.generateConfidenceImprovementRecommendations(trustScore, completenessScores);
    
    // Find lowest confidence factor
    let lowestConfidenceFactor = '';
    let lowestConfidence = 1;
    
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      if (factorScore.confidence < lowestConfidence) {
        lowestConfidence = factorScore.confidence;
        lowestConfidenceFactor = factorKey;
      }
    }
    
    // Generate visual indicator data
    const visualIndicators = this.generateVisualIndicatorData(trustScore, confidenceIntervals);
    
    return {
      overallConfidence: trustScore.confidence,
      lowestConfidenceFactor,
      dataCompletenessScore,
      recommendationsForImprovement: recommendations,
      summaryText: explanation,
      confidenceIntervals,
      visualIndicators
    } as TrustScoreTypes.ConfidenceAnalysis;
  }
  
  /**
   * Get human-readable name for a factor key
   * 
   * @param factorKey The factor key
   * @returns Human-readable factor name
   */
  private getFactorName(factorKey: string): string {
    const factorNames: Record<string, string> = {
      'originality': 'Originality',
      'transactionLegitimacy': 'Transaction Legitimacy',
      'creatorReputation': 'Creator Reputation',
      'collectionPerformance': 'Collection Performance',
      'metadataConsistency': 'Metadata Consistency',
      'marketplaceVerification': 'Marketplace Verification',
      'socialValidation': 'Social Validation'
    };
    
    return factorNames[factorKey] || factorKey;
  }
}
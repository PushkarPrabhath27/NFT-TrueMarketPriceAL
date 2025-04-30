/**
 * TrustFactorAnalyzer.ts
 * 
 * Implements the Trust Factor Analysis System that provides detailed analysis
 * of each trust factor with rich explanations and visualization data.
 */

import { FactorCalculator } from '../factors/FactorCalculator';
import { TrustScoreTypes } from '../types';
import { RedFlagDetector } from './RedFlagDetector';
import { StrengthIdentifier } from './StrengthIdentifier';
import { ConfidenceCalculator } from './ConfidenceCalculator';

/**
 * Responsible for analyzing trust factors and generating detailed explanations
 */
export class TrustFactorAnalyzer {
  private factorCalculators: Map<string, FactorCalculator>;
  private redFlagDetector: RedFlagDetector;
  private strengthIdentifier: StrengthIdentifier;
  private confidenceCalculator: ConfidenceCalculator;

  /**
   * Initialize the Trust Factor Analyzer with factor calculators
   * 
   * @param factorCalculators Map of factor calculators to use for analysis
   */
  constructor(factorCalculators: Map<string, FactorCalculator>) {
    this.factorCalculators = factorCalculators;
    this.redFlagDetector = new RedFlagDetector();
    this.strengthIdentifier = new StrengthIdentifier();
    this.confidenceCalculator = new ConfidenceCalculator();
  }

  /**
   * Analyze all trust factors for an NFT and generate detailed analysis
   * 
   * @param nftId The unique identifier for the NFT
   * @param trustScore The previously calculated trust score
   * @returns Detailed analysis of all trust factors
   */
  public analyzeNFTFactors(
    nftId: string,
    trustScore: TrustScoreTypes.NFTTrustScore
  ): TrustScoreTypes.TrustFactorAnalysis {
    // Create factor details for each factor
    const factorDetails = new Map<string, TrustScoreTypes.FactorAnalysisDetail>();
    
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      const calculator = this.factorCalculators.get(factorKey);
      if (!calculator) continue;
      
      // Generate detailed analysis for this factor
      const detail = this.generateFactorDetail(factorKey, factorScore, calculator);
      factorDetails.set(factorKey, detail);
    }
    
    // Generate comparative analysis
    const comparativeAnalysis = this.generateComparativeAnalysis(trustScore);
    
    // Generate red flag summary using the RedFlagDetector
    const redFlags = this.redFlagDetector.detectRedFlags(trustScore);
    const redFlagSummary = this.generateRedFlagSummary(trustScore, redFlags);
    
    // Generate strength summary
    const strengthSummary = this.generateStrengthSummary(trustScore);
    
    // Generate confidence analysis
    const confidenceAnalysis = this.generateConfidenceAnalysis(trustScore);
    
    return {
      entityId: nftId,
      entityType: 'nft',
      factorDetails,
      comparativeAnalysis,
      redFlagSummary,
      strengthSummary,
      confidenceAnalysis
    };
  }

  /**
   * Generate detailed analysis for a single factor
   * 
   * @param factorKey The key identifying the factor
   * @param factorScore The score data for the factor
   * @param calculator The calculator used for this factor
   * @returns Detailed analysis of the factor
   */
  private generateFactorDetail(
    factorKey: string,
    factorScore: TrustScoreTypes.FactorScore,
    calculator: FactorCalculator
  ): TrustScoreTypes.FactorAnalysisDetail {
    // Generate a more detailed explanation
    const detailedBreakdown = this.generateDetailedBreakdown(factorKey, factorScore);
    
    // Generate contributing elements
    const contributingElements = this.generateContributingElements(factorScore);
    
    // Generate visualization data
    const visualizationData = this.generateVisualizationData(factorKey, factorScore);
    
    return {
      factor: factorKey,
      score: factorScore.score,
      confidence: factorScore.confidence,
      explanation: factorScore.explanation,
      detailedBreakdown,
      contributingElements,
      visualizationData
    };
  }

  /**
   * Generate a detailed breakdown of a factor score
   * 
   * @param factorKey The key identifying the factor
   * @param factorScore The score data for the factor
   * @returns Detailed breakdown of the factor score
   */
  private generateDetailedBreakdown(factorKey: string, factorScore: TrustScoreTypes.FactorScore): string {
    // This would be customized for each factor type in a full implementation
    // For now, we'll generate a generic detailed breakdown
    
    let breakdown = `${this.getFactorName(factorKey)} Analysis (Score: ${factorScore.score}/100, Confidence: ${(factorScore.confidence * 100).toFixed(1)}%):\n\n`;
    
    // Add explanation
    breakdown += `${factorScore.explanation}\n\n`;
    
    // Add details from the factor score
    if (factorScore.details && Object.keys(factorScore.details).length > 0) {
      breakdown += "Detailed Metrics:\n";
      
      for (const [key, value] of Object.entries(factorScore.details)) {
        // Skip complex nested objects
        if (typeof value !== 'object') {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          breakdown += `- ${formattedKey}: ${value}\n`;
        }
      }
      
      breakdown += "\n";
    }
    
    // Add red flags
    if (factorScore.redFlags.length > 0) {
      breakdown += "Concerns Identified:\n";
      
      factorScore.redFlags.forEach(flag => {
        breakdown += `- ${flag.description} (${flag.severity} severity)\n  Evidence: ${flag.evidence}\n`;
      });
      
      breakdown += "\n";
    }
    
    // Add strengths
    if (factorScore.strengths.length > 0) {
      breakdown += "Strengths Identified:\n";
      
      factorScore.strengths.forEach(strength => {
        breakdown += `- ${strength.description} (${strength.significance} significance)\n  Evidence: ${strength.evidence}\n`;
      });
    }
    
    return breakdown;
  }

  /**
   * Generate contributing elements for a factor score
   * 
   * @param factorScore The score data for the factor
   * @returns Array of contributing elements
   */
  private generateContributingElements(factorScore: TrustScoreTypes.FactorScore): TrustScoreTypes.ContributingElement[] {
    const elements: TrustScoreTypes.ContributingElement[] = [];
    
    // Add strengths as positive contributing elements
    factorScore.strengths.forEach(strength => {
      const impact = strength.significance === 'high' ? 0.8 :
                    strength.significance === 'medium' ? 0.5 : 0.2;
      
      elements.push({
        name: strength.description,
        impact,
        description: strength.evidence
      });
    });
    
    // Add red flags as negative contributing elements
    factorScore.redFlags.forEach(flag => {
      const impact = flag.severity === 'high' ? -0.8 :
                   flag.severity === 'medium' ? -0.5 : -0.2;
      
      elements.push({
        name: flag.description,
        impact,
        description: flag.evidence
      });
    });
    
    // Sort by absolute impact (highest first)
    return elements.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  /**
   * Generate a red flag summary based on detected red flags
   * 
   * @param trustScore The full trust score
   * @param redFlags Array of detected red flags
   * @returns Red flag summary
   */
  private generateRedFlagSummary(
    trustScore: TrustScoreTypes.NFTTrustScore,
    redFlags: TrustScoreTypes.RedFlag[]
  ): TrustScoreTypes.RedFlagSummary {
    // Count red flags by severity
    const highSeverityCount = redFlags.filter(flag => flag.severity === 'high').length;
    const mediumSeverityCount = redFlags.filter(flag => flag.severity === 'medium').length;
    const lowSeverityCount = redFlags.filter(flag => flag.severity === 'low').length;
    
    // Generate overall risk assessment
    let overallRiskLevel: 'high' | 'medium' | 'low' = 'low';
    if (highSeverityCount > 0 || mediumSeverityCount >= 3) {
      overallRiskLevel = 'high';
    } else if (mediumSeverityCount > 0 || lowSeverityCount >= 3) {
      overallRiskLevel = 'medium';
    }
    
    // Generate summary text
    let summaryText = '';
    if (redFlags.length === 0) {
      summaryText = 'No significant red flags detected. This NFT appears to meet standard trust criteria.';
    } else {
      summaryText = `Detected ${redFlags.length} potential issues: `;
      if (highSeverityCount > 0) {
        summaryText += `${highSeverityCount} high severity, `;
      }
      if (mediumSeverityCount > 0) {
        summaryText += `${mediumSeverityCount} medium severity, `;
      }
      if (lowSeverityCount > 0) {
        summaryText += `${lowSeverityCount} low severity, `;
      }
      // Remove trailing comma and space
      summaryText = summaryText.slice(0, -2) + '.';
      
      // Add most critical flags
      if (highSeverityCount > 0) {
        const criticalFlags = redFlags.filter(flag => flag.severity === 'high');
        summaryText += ' Most critical concerns: ' + 
          criticalFlags.map(flag => flag.description).join(', ') + '.';
      }
    }
    
    return {
      redFlagCount: redFlags.length,
      highSeverityCount,
      mediumSeverityCount,
      lowSeverityCount,
      overallRiskLevel,
      summaryText,
      redFlags
    };
  }
  
  /**
   * Generate a strength summary based on identified strengths
   * 
   * @param trustScore The full trust score
   * @returns Strength summary
   */
  private generateStrengthSummary(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.StrengthSummary {
    // Use the StrengthIdentifier to identify and analyze strengths
    const strengths = this.strengthIdentifier.identifyStrengths(trustScore);
    
    // Enhance strength evidence with factor context
    const enhancedStrengths = strengths.map(strength => {
      // Find the factor this strength belongs to
      for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
        if (factorScore.strengths.some(s => s.description === strength.description)) {
          return this.strengthIdentifier.enhanceStrengthEvidence(strength, factorScore);
        }
      }
      return strength;
    });
    
    // Generate the strength summary using the StrengthIdentifier
    return this.strengthIdentifier.generateStrengthSummary(enhancedStrengths);
  }
  
  /**
   * Generate a confidence analysis for the trust score
   * 
   * @param trustScore The full trust score
   * @returns Confidence analysis
   */
  private generateConfidenceAnalysis(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.ConfidenceAnalysis {
    // Use the ConfidenceCalculator to generate a comprehensive confidence analysis
    return this.confidenceCalculator.generateConfidenceAnalysis(trustScore);
  }
  
  /**
   * Generate comparative analysis against collection average
   * 
   * @param trustScore The trust score to analyze
   * @returns Comparative analysis
   */
  private generateComparativeAnalysis(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.ComparativeAnalysis {
    // In a real implementation, this would fetch collection averages from a database
    // For now, we'll simulate collection averages
    const collectionAverages = this.simulateCollectionAverages(trustScore);
    
    // Calculate differences between this NFT and collection averages
    const factorDifferences = new Map<string, number>();
    const significantFactors: TrustScoreTypes.ComparativeFactorAnalysis[] = [];
    
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      const collectionAverage = collectionAverages.get(factorKey) || 50;
      const difference = factorScore.score - collectionAverage;
      
      factorDifferences.set(factorKey, difference);
      
      // Consider differences of more than 15 points as significant
      if (Math.abs(difference) >= 15) {
        significantFactors.push({
          factor: factorKey,
          nftScore: factorScore.score,
          collectionAverage,
          difference,
          isPositive: difference > 0
        });
      }
    }
    
    // Sort significant factors by absolute difference (largest first)
    significantFactors.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    // Calculate overall comparison
    const overallNftScore = trustScore.overallScore;
    const overallCollectionAverage = Array.from(collectionAverages.values())
      .reduce((sum, score) => sum + score, 0) / collectionAverages.size;
    const overallDifference = overallNftScore - overallCollectionAverage;
    
    let comparisonRating: 'above_average' | 'average' | 'below_average' = 'average';
    if (overallDifference >= 10) {
      comparisonRating = 'above_average';
    } else if (overallDifference <= -10) {
      comparisonRating = 'below_average';
    }
    
    // Generate summary text
    let summaryText = '';
    if (comparisonRating === 'above_average') {
      summaryText = `This NFT scores ${Math.abs(overallDifference).toFixed(1)} points higher than the collection average. `;
    } else if (comparisonRating === 'below_average') {
      summaryText = `This NFT scores ${Math.abs(overallDifference).toFixed(1)} points lower than the collection average. `;
    } else {
      summaryText = `This NFT scores similarly to the collection average (${overallDifference.toFixed(1)} point difference). `;
    }
    
    if (significantFactors.length > 0) {
      const topFactors = significantFactors.slice(0, Math.min(3, significantFactors.length));
      
      summaryText += 'Notable differences: ';
      for (const factor of topFactors) {
        const factorName = this.getFactorName(factor.factor);
        if (factor.isPositive) {
          summaryText += `${factorName} is ${Math.abs(factor.difference).toFixed(1)} points higher, `;
        } else {
          summaryText += `${factorName} is ${Math.abs(factor.difference).toFixed(1)} points lower, `;
        }
      }
      // Remove trailing comma and space
      summaryText = summaryText.slice(0, -2) + '.';
    }
    
    return {
      overallNftScore,
      overallCollectionAverage,
      overallDifference,
      comparisonRating,
      factorDifferences,
      significantFactors,
      summaryText
    };
  }
  
  /**
   * Simulate collection averages for comparative analysis
   * In a real implementation, this would fetch data from a database
   * 
   * @param trustScore The trust score to generate simulated averages for
   * @returns Map of simulated collection average scores by factor
   */
  private simulateCollectionAverages(trustScore: TrustScoreTypes.NFTTrustScore): Map<string, number> {
    const collectionAverages = new Map<string, number>();
    
    // Generate somewhat realistic averages based on the NFT's scores
    // with some random variation
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      // Base the average on the NFT's score, but regress toward the mean (50)
      const baseAverage = factorScore.score * 0.3 + 50 * 0.7;
      
      // Add some random variation (±10 points)
      const randomVariation = (Math.random() * 20) - 10;
      
      // Calculate the final average and ensure it's within 0-100
      const average = Math.max(0, Math.min(100, baseAverage + randomVariation));
      
      collectionAverages.set(factorKey, average);
    }
    
    return collectionAverages;
  }
  
  /**
   * Generate visualization data for a factor score
   * 
   * @param factorKey The key identifying the factor
   * @param factorScore The score data for the factor
   * @returns Visualization data for the factor
   */
  private generateVisualizationData(
    factorKey: string,
    factorScore: TrustScoreTypes.FactorScore
  ): TrustScoreTypes.VisualizationData {
    // Generate historical trend data
    const historicalTrend = this.generateHistoricalTrend(factorKey, factorScore);
    
    // Generate gauge data for score visualization
    const gaugeData = {
      value: factorScore.score,
      min: 0,
      max: 100,
      thresholds: [30, 70], // Low, medium, high thresholds
      label: this.getFactorName(factorKey)
    };
    
    // Generate radar chart data for comparing to benchmarks
    const radarData = {
      value: factorScore.score,
      benchmark: 50, // Simplified benchmark (would be from real data)
      label: this.getFactorName(factorKey)
    };
    
    // Generate bar chart data for contributing elements
    const contributingElements = this.generateContributingElements(factorScore);
    const barData = contributingElements.map(element => ({
      label: element.name,
      value: element.impact * 100, // Convert impact to percentage
      color: element.impact > 0 ? 'positive' : 'negative'
    }));
    
    // Generate donut chart data for confidence
    const donutData = {
      value: factorScore.confidence * 100,
      label: 'Confidence',
      color: factorScore.confidence > 0.7 ? 'high' : 
             factorScore.confidence > 0.4 ? 'medium' : 'low'
    };
    
    return {
      historicalTrend,
      gaugeData,
      radarData,
      barData,
      donutData,
      rawData: factorScore.details || {}
    };
  }
  
  /**
   * Generate historical trend data for a factor
   * In a real implementation, this would fetch historical data from a database
   * 
   * @param factorKey The key identifying the factor
   * @param factorScore The current score data for the factor
   * @returns Historical trend data for the factor
   */
  private generateHistoricalTrend(
    factorKey: string,
    factorScore: TrustScoreTypes.FactorScore
  ): TrustScoreTypes.HistoricalTrendPoint[] {
    // In a real implementation, this would fetch historical data from a database
    // For now, we'll generate simulated historical data
    
    const currentDate = new Date();
    const trendPoints: TrustScoreTypes.HistoricalTrendPoint[] = [];
    
    // Generate data points for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      // Start with the current score and add some random variation for past dates
      // with a slight trend based on the current score
      let baseScore = factorScore.score;
      
      // If current score is high, trend slightly upward from past
      // If current score is low, trend slightly downward from past
      const trendFactor = (factorScore.score - 50) / 100;
      const dayEffect = i * trendFactor * 0.5;
      
      // Add some random noise
      const randomNoise = (Math.random() * 10) - 5;
      
      // Calculate the historical score and ensure it's within 0-100
      const historicalScore = Math.max(0, Math.min(100, baseScore - dayEffect + randomNoise));
      
      trendPoints.push({
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        value: historicalScore,
        confidence: Math.max(0.3, Math.min(0.9, factorScore.confidence - (Math.random() * 0.2)))
      });
    }
    
    return trendPoints;
  }
  
  /**
   * Get a human-readable name for a factor key
   * 
   * @param factorKey The key identifying the factor
   * @returns Human-readable factor name
   */
  private getFactorName(factorKey: string): string {
    const factorNames = {
      'originality': 'Originality',
      'transactionLegitimacy': 'Transaction Legitimacy',
      'creatorReputation': 'Creator Reputation',
      'collectionPerformance': 'Collection Performance',
      'metadataConsistency': 'Metadata Consistency',
      'marketplaceVerification': 'Marketplace Verification',
      'socialValidation': 'Social Validation',
      'multiple': 'Multiple Factors'
    };
    
    return factorNames[factorKey] || factorKey;
  }

  /**
   * Calculate percentile ranking for a score
   * 
   * @param score The score to calculate percentile for
   * @returns Estimated percentile ranking (0-100)
   */
  private calculatePercentileRanking(score: number): number {
    // In a real implementation, this would use actual distribution data
    // For now, we'll use a simple approximation
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate strength summary for a trust score
   * 
   * @param trustScore The trust score to analyze
   * @returns Strength summary data
   */
  private generateStrengthSummary(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.StrengthSummary {
    // Collect all strengths from all factors
    const allStrengths: TrustScoreTypes.Strength[] = [];
    let highSignificanceCount = 0;
    let mediumSignificanceCount = 0;
    let lowSignificanceCount = 0;
    
    for (const factorScore of trustScore.factorScores.values()) {
      factorScore.strengths.forEach(strength => {
        allStrengths.push(strength);
        
        if (strength.significance === 'high') highSignificanceCount++;
        else if (strength.significance === 'medium') mediumSignificanceCount++;
        else lowSignificanceCount++;
      });
    }
    
    // Sort strengths by significance (high to low)
    const prioritizedStrengths = allStrengths.sort((a, b) => {
      const significanceOrder = { high: 3, medium: 2, low: 1 };
      return significanceOrder[b.significance] - significanceOrder[a.significance];
    });
    
    return {
      totalStrengths: allStrengths.length,
      highSignificanceCount,
      mediumSignificanceCount,
      lowSignificanceCount,
      prioritizedStrengths: prioritizedStrengths.slice(0, 5) // Top 5 strengths
    };
  }

  /**
   * Generate confidence analysis for a trust score
   * 
   * @param trustScore The trust score to analyze
   * @returns Confidence analysis data
   */
  private generateConfidenceAnalysis(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.ConfidenceAnalysis {
    // Find the factor with the lowest confidence
    let lowestConfidenceFactor = '';
    let lowestConfidence = 1.0;
    
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      if (factorScore.confidence < lowestConfidence) {
        lowestConfidence = factorScore.confidence;
        lowestConfidenceFactor = factorKey;
      }
    }
    
    // Calculate data completeness score
    const dataCompletenessScore = Math.round(trustScore.confidence * 100);
    
    // Generate recommendations for improvement
    const recommendations = this.generateConfidenceRecommendations(trustScore);
    
    return {
      overallConfidence: trustScore.confidence,
      lowestConfidenceFactor,
      dataCompletenessScore,
      recommendationsForImprovement: recommendations
    };
  }

  /**
   * Generate recommendations for improving confidence
   * 
   * @param trustScore The trust score to analyze
   * @returns Array of recommendations
   */
  private generateConfidenceRecommendations(trustScore: TrustScoreTypes.NFTTrustScore): string[] {
    const recommendations: string[] = [];
    
    // Check for factors with low confidence
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      if (factorScore.confidence < 0.5) {
        const factorName = this.getFactorName(factorKey);
        
        switch (factorKey) {
          case 'originality':
            recommendations.push(`Improve ${factorName} confidence by submitting the NFT for more comprehensive image analysis.`);
            break;
          case 'transactionLegitimacy':
            recommendations.push(`Improve ${factorName} confidence by allowing more time for transaction history to develop.`);
            break;
          case 'creatorReputation':
            recommendations.push(`Improve ${factorName} confidence by verifying the creator across more platforms.`);
            break;
          case 'collectionPerformance':
            recommendations.push(`Improve ${factorName} confidence by providing more collection metadata and history.`);
            break;
          case 'metadataConsistency':
            recommendations.push(`Improve ${factorName} confidence by enhancing NFT metadata with more complete attributes.`);
            break;
          case 'marketplaceVerification':
            recommendations.push(`Improve ${factorName} confidence by listing the NFT on more verified marketplaces.`);
            break;
          case 'socialValidation':
            recommendations.push(`Improve ${factorName} confidence by increasing social media presence and engagement.`);
            break;
          default:
            recommendations.push(`Improve ${factorName} confidence by providing more complete data.`);
        }
      }
    }
    
    // Add general recommendations if needed
    if (recommendations.length === 0) {
      recommendations.push("Overall confidence is good, but could be improved by longer history on the blockchain.");
    }
    
    return recommendations;
  }

  /**
   * Calculate percentile ranking for a score
   * 
   * @param score The score to rank
   * @returns Percentile ranking (0-100)
   */
  private calculatePercentileRanking(score: number): number {
    // In a real implementation, this would use actual distribution data
    // For now, we'll use a simple approximation
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get a human-readable name for a factor key
   * 
   * @param factorKey The key identifying the factor
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
      'socialValidation': 'Social Validation',
      'multiple': 'Multiple Factors'
    };
    
    return factorNames[factorKey] || factorKey;
  }

  /**
   * Get a category label for a score
   * 
   * @param score The score to categorize
   * @returns Category label
   */
  private getScoreCategory(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Concerning';
    return 'Poor';
  }

  /**
   * Get a category label for a confidence value
   * 
   * @param confidence The confidence value to categorize
   * @returns Category label
   */
  private getConfidenceCategory(confidence: number): string {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Moderate';
    return 'Low';
  }
}
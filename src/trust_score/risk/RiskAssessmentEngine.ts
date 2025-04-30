/**
 * RiskAssessmentEngine.ts
 * 
 * Implements the Multi-Factor Risk Assessment system that evaluates
 * various risk dimensions based on trust factors and additional metrics.
 */

import { FactorCalculator } from '../factors/FactorCalculator';
import { ScoreAggregator } from '../aggregation/ScoreAggregator';
import { TrustScoreTypes } from '../types';

/**
 * Responsible for assessing risk across multiple dimensions
 * and generating risk profiles with mitigation recommendations.
 */
export class RiskAssessmentEngine {
  private factorCalculators: Map<string, FactorCalculator>;
  private scoreAggregator: ScoreAggregator;

  /**
   * Initialize the Risk Assessment Engine
   * 
   * @param factorCalculators Map of factor calculators to use for risk assessment
   * @param scoreAggregator The score aggregator for weighted calculations
   */
  constructor(
    factorCalculators: Map<string, FactorCalculator>,
    scoreAggregator: ScoreAggregator
  ) {
    this.factorCalculators = factorCalculators;
    this.scoreAggregator = scoreAggregator;
  }

  /**
   * Assess the risk profile of an NFT based on its trust score
   * 
   * @param nftId The unique identifier for the NFT
   * @param trustScore The previously calculated trust score
   * @returns A comprehensive risk assessment
   */
  public assessNFTRisk(
    nftId: string,
    trustScore: TrustScoreTypes.NFTTrustScore
  ): TrustScoreTypes.RiskAssessment {
    // Calculate risk dimensions
    const riskDimensions = new Map<string, TrustScoreTypes.RiskDimension>();
    
    // Convert trust factors to risk dimensions
    riskDimensions.set('authenticity', this.calculateAuthenticityRisk(trustScore));
    riskDimensions.set('market_manipulation', this.calculateMarketManipulationRisk(trustScore));
    riskDimensions.set('creator_abandonment', this.calculateCreatorAbandonmentRisk(trustScore));
    riskDimensions.set('liquidity', this.calculateLiquidityRisk(trustScore));
    riskDimensions.set('volatility', this.calculateVolatilityRisk(trustScore));
    
    // Determine overall risk level
    const overallRiskLevel = this.calculateOverallRiskLevel(riskDimensions);
    
    // Generate explanation
    const explanation = this.generateRiskExplanation(overallRiskLevel, riskDimensions);
    
    // Generate mitigation recommendations
    const mitigationRecommendations = this.generateMitigationRecommendations(riskDimensions);
    
    return {
      entityId: nftId,
      entityType: 'nft',
      overallRiskLevel,
      riskDimensions,
      explanation,
      mitigationRecommendations
    };
  }

  /**
   * Calculate authenticity risk based on originality and metadata factors
   * 
   * @param trustScore The NFT trust score
   * @returns Authenticity risk dimension
   */
  private calculateAuthenticityRisk(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.RiskDimension {
    // Get relevant factor scores
    const originalityScore = trustScore.factorScores.get('originality');
    const metadataScore = trustScore.factorScores.get('metadata');
    
    // Default values if factors are missing
    const originalityValue = originalityScore ? originalityScore.score : 50;
    const metadataValue = metadataScore ? metadataScore.score : 50;
    const originalityConfidence = originalityScore ? originalityScore.confidence : 0.3;
    const metadataConfidence = metadataScore ? metadataScore.confidence : 0.3;
    
    // Calculate risk score (inverse of trust score)
    const riskScore = 100 - ((originalityValue * 0.7) + (metadataValue * 0.3));
    
    // Calculate confidence
    const confidence = (originalityConfidence * 0.7) + (metadataConfidence * 0.3);
    
    // Determine risk level
    const level = this.getRiskLevel(riskScore);
    
    // Identify contributing factors
    const contributingFactors: string[] = [];
    
    if (originalityValue < 50) {
      contributingFactors.push('Low originality score');
    }
    
    if (metadataValue < 50) {
      contributingFactors.push('Poor metadata consistency');
    }
    
    // Add red flags as contributing factors
    if (originalityScore && originalityScore.redFlags.length > 0) {
      originalityScore.redFlags.forEach(flag => {
        contributingFactors.push(`Originality issue: ${flag.description}`);
      });
    }
    
    if (metadataScore && metadataScore.redFlags.length > 0) {
      metadataScore.redFlags.forEach(flag => {
        contributingFactors.push(`Metadata issue: ${flag.description}`);
      });
    }
    
    // Generate explanation
    let explanation = '';
    
    if (level === 'high') {
      explanation = 'High risk of authenticity issues due to significant concerns with originality and/or metadata consistency.';
    } else if (level === 'medium') {
      explanation = 'Moderate authenticity risk with some concerns about originality or metadata consistency.';
    } else {
      explanation = 'Low authenticity risk with good originality scores and consistent metadata.';
    }
    
    return {
      name: 'Authenticity Risk',
      level,
      score: riskScore,
      confidence,
      explanation,
      contributingFactors
    };
  }

  /**
   * Calculate market manipulation risk based on transaction legitimacy factor
   * 
   * @param trustScore The NFT trust score
   * @returns Market manipulation risk dimension
   */
  private calculateMarketManipulationRisk(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.RiskDimension {
    // Get relevant factor scores
    const transactionScore = trustScore.factorScores.get('transaction');
    
    // Default values if factor is missing
    const transactionValue = transactionScore ? transactionScore.score : 50;
    const transactionConfidence = transactionScore ? transactionScore.confidence : 0.3;
    
    // Calculate risk score (inverse of trust score)
    const riskScore = 100 - transactionValue;
    
    // Calculate confidence
    const confidence = transactionConfidence;
    
    // Determine risk level
    const level = this.getRiskLevel(riskScore);
    
    // Identify contributing factors
    const contributingFactors: string[] = [];
    
    if (transactionValue < 50) {
      contributingFactors.push('Low transaction legitimacy score');
    }
    
    // Add red flags as contributing factors
    if (transactionScore && transactionScore.redFlags.length > 0) {
      transactionScore.redFlags.forEach(flag => {
        contributingFactors.push(`Transaction issue: ${flag.description}`);
      });
    }
    
    // Add details from transaction score if available
    if (transactionScore && transactionScore.details) {
      const details = transactionScore.details;
      
      if (details.washTradingScore !== undefined && details.washTradingScore < 0.5) {
        contributingFactors.push('Potential wash trading detected');
      }
      
      if (details.priceManipulationScore !== undefined && details.priceManipulationScore < 0.5) {
        contributingFactors.push('Suspicious price manipulation patterns');
      }
    }
    
    // Generate explanation
    let explanation = '';
    
    if (level === 'high') {
      explanation = 'High risk of market manipulation with strong indicators of wash trading or price manipulation.';
    } else if (level === 'medium') {
      explanation = 'Moderate market manipulation risk with some suspicious transaction patterns.';
    } else {
      explanation = 'Low market manipulation risk with legitimate transaction history.';
    }
    
    return {
      name: 'Market Manipulation Risk',
      level,
      score: riskScore,
      confidence,
      explanation,
      contributingFactors
    };
  }

  /**
   * Calculate creator abandonment risk based on creator reputation factor
   * 
   * @param trustScore The NFT trust score
   * @returns Creator abandonment risk dimension
   */
  private calculateCreatorAbandonmentRisk(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.RiskDimension {
    // Get relevant factor scores
    const creatorScore = trustScore.factorScores.get('creator');
    
    // Default values if factor is missing
    const creatorValue = creatorScore ? creatorScore.score : 50;
    const creatorConfidence = creatorScore ? creatorScore.confidence : 0.3;
    
    // Calculate risk score (inverse of trust score)
    const riskScore = 100 - creatorValue;
    
    // Calculate confidence
    const confidence = creatorConfidence;
    
    // Determine risk level
    const level = this.getRiskLevel(riskScore);
    
    // Identify contributing factors
    const contributingFactors: string[] = [];
    
    if (creatorValue < 50) {
      contributingFactors.push('Low creator reputation score');
    }
    
    // Add red flags as contributing factors
    if (creatorScore && creatorScore.redFlags.length > 0) {
      creatorScore.redFlags.forEach(flag => {
        contributingFactors.push(`Creator issue: ${flag.description}`);
      });
    }
    
    // Generate explanation
    let explanation = '';
    
    if (level === 'high') {
      explanation = 'High risk of creator abandonment based on poor project delivery history or inconsistent creator activity.';
    } else if (level === 'medium') {
      explanation = 'Moderate creator abandonment risk with some concerns about creator history or engagement.';
    } else {
      explanation = 'Low creator abandonment risk with strong creator reputation and consistent project delivery.';
    }
    
    return {
      name: 'Creator Abandonment Risk',
      level,
      score: riskScore,
      confidence,
      explanation,
      contributingFactors
    };
  }

  /**
   * Calculate liquidity risk based on collection performance and marketplace factors
   * 
   * @param trustScore The NFT trust score
   * @returns Liquidity risk dimension
   */
  private calculateLiquidityRisk(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.RiskDimension {
    // Get relevant factor scores
    const collectionScore = trustScore.factorScores.get('collection');
    const marketplaceScore = trustScore.factorScores.get('marketplace');
    
    // Default values if factors are missing
    const collectionValue = collectionScore ? collectionScore.score : 50;
    const marketplaceValue = marketplaceScore ? marketplaceScore.score : 50;
    const collectionConfidence = collectionScore ? collectionScore.confidence : 0.3;
    const marketplaceConfidence = marketplaceScore ? marketplaceScore.confidence : 0.3;
    
    // Calculate risk score (inverse of weighted trust scores)
    const riskScore = 100 - ((collectionValue * 0.6) + (marketplaceValue * 0.4));
    
    // Calculate confidence
    const confidence = (collectionConfidence * 0.6) + (marketplaceConfidence * 0.4);
    
    // Determine risk level
    const level = this.getRiskLevel(riskScore);
    
    // Identify contributing factors
    const contributingFactors: string[] = [];
    
    if (collectionValue < 50) {
      contributingFactors.push('Poor collection performance');
    }
    
    if (marketplaceValue < 50) {
      contributingFactors.push('Limited marketplace presence');
    }
    
    // Add red flags as contributing factors
    if (collectionScore && collectionScore.redFlags.length > 0) {
      collectionScore.redFlags.forEach(flag => {
        contributingFactors.push(`Collection issue: ${flag.description}`);
      });
    }
    
    if (marketplaceScore && marketplaceScore.redFlags.length > 0) {
      marketplaceScore.redFlags.forEach(flag => {
        contributingFactors.push(`Marketplace issue: ${flag.description}`);
      });
    }
    
    // Generate explanation
    let explanation = '';
    
    if (level === 'high') {
      explanation = 'High liquidity risk due to poor collection performance or limited marketplace presence, potentially making the NFT difficult to sell.';
    } else if (level === 'medium') {
      explanation = 'Moderate liquidity risk with some concerns about trading volume or marketplace listings.';
    } else {
      explanation = 'Low liquidity risk with strong collection performance and good marketplace presence.';
    }
    
    return {
      name: 'Liquidity Risk',
      level,
      score: riskScore,
      confidence,
      explanation,
      contributingFactors
    };
  }

  /**
   * Calculate volatility risk based on transaction history and collection performance
   * 
   * @param trustScore The NFT trust score
   * @returns Volatility risk dimension
   */
  private calculateVolatilityRisk(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.RiskDimension {
    // Get relevant factor scores
    const transactionScore = trustScore.factorScores.get('transaction');
    const collectionScore = trustScore.factorScores.get('collection');
    
    // Default values if factors are missing
    const transactionValue = transactionScore ? transactionScore.score : 50;
    const collectionValue = collectionScore ? collectionScore.score : 50;
    const transactionConfidence = transactionScore ? transactionScore.confidence : 0.3;
    const collectionConfidence = collectionScore ? collectionScore.confidence : 0.3;
    
    // For volatility, we need to look at price stability rather than just the trust score
    // Higher transaction legitimacy usually means more stable prices
    // Higher collection performance usually means more stable floor price
    
    // Calculate risk score (custom formula for volatility)
    // We're using a different approach than just inverting the trust score
    let volatilityScore = 50; // Default moderate volatility
    
    // Adjust based on transaction legitimacy (stable transactions = lower volatility)
    volatilityScore -= (transactionValue - 50) * 0.3;
    
    // Adjust based on collection performance (strong collection = lower volatility)
    volatilityScore -= (collectionValue - 50) * 0.3;
    
    // Ensure score is within bounds
    volatilityScore = Math.max(0, Math.min(100, volatilityScore));
    
    // Calculate confidence
    const confidence = (transactionConfidence * 0.5) + (collectionConfidence * 0.5);
    
    // Determine risk level
    const level = this.getRiskLevel(volatilityScore);
    
    // Identify contributing factors
    const contributingFactors: string[] = [];
    
    // Check for price volatility in transaction details
    if (transactionScore && transactionScore.details && 
        transactionScore.details.metrics && 
        transactionScore.details.metrics.priceChanges) {
      
      const priceChanges = transactionScore.details.metrics.priceChanges;
      let hasExtremeChanges = false;
      
      for (const change of priceChanges) {
        if (Math.abs(change.percentChange) > 50) {
          hasExtremeChanges = true;
          break;
        }
      }
      
      if (hasExtremeChanges) {
        contributingFactors.push('History of extreme price changes');
      }
    }
    
    if (transactionValue < 50) {
      contributingFactors.push('Suspicious transaction patterns');
    }
    
    if (collectionValue < 50) {
      contributingFactors.push('Unstable collection performance');
    }
    
    // Generate explanation
    let explanation = '';
    
    if (level === 'high') {
      explanation = 'High price volatility risk with history of extreme price fluctuations or unstable collection floor price.';
    } else if (level === 'medium') {
      explanation = 'Moderate price volatility risk with some price fluctuations or collection instability.';
    } else {
      explanation = 'Low price volatility risk with stable price history and strong collection floor price.';
    }
    
    return {
      name: 'Price Volatility Risk',
      level,
      score: volatilityScore,
      confidence,
      explanation,
      contributingFactors
    };
  }

  /**
   * Calculate the overall risk level based on all risk dimensions
   * 
   * @param riskDimensions Map of risk dimensions
   * @returns Overall risk level (low, medium, high)
   */
  private calculateOverallRiskLevel(
    riskDimensions: Map<string, TrustScoreTypes.RiskDimension>
  ): 'low' | 'medium' | 'high' {
    // Count risk levels
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    
    for (const dimension of riskDimensions.values()) {
      if (dimension.level === 'high') highCount++;
      else if (dimension.level === 'medium') mediumCount++;
      else lowCount++;
    }
    
    // Determine overall level
    if (highCount >= 2) {
      return 'high';
    } else if (highCount === 1 || mediumCount >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate a human-readable explanation of the risk assessment
   * 
   * @param overallRiskLevel The overall risk level
   * @param riskDimensions Map of risk dimensions
   * @returns Comprehensive risk explanation
   */
  private generateRiskExplanation(
    overallRiskLevel: 'low' | 'medium' | 'high',
    riskDimensions: Map<string, TrustScoreTypes.RiskDimension>
  ): string {
    let explanation = '';
    
    // Start with overall assessment
    if (overallRiskLevel === 'high') {
      explanation = 'This NFT has a HIGH RISK profile. Significant caution is advised before purchasing or investing. ';
    } else if (overallRiskLevel === 'medium') {
      explanation = 'This NFT has a MEDIUM RISK profile. Some caution is advised, and you should review the specific risk factors before purchasing. ';
    } else {
      explanation = 'This NFT has a LOW RISK profile. While all NFTs carry some inherent risk, this one shows fewer concerning factors than most. ';
    }
    
    // Add information about highest risk dimensions
    const highRiskDimensions: TrustScoreTypes.RiskDimension[] = [];
    const mediumRiskDimensions: TrustScoreTypes.RiskDimension[] = [];
    
    for (const dimension of riskDimensions.values()) {
      if (dimension.level === 'high') {
        highRiskDimensions.push(dimension);
      } else if (dimension.level === 'medium') {
        mediumRiskDimensions.push(dimension);
      }
    }
    
    // Add high risk dimensions to explanation
    if (highRiskDimensions.length > 0) {
      explanation += 'Key areas of concern include: ';
      explanation += highRiskDimensions.map(d => d.name).join(', ');
      explanation += '. ';
    }
    
    // Add medium risk dimensions if there are no high ones
    if (highRiskDimensions.length === 0 && mediumRiskDimensions.length > 0) {
      explanation += 'Areas to be aware of include: ';
      explanation += mediumRiskDimensions.map(d => d.name).join(', ');
      explanation += '. ';
    }
    
    // Add a summary of the most significant risk
    const mostSignificantRisk = this.getMostSignificantRisk(riskDimensions);
    if (mostSignificantRisk) {
      explanation += `The most significant risk factor is ${mostSignificantRisk.name}: ${mostSignificantRisk.explanation}`;
    }
    
    return explanation;
  }

  /**
   * Generate mitigation recommendations based on risk dimensions
   * 
   * @param riskDimensions Map of risk dimensions
   * @returns Array of mitigation recommendations
   */
  private generateMitigationRecommendations(
    riskDimensions: Map<string, TrustScoreTypes.RiskDimension>
  ): TrustScoreTypes.MitigationRecommendation[] {
    const recommendations: TrustScoreTypes.MitigationRecommendation[] = [];
    
    // Generate recommendations for each high or medium risk dimension
    for (const [key, dimension] of riskDimensions.entries()) {
      if (dimension.level === 'high' || dimension.level === 'medium') {
        const priority = dimension.level === 'high' ? 8 : 5;
        
        switch (key) {
          case 'authenticity':
            recommendations.push({
              priority,
              description: 'Verify the NFT creator\'s identity across multiple platforms',
              expectedImpact: 'Reduces risk of purchasing an unauthorized copy or derivative work',
              difficulty: 'moderate'
            });
            recommendations.push({
              priority: priority - 1,
              description: 'Request additional provenance documentation from the creator',
              expectedImpact: 'Establishes clear ownership history and authenticity',
              difficulty: 'moderate'
            });
            break;
            
          case 'market_manipulation':
            recommendations.push({
              priority,
              description: 'Wait for more legitimate trading history to develop',
              expectedImpact: 'Allows market manipulation patterns to become more evident',
              difficulty: 'easy'
            });
            recommendations.push({
              priority: priority - 1,
              description: 'Research wallet relationships of recent transactions',
              expectedImpact: 'Helps identify potential wash trading between related parties',
              difficulty: 'difficult'
            });
            break;
            
          case 'creator_abandonment':
            recommendations.push({
              priority,
              description: 'Review the creator\'s social media activity and community engagement',
              expectedImpact: 'Indicates likelihood of continued project support',
              difficulty: 'easy'
            });
            recommendations.push({
              priority: priority - 1,
              description: 'Check for a published roadmap and delivery against previous milestones',
              expectedImpact: 'Demonstrates creator commitment and follow-through',
              difficulty: 'moderate'
            });
            break;
            
          case 'liquidity':
            recommendations.push({
              priority,
              description: 'Verify the NFT is listed on multiple reputable marketplaces',
              expectedImpact: 'Increases potential buyer pool and liquidity',
              difficulty: 'easy'
            });
            recommendations.push({
              priority: priority - 1,
              description: 'Check daily trading volume of the collection over time',
              expectedImpact: 'Indicates how quickly you could sell if needed',
              difficulty: 'easy'
            });
            break;
            
          case 'volatility':
            recommendations.push({
              priority,
              description: 'Analyze price history over different time periods',
              expectedImpact: 'Helps identify cyclical patterns and extreme fluctuations',
              difficulty: 'moderate'
            });
            recommendations.push({
              priority: priority - 1,
              description: 'Compare price stability to similar NFTs in the same collection',
              expectedImpact: 'Provides context for whether volatility is asset-specific or collection-wide',
              difficulty: 'moderate'
            });
            break;
        }
      }
    }
    
    // Sort recommendations by priority (highest first)
    recommendations.sort((a, b) => b.priority - a.priority);
    
    return recommendations;
  }

  /**
   * Get the most significant risk dimension
   * 
   * @param riskDimensions Map of risk dimensions
   * @returns The most significant risk dimension, if any
   */
  private getMostSignificantRisk(
    riskDimensions: Map<string, TrustScoreTypes.RiskDimension>
  ): TrustScoreTypes.RiskDimension | undefined {
    let highestRiskScore = 0;
    let mostSignificantRisk: TrustScoreTypes.RiskDimension | undefined;
    
    for (const dimension of riskDimensions.values()) {
      // Weight high level risks more heavily
      const weightedScore = dimension.score * 
        (dimension.level === 'high' ? 1.5 : 
         dimension.level === 'medium' ? 1.2 : 1.0);
      
      if (weightedScore > highestRiskScore) {
        highestRiskScore = weightedScore;
        mostSignificantRisk = dimension;
      }
    }
    
    return mostSignificantRisk;
  }

  /**
   * Convert a risk score to a risk level
   * 
   * @param score The risk score (0-100)
   * @returns Risk level (low, medium, high)
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
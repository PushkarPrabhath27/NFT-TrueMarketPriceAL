/**
 * RiskMitigationService.ts
 * 
 * Implements the Risk Mitigation Recommendations system that provides
 * personalized suggestions to mitigate identified risks.
 */

import { TrustScoreTypes } from '../types';

/**
 * Service responsible for generating personalized risk mitigation recommendations
 * based on identified risk factors and user preferences.
 */
export class RiskMitigationService {
  private userPreferences: Map<string, TrustScoreTypes.UserPreferences>;
  
  /**
   * Initialize the Risk Mitigation Service
   */
  constructor() {
    this.userPreferences = new Map<string, TrustScoreTypes.UserPreferences>();
  }
  
  /**
   * Set user preferences for personalized recommendations
   * 
   * @param userId The unique identifier for the user
   * @param preferences The user's preferences
   */
  public setUserPreferences(userId: string, preferences: TrustScoreTypes.UserPreferences): void {
    this.userPreferences.set(userId, preferences);
  }
  
  /**
   * Generate personalized mitigation recommendations based on risk assessment
   * 
   * @param riskAssessment The risk assessment to generate recommendations for
   * @param userId Optional user ID for personalized recommendations
   * @returns Array of mitigation recommendations
   */
  public generateMitigationRecommendations(
    riskAssessment: TrustScoreTypes.RiskAssessment,
    userId?: string
  ): TrustScoreTypes.MitigationRecommendation[] {
    // Get user preferences if available
    const preferences = userId ? this.userPreferences.get(userId) : undefined;
    
    // Generate base recommendations from risk dimensions
    let recommendations = this.generateBaseRecommendations(riskAssessment.riskDimensions);
    
    // Apply conditional logic based on risk level
    recommendations = this.applyConditionalLogic(recommendations, riskAssessment);
    
    // Personalize recommendations if user preferences are available
    if (preferences) {
      recommendations = this.personalizeRecommendations(recommendations, preferences);
    }
    
    // Sort by priority and limit to a reasonable number
    return this.prioritizeRecommendations(recommendations);
  }
  
  /**
   * Generate base recommendations from risk dimensions
   * 
   * @param riskDimensions Map of risk dimensions
   * @returns Array of base mitigation recommendations
   */
  private generateBaseRecommendations(
    riskDimensions: Map<string, TrustScoreTypes.RiskDimension>
  ): TrustScoreTypes.MitigationRecommendation[] {
    const recommendations: TrustScoreTypes.MitigationRecommendation[] = [];
    
    // Generate recommendations for each risk dimension
    for (const [dimensionKey, dimension] of riskDimensions.entries()) {
      // Skip low risk dimensions
      if (dimension.level === 'low') continue;
      
      // Base priority on risk level
      const basePriority = dimension.level === 'high' ? 10 : 5;
      
      // Generate dimension-specific recommendations
      switch (dimensionKey) {
        case 'authenticity':
          if (dimension.level === 'high') {
            recommendations.push({
              priority: basePriority,
              description: 'Request additional verification from the creator',
              expectedImpact: 'Confirms the NFT is authentic and created by the claimed artist',
              difficulty: 'moderate'
            });
          }
          recommendations.push({
            priority: basePriority - 1,
            description: 'Check the creator\'s social media for posts about this NFT',
            expectedImpact: 'Verifies the creator acknowledges this as their work',
            difficulty: 'easy'
          });
          break;
          
        case 'market_manipulation':
          recommendations.push({
            priority: basePriority,
            description: 'Analyze transaction patterns across the collection',
            expectedImpact: 'Identifies if manipulation is isolated or collection-wide',
            difficulty: 'moderate'
          });
          if (dimension.level === 'high') {
            recommendations.push({
              priority: basePriority + 1,
              description: 'Wait for more organic trading history before purchasing',
              expectedImpact: 'Avoids potential price manipulation schemes',
              difficulty: 'easy'
            });
          }
          break;
          
        case 'creator_abandonment':
          recommendations.push({
            priority: basePriority,
            description: 'Review creator\'s recent activity across all projects',
            expectedImpact: 'Determines if inactivity is project-specific or creator-wide',
            difficulty: 'easy'
          });
          if (dimension.level === 'high') {
            recommendations.push({
              priority: basePriority + 1,
              description: 'Evaluate the community\'s ability to sustain the project',
              expectedImpact: 'Assesses if the project can thrive without active creator involvement',
              difficulty: 'moderate'
            });
          }
          break;
          
        case 'liquidity':
          recommendations.push({
            priority: basePriority,
            description: 'Check trading volume trends over different time periods',
            expectedImpact: 'Identifies if liquidity issues are temporary or persistent',
            difficulty: 'easy'
          });
          if (dimension.level === 'high') {
            recommendations.push({
              priority: basePriority - 1,
              description: 'Consider the long-term holding implications',
              expectedImpact: 'Prepares for potentially difficult exit if needed',
              difficulty: 'easy'
            });
          }
          break;
          
        case 'volatility':
          recommendations.push({
            priority: basePriority,
            description: 'Analyze price history over different time periods',
            expectedImpact: 'Helps identify cyclical patterns and extreme fluctuations',
            difficulty: 'moderate'
          });
          recommendations.push({
            priority: basePriority - 1,
            description: 'Compare price stability to similar NFTs in the same collection',
            expectedImpact: 'Provides context for whether volatility is asset-specific or collection-wide',
            difficulty: 'moderate'
          });
          break;
          
        default:
          // Generic recommendations for other risk dimensions
          recommendations.push({
            priority: basePriority - 2,
            description: `Research more about the ${dimensionKey.replace('_', ' ')} risk`,
            expectedImpact: 'Provides better understanding of the specific risk factors',
            difficulty: 'moderate'
          });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Apply conditional logic to recommendations based on overall risk assessment
   * 
   * @param recommendations Base recommendations
   * @param riskAssessment Complete risk assessment
   * @returns Updated recommendations
   */
  private applyConditionalLogic(
    recommendations: TrustScoreTypes.MitigationRecommendation[],
    riskAssessment: TrustScoreTypes.RiskAssessment
  ): TrustScoreTypes.MitigationRecommendation[] {
    // Add overall risk level recommendations
    if (riskAssessment.overallRiskLevel === 'high') {
      recommendations.push({
        priority: 15, // Highest priority
        description: 'Consider alternative NFTs with lower risk profiles',
        expectedImpact: 'Avoids high-risk investments in favor of safer options',
        difficulty: 'easy'
      });
    }
    
    // Check for multiple high-risk dimensions
    let highRiskCount = 0;
    for (const dimension of riskAssessment.riskDimensions.values()) {
      if (dimension.level === 'high') highRiskCount++;
    }
    
    if (highRiskCount >= 2) {
      recommendations.push({
        priority: 12,
        description: 'Conduct comprehensive due diligence before proceeding',
        expectedImpact: 'Ensures all high-risk factors are thoroughly investigated',
        difficulty: 'hard'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Personalize recommendations based on user preferences
   * 
   * @param recommendations Base recommendations
   * @param preferences User preferences
   * @returns Personalized recommendations
   */
  private personalizeRecommendations(
    recommendations: TrustScoreTypes.MitigationRecommendation[],
    preferences: TrustScoreTypes.UserPreferences
  ): TrustScoreTypes.MitigationRecommendation[] {
    // Filter out recommendations that don't match user's risk tolerance
    const personalizedRecommendations = recommendations.filter(rec => {
      // For risk-averse users, include all recommendations
      if (preferences.riskTolerance === 'low') return true;
      
      // For moderate risk tolerance, exclude low priority recommendations for easy tasks
      if (preferences.riskTolerance === 'medium' && 
          rec.priority < 5 && 
          rec.difficulty === 'easy') {
        return false;
      }
      
      // For high risk tolerance, only include high priority recommendations
      if (preferences.riskTolerance === 'high' && rec.priority < 8) {
        return false;
      }
      
      return true;
    });
    
    // Adjust priorities based on user's investment goals
    return personalizedRecommendations.map(rec => {
      const newRec = {...rec};
      
      // Increase priority for recommendations that align with investment goals
      if (preferences.investmentGoals.includes('long_term') && 
          (rec.description.includes('long-term') || rec.description.includes('sustainable'))) {
        newRec.priority += 2;
      }
      
      if (preferences.investmentGoals.includes('quick_flip') && 
          (rec.description.includes('liquidity') || rec.description.includes('trading volume'))) {
        newRec.priority += 2;
      }
      
      return newRec;
    });
  }
  
  /**
   * Prioritize and limit recommendations to a reasonable number
   * 
   * @param recommendations All generated recommendations
   * @returns Prioritized and limited recommendations
   */
  private prioritizeRecommendations(
    recommendations: TrustScoreTypes.MitigationRecommendation[]
  ): TrustScoreTypes.MitigationRecommendation[] {
    // Sort by priority (highest first)
    const sortedRecommendations = [...recommendations].sort((a, b) => b.priority - a.priority);
    
    // Limit to a reasonable number (top 5)
    return sortedRecommendations.slice(0, 5);
  }
}
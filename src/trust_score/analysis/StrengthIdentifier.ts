/**
 * StrengthIdentifier.ts
 * 
 * Implements the Strength Identification component of the Trust Factor Analysis System.
 * This class is responsible for detecting exceptional positive signals in NFTs,
 * classifying their significance, generating explanations, and prioritizing them.
 */

import { TrustScoreTypes } from '../types';

/**
 * Responsible for identifying and analyzing strengths in NFT trust factors
 */
export class StrengthIdentifier {
  /**
   * Detect exceptional positive signals across all factors
   * 
   * @param trustScore The trust score containing factor data
   * @returns Array of identified strengths with significance classification
   */
  public identifyStrengths(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.Strength[] {
    const allStrengths: TrustScoreTypes.Strength[] = [];
    
    // Collect strengths from all factors
    for (const factorScore of trustScore.factorScores.values()) {
      // Add existing strengths from factor calculations
      allStrengths.push(...factorScore.strengths);
      
      // Identify additional strengths based on factor score and details
      const additionalStrengths = this.detectAdditionalStrengths(factorScore);
      allStrengths.push(...additionalStrengths);
    }
    
    // Deduplicate strengths (in case similar strengths were detected)
    const uniqueStrengths = this.deduplicateStrengths(allStrengths);
    
    // Classify significance for any strengths that don't have it set
    const classifiedStrengths = this.classifySignificance(uniqueStrengths);
    
    // Sort strengths by significance
    return this.prioritizeStrengths(classifiedStrengths);
  }
  
  /**
   * Detect additional strengths not already identified in factor calculations
   * 
   * @param factorScore The factor score to analyze
   * @returns Array of additional strengths
   */
  private detectAdditionalStrengths(factorScore: TrustScoreTypes.FactorScore): TrustScoreTypes.Strength[] {
    const additionalStrengths: TrustScoreTypes.Strength[] = [];
    
    // Check for exceptionally high score
    if (factorScore.score >= 90) {
      additionalStrengths.push({
        significance: 'high',
        description: `Exceptional performance in this factor (${factorScore.score}/100)`,
        evidence: `Score is in the top 10% of all NFTs analyzed for this factor.`
      });
    } else if (factorScore.score >= 80) {
      additionalStrengths.push({
        significance: 'medium',
        description: `Strong performance in this factor (${factorScore.score}/100)`,
        evidence: `Score is in the top 20% of all NFTs analyzed for this factor.`
      });
    }
    
    // Check for high confidence with good score
    if (factorScore.confidence > 0.9 && factorScore.score >= 75) {
      additionalStrengths.push({
        significance: 'medium',
        description: 'High confidence in positive assessment',
        evidence: `Analysis is based on comprehensive data with ${(factorScore.confidence * 100).toFixed(1)}% confidence.`
      });
    }
    
    // Factor-specific strength detection could be added here
    // This would analyze factorScore.details for factor-specific signals
    
    return additionalStrengths;
  }
  
  /**
   * Remove duplicate or very similar strengths
   * 
   * @param strengths Array of strengths to deduplicate
   * @returns Deduplicated array of strengths
   */
  private deduplicateStrengths(strengths: TrustScoreTypes.Strength[]): TrustScoreTypes.Strength[] {
    const uniqueStrengths: TrustScoreTypes.Strength[] = [];
    const descriptionMap = new Map<string, TrustScoreTypes.Strength>();
    
    for (const strength of strengths) {
      // Create a normalized key for comparison
      const normalizedDesc = strength.description.toLowerCase().trim();
      
      // If we've seen this description before, keep the one with higher significance
      if (descriptionMap.has(normalizedDesc)) {
        const existing = descriptionMap.get(normalizedDesc)!;
        const significanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        
        if (significanceOrder[strength.significance] > significanceOrder[existing.significance]) {
          descriptionMap.set(normalizedDesc, strength);
        }
      } else {
        descriptionMap.set(normalizedDesc, strength);
      }
    }
    
    return Array.from(descriptionMap.values());
  }
  
  /**
   * Classify the significance of strengths
   * 
   * @param strengths Array of strengths to classify
   * @returns Array of strengths with classified significance
   */
  private classifySignificance(strengths: TrustScoreTypes.Strength[]): TrustScoreTypes.Strength[] {
    return strengths.map(strength => {
      // If significance is already set, return as is
      if (strength.significance) {
        return strength;
      }
      
      // Simple classification based on keywords in description
      const description = strength.description.toLowerCase();
      
      if (description.includes('exceptional') || 
          description.includes('outstanding') || 
          description.includes('excellent')) {
        return { ...strength, significance: 'high' };
      } else if (description.includes('strong') || 
                description.includes('notable') || 
                description.includes('significant')) {
        return { ...strength, significance: 'medium' };
      } else {
        return { ...strength, significance: 'low' };
      }
    });
  }
  
  /**
   * Prioritize strengths based on significance and other factors
   * 
   * @param strengths Array of strengths to prioritize
   * @returns Prioritized array of strengths
   */
  private prioritizeStrengths(strengths: TrustScoreTypes.Strength[]): TrustScoreTypes.Strength[] {
    // Sort by significance (high to low)
    return [...strengths].sort((a, b) => {
      const significanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return significanceOrder[b.significance] - significanceOrder[a.significance];
    });
  }
  
  /**
   * Generate a comprehensive strength summary
   * 
   * @param strengths Array of identified strengths
   * @returns Strength summary object
   */
  public generateStrengthSummary(strengths: TrustScoreTypes.Strength[]): TrustScoreTypes.StrengthSummary {
    // Count strengths by significance
    const highSignificanceCount = strengths.filter(s => s.significance === 'high').length;
    const mediumSignificanceCount = strengths.filter(s => s.significance === 'medium').length;
    const lowSignificanceCount = strengths.filter(s => s.significance === 'low').length;
    
    // Generate summary text
    let summaryText = '';
    if (strengths.length === 0) {
      summaryText = 'No exceptional strengths identified. This NFT meets basic expectations but does not stand out in any particular area.';
    } else {
      summaryText = `Identified ${strengths.length} notable strengths: `;
      if (highSignificanceCount > 0) {
        summaryText += `${highSignificanceCount} high significance, `;
      }
      if (mediumSignificanceCount > 0) {
        summaryText += `${mediumSignificanceCount} medium significance, `;
      }
      if (lowSignificanceCount > 0) {
        summaryText += `${lowSignificanceCount} low significance, `;
      }
      // Remove trailing comma and space
      summaryText = summaryText.slice(0, -2) + '.';
      
      // Add most significant strengths
      if (highSignificanceCount > 0) {
        const keyStrengths = strengths.filter(s => s.significance === 'high');
        summaryText += ' Key strengths: ' + 
          keyStrengths.map(s => s.description).join(', ') + '.';
      }
    }
    
    // Get prioritized strengths (top 5)
    const prioritizedStrengths = strengths.slice(0, 5);
    
    return {
      totalStrengths: strengths.length,
      highSignificanceCount,
      mediumSignificanceCount,
      lowSignificanceCount,
      prioritizedStrengths,
      summaryText
    };
  }
  
  /**
   * Generate evidence supporting identified strengths
   * 
   * @param strength The strength to generate evidence for
   * @param factorScore The factor score related to the strength
   * @returns Enhanced strength with detailed evidence
   */
  public enhanceStrengthEvidence(
    strength: TrustScoreTypes.Strength,
    factorScore: TrustScoreTypes.FactorScore
  ): TrustScoreTypes.Strength {
    // If evidence is already detailed, return as is
    if (strength.evidence && strength.evidence.length > 50) {
      return strength;
    }
    
    let enhancedEvidence = strength.evidence || '';
    
    // Add factor score context
    enhancedEvidence += ` Factor score: ${factorScore.score}/100 with ${(factorScore.confidence * 100).toFixed(1)}% confidence.`;
    
    // Add relevant details from factor score if available
    if (factorScore.details) {
      const relevantDetails = Object.entries(factorScore.details)
        .filter(([key, value]) => 
          typeof value !== 'object' && 
          key.toLowerCase().includes('positive') || 
          key.toLowerCase().includes('strength') ||
          key.toLowerCase().includes('quality')
        )
        .map(([key, value]) => `${key}: ${value}`);
      
      if (relevantDetails.length > 0) {
        enhancedEvidence += ` Supporting metrics: ${relevantDetails.join(', ')}.`;
      }
    }
    
    return {
      ...strength,
      evidence: enhancedEvidence.trim()
    };
  }
}
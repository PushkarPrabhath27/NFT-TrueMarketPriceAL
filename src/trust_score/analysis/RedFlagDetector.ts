/**
 * RedFlagDetector.ts
 * 
 * Implements the Red Flag Detection component of the Trust Factor Analysis System
 * that identifies common warning signs with severity classification and explanations.
 */

import { TrustScoreTypes } from '../types';

/**
 * Responsible for detecting red flags in NFT trust factors
 */
export class RedFlagDetector {
  // Common warning sign patterns to check for
  private warningSignPatterns: Map<string, RedFlagPattern>;

  /**
   * Initialize the Red Flag Detector with predefined warning sign patterns
   */
  constructor() {
    this.warningSignPatterns = this.initializeWarningSignPatterns();
  }

  /**
   * Detect red flags for an NFT based on its trust score
   * 
   * @param trustScore The calculated trust score for the NFT
   * @returns Array of detected red flags with severity and evidence
   */
  public detectRedFlags(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    // Check each factor for potential red flags
    for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
      // Get factor-specific red flags
      const factorFlags = this.detectFactorRedFlags(factorKey, factorScore, trustScore);
      redFlags.push(...factorFlags);
    }
    
    // Check for cross-factor red flags
    const crossFactorFlags = this.detectCrossFactorRedFlags(trustScore);
    redFlags.push(...crossFactorFlags);
    
    // Sort red flags by severity (high to low)
    return this.prioritizeRedFlags(redFlags);
  }

  /**
   * Detect red flags specific to a single trust factor
   * 
   * @param factorKey The key identifying the factor
   * @param factorScore The score data for the factor
   * @param trustScore The full trust score for context
   * @returns Array of detected red flags for this factor
   */
  private detectFactorRedFlags(
    factorKey: string,
    factorScore: TrustScoreTypes.FactorScore,
    trustScore: TrustScoreTypes.NFTTrustScore
  ): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    // Get patterns relevant to this factor
    const relevantPatterns = Array.from(this.warningSignPatterns.values())
      .filter(pattern => pattern.relevantFactors.includes(factorKey));
    
    // Apply each relevant pattern
    for (const pattern of relevantPatterns) {
      if (pattern.detector(factorKey, factorScore, trustScore)) {
        redFlags.push({
          id: pattern.id,
          description: pattern.generateDescription(factorKey, factorScore, trustScore),
          severity: pattern.determineSeverity(factorKey, factorScore, trustScore),
          evidence: pattern.generateEvidence(factorKey, factorScore, trustScore),
          factorKey
        });
      }
    }
    
    return redFlags;
  }

  /**
   * Detect red flags that involve multiple factors
   * 
   * @param trustScore The full trust score
   * @returns Array of detected cross-factor red flags
   */
  private detectCrossFactorRedFlags(trustScore: TrustScoreTypes.NFTTrustScore): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    // Get patterns that work across factors
    const crossFactorPatterns = Array.from(this.warningSignPatterns.values())
      .filter(pattern => pattern.isCrossFactor);
    
    // Apply each cross-factor pattern
    for (const pattern of crossFactorPatterns) {
      if (pattern.detector('', null, trustScore)) {
        redFlags.push({
          id: pattern.id,
          description: pattern.generateDescription('', null, trustScore),
          severity: pattern.determineSeverity('', null, trustScore),
          evidence: pattern.generateEvidence('', null, trustScore),
          factorKey: 'multiple'
        });
      }
    }
    
    return redFlags;
  }

  /**
   * Prioritize red flags based on severity and other factors
   * 
   * @param redFlags Array of detected red flags
   * @returns Prioritized array of red flags
   */
  private prioritizeRedFlags(redFlags: TrustScoreTypes.RedFlag[]): TrustScoreTypes.RedFlag[] {
    // Sort by severity (high to low)
    return redFlags.sort((a, b) => {
      // First sort by severity
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      // Then sort by factor importance (if from different factors)
      if (a.factorKey !== b.factorKey) {
        const factorWeights = {
          'originality': 20,
          'transactionLegitimacy': 20,
          'creatorReputation': 15,
          'collectionPerformance': 15,
          'metadataConsistency': 10,
          'marketplaceVerification': 10,
          'socialValidation': 10,
          'multiple': 25 // Cross-factor issues are important
        };
        
        return factorWeights[b.factorKey] - factorWeights[a.factorKey];
      }
      
      // Finally sort by ID for consistent ordering
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * Initialize the predefined warning sign patterns
   * 
   * @returns Map of warning sign patterns
   */
  private initializeWarningSignPatterns(): Map<string, RedFlagPattern> {
    const patterns = new Map<string, RedFlagPattern>();
    
    // Originality factor patterns
    patterns.set('high-similarity', {
      id: 'high-similarity',
      relevantFactors: ['originality'],
      isCrossFactor: false,
      detector: (factorKey, factorScore) => {
        return factorKey === 'originality' && 
               factorScore.score < 40 && 
               factorScore.details?.similarityScore > 0.8;
      },
      generateDescription: () => 'High similarity to existing NFTs detected',
      determineSeverity: (_, factorScore) => {
        const similarityScore = factorScore.details?.similarityScore || 0;
        return similarityScore > 0.9 ? 'high' : 'medium';
      },
      generateEvidence: (_, factorScore) => {
        const similarityScore = factorScore.details?.similarityScore || 0;
        const similarNFTs = factorScore.details?.similarNFTs || [];
        
        return `Similarity score of ${(similarityScore * 100).toFixed(1)}% detected. ` +
               `Similar to ${similarNFTs.length} existing NFTs.`;
      }
    });
    
    // Transaction legitimacy factor patterns
    patterns.set('wash-trading', {
      id: 'wash-trading',
      relevantFactors: ['transactionLegitimacy'],
      isCrossFactor: false,
      detector: (factorKey, factorScore) => {
        return factorKey === 'transactionLegitimacy' && 
               factorScore.score < 50 && 
               factorScore.details?.suspiciousTransactionRatio > 0.3;
      },
      generateDescription: () => 'Potential wash trading activity detected',
      determineSeverity: (_, factorScore) => {
        const ratio = factorScore.details?.suspiciousTransactionRatio || 0;
        return ratio > 0.6 ? 'high' : ratio > 0.4 ? 'medium' : 'low';
      },
      generateEvidence: (_, factorScore) => {
        const ratio = factorScore.details?.suspiciousTransactionRatio || 0;
        const count = factorScore.details?.suspiciousTransactionCount || 0;
        
        return `${(ratio * 100).toFixed(1)}% of transactions appear suspicious. ` +
               `${count} potentially connected wallet transactions identified.`;
      }
    });
    
    // Creator reputation factor patterns
    patterns.set('unverified-creator', {
      id: 'unverified-creator',
      relevantFactors: ['creatorReputation'],
      isCrossFactor: false,
      detector: (factorKey, factorScore) => {
        return factorKey === 'creatorReputation' && 
               factorScore.score < 40 && 
               factorScore.details?.verificationStatus === 'unverified';
      },
      generateDescription: () => 'Creator is unverified across platforms',
      determineSeverity: (_, factorScore) => {
        return factorScore.score < 20 ? 'high' : 'medium';
      },
      generateEvidence: (_, factorScore) => {
        const history = factorScore.details?.historyLength || 0;
        
        return `Creator is not verified on any major platforms. ` +
               `Creator has only ${history} previous NFTs in their history.`;
      }
    });
    
    // Collection performance factor patterns
    patterns.set('floor-price-decline', {
      id: 'floor-price-decline',
      relevantFactors: ['collectionPerformance'],
      isCrossFactor: false,
      detector: (factorKey, factorScore) => {
        return factorKey === 'collectionPerformance' && 
               factorScore.score < 50 && 
               factorScore.details?.floorPriceChange < -0.3;
      },
      generateDescription: () => 'Significant floor price decline in collection',
      determineSeverity: (_, factorScore) => {
        const decline = factorScore.details?.floorPriceChange || 0;
        return decline < -0.5 ? 'high' : 'medium';
      },
      generateEvidence: (_, factorScore) => {
        const decline = factorScore.details?.floorPriceChange || 0;
        const period = factorScore.details?.floorPriceChangePeriod || '30 days';
        
        return `Floor price has declined by ${Math.abs(decline * 100).toFixed(1)}% ` +
               `over the last ${period}.`;
      }
    });
    
    // Metadata consistency factor patterns
    patterns.set('broken-metadata', {
      id: 'broken-metadata',
      relevantFactors: ['metadataConsistency'],
      isCrossFactor: false,
      detector: (factorKey, factorScore) => {
        return factorKey === 'metadataConsistency' && 
               factorScore.score < 40 && 
               factorScore.details?.brokenReferences === true;
      },
      generateDescription: () => 'Broken metadata references detected',
      determineSeverity: () => 'high',
      generateEvidence: (_, factorScore) => {
        const issues = factorScore.details?.referenceIssues || [];
        
        return `Metadata contains ${issues.length} broken references. ` +
               `This may indicate abandoned or poorly maintained NFT.`;
      }
    });
    
    // Marketplace verification factor patterns
    patterns.set('marketplace-rejection', {
      id: 'marketplace-rejection',
      relevantFactors: ['marketplaceVerification'],
      isCrossFactor: false,
      detector: (factorKey, factorScore) => {
        return factorKey === 'marketplaceVerification' && 
               factorScore.score < 30 && 
               factorScore.details?.rejectedMarketplaces?.length > 0;
      },
      generateDescription: () => 'Rejected by one or more major marketplaces',
      determineSeverity: (_, factorScore) => {
        const rejections = factorScore.details?.rejectedMarketplaces?.length || 0;
        return rejections > 2 ? 'high' : 'medium';
      },
      generateEvidence: (_, factorScore) => {
        const rejections = factorScore.details?.rejectedMarketplaces || [];
        
        return `Rejected by ${rejections.length} marketplaces: ${rejections.join(', ')}. ` +
               `This may indicate policy violations or other concerns.`;
      }
    });
    
    // Social validation factor patterns
    patterns.set('negative-sentiment', {
      id: 'negative-sentiment',
      relevantFactors: ['socialValidation'],
      isCrossFactor: false,
      detector: (factorKey, factorScore) => {
        return factorKey === 'socialValidation' && 
               factorScore.score < 40 && 
               factorScore.details?.sentimentScore < -0.3;
      },
      generateDescription: () => 'Predominantly negative social sentiment',
      determineSeverity: (_, factorScore) => {
        const sentiment = factorScore.details?.sentimentScore || 0;
        return sentiment < -0.6 ? 'high' : 'medium';
      },
      generateEvidence: (_, factorScore) => {
        const sentiment = factorScore.details?.sentimentScore || 0;
        const mentions = factorScore.details?.mentionCount || 0;
        
        return `Overall sentiment score of ${sentiment.toFixed(2)} across ${mentions} mentions. ` +
               `Community perception is largely negative.`;
      }
    });
    
    // Cross-factor patterns
    patterns.set('multiple-warning-signs', {
      id: 'multiple-warning-signs',
      relevantFactors: [],
      isCrossFactor: true,
      detector: (_, __, trustScore) => {
        // Count factors with low scores
        let lowScoreCount = 0;
        for (const factorScore of trustScore.factorScores.values()) {
          if (factorScore.score < 30) lowScoreCount++;
        }
        
        return lowScoreCount >= 3;
      },
      generateDescription: () => 'Multiple serious warning signs across factors',
      determineSeverity: (_, __, trustScore) => {
        // Count very low scores
        let veryLowScoreCount = 0;
        for (const factorScore of trustScore.factorScores.values()) {
          if (factorScore.score < 20) veryLowScoreCount++;
        }
        
        return veryLowScoreCount >= 2 ? 'high' : 'medium';
      },
      generateEvidence: (_, __, trustScore) => {
        // Identify the low-scoring factors
        const lowFactors = [];
        for (const [factorKey, factorScore] of trustScore.factorScores.entries()) {
          if (factorScore.score < 30) {
            lowFactors.push(this.getFactorName(factorKey));
          }
        }
        
        return `Multiple concerning factors detected: ${lowFactors.join(', ')}. ` +
               `The combination of these issues significantly increases risk.`;
      }
    });
    
    return patterns;
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
}

/**
 * Interface for red flag detection patterns
 */
interface RedFlagPattern {
  /** Unique identifier for the pattern */
  id: string;
  
  /** Factors this pattern is relevant to */
  relevantFactors: string[];
  
  /** Whether this pattern works across multiple factors */
  isCrossFactor: boolean;
  
  /** Function to detect if the pattern applies */
  detector: (factorKey: string, factorScore: TrustScoreTypes.FactorScore, trustScore: TrustScoreTypes.NFTTrustScore) => boolean;
  
  /** Function to generate a description of the red flag */
  generateDescription: (factorKey: string, factorScore: TrustScoreTypes.FactorScore, trustScore: TrustScoreTypes.NFTTrustScore) => string;
  
  /** Function to determine the severity of the red flag */
  determineSeverity: (factorKey: string, factorScore: TrustScoreTypes.FactorScore, trustScore: TrustScoreTypes.NFTTrustScore) => 'high' | 'medium' | 'low';
  
  /** Function to generate evidence for the red flag */
  generateEvidence: (factorKey: string, factorScore: TrustScoreTypes.FactorScore, trustScore: TrustScoreTypes.NFTTrustScore) => string;
}
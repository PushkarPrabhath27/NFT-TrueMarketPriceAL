/**
 * MarketplaceVerificationFactor.ts
 * 
 * Implementation of the Marketplace Verification Factor calculator.
 * This factor evaluates the verification status of an NFT across various marketplaces,
 * weighted by marketplace reputation and listing consistency.
 * It accounts for 10% of the overall trust score.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';

/**
 * Calculates the Marketplace Verification Factor score for NFTs based on marketplace verification status.
 */
export class MarketplaceVerificationFactor implements FactorCalculator {
  /**
   * The weight of this factor in the overall trust score (10%)
   */
  public readonly weight: number;

  /**
   * Reputation scores for known marketplaces (0-1 scale)
   */
  private readonly marketplaceReputations: Record<string, number> = {
    'opensea': 0.95,
    'rarible': 0.90,
    'foundation': 0.92,
    'superrare': 0.93,
    'niftygateway': 0.91,
    'magiceden': 0.88,
    'looksrare': 0.85,
    'x2y2': 0.82,
    'blur': 0.84,
    'element': 0.80
    // Additional marketplaces can be added here
  };

  /**
   * Initialize the Marketplace Verification Factor calculator with its weight
   * 
   * @param weight The weight of this factor in the overall trust score
   */
  constructor(weight: number = 0.10) {
    this.weight = weight;
  }

  /**
   * Calculate the marketplace verification score based on verification status
   * 
   * @param inputData The NFT data including marketplace verifications
   * @returns A factor score with confidence metrics and explanations
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values for when no marketplace verification data is available
    let score = 50; // Neutral score
    let confidence = 0.3; // Low confidence without data
    let explanation = "Limited marketplace verification data available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process marketplace verifications if available
    if (inputData.marketplaceVerifications && inputData.marketplaceVerifications.length > 0) {
      const verifications = inputData.marketplaceVerifications;
      
      // Calculate verification score weighted by marketplace reputation
      const { weightedScore, verifiedCount, totalMarketplaces } = this.calculateWeightedVerificationScore(verifications);
      details.weightedVerificationScore = weightedScore;
      details.verifiedMarketplaces = verifiedCount;
      details.totalMarketplaces = totalMarketplaces;
      
      // Calculate listing consistency score
      const listingConsistencyScore = this.calculateListingConsistencyScore(verifications);
      details.listingConsistencyScore = listingConsistencyScore;
      
      // Calculate overall marketplace verification score (higher is better)
      score = Math.round((
        weightedScore * 0.7 + 
        listingConsistencyScore * 0.3
      ) * 100);
      
      // Calculate confidence based on marketplace data completeness
      confidence = this.calculateConfidence(inputData, {
        marketplaceCount: verifications.length
      });
      
      // Generate explanation
      if (score >= 90) {
        explanation = `NFT is verified on multiple reputable marketplaces with consistent listings.`;
      } else if (score >= 70) {
        explanation = `NFT is verified on some reputable marketplaces with generally consistent listings.`;
      } else if (score >= 50) {
        explanation = `NFT has mixed verification status across marketplaces.`;
      } else if (score >= 30) {
        explanation = `NFT has limited verification across marketplaces or inconsistent listings.`;
      } else {
        explanation = `NFT is not verified on any reputable marketplaces or has significant listing inconsistencies.`;
      }
      
      // Add specific details to explanation
      if (verifiedCount > 0) {
        explanation += ` Verified on ${verifiedCount} out of ${totalMarketplaces} marketplaces.`;
      } else {
        explanation += ` Not verified on any marketplaces.`;
      }
    }
    
    // Identify red flags and strengths
    const redFlags = this.identifyRedFlags(inputData, score);
    const strengths = this.identifyStrengths(inputData, score);
    
    return {
      score,
      confidence,
      explanation,
      details,
      redFlags,
      strengths
    };
  }

  /**
   * Calculate a weighted verification score based on marketplace reputation
   * 
   * @param verifications Array of marketplace verifications
   * @returns Object containing weighted score, verified count, and total marketplaces
   */
  private calculateWeightedVerificationScore(verifications: TrustScoreTypes.MarketplaceVerification[]): {
    weightedScore: number;
    verifiedCount: number;
    totalMarketplaces: number;
  } {
    if (verifications.length === 0) {
      return { weightedScore: 0.5, verifiedCount: 0, totalMarketplaces: 0 };
    }
    
    let totalWeight = 0;
    let weightedSum = 0;
    let verifiedCount = 0;
    
    for (const verification of verifications) {
      // Get marketplace reputation or use default if unknown
      const marketplaceName = verification.marketplace.toLowerCase();
      const reputation = this.marketplaceReputations[marketplaceName] || 0.5;
      
      // Add to weighted sum if verified
      if (verification.verified) {
        weightedSum += reputation;
        verifiedCount++;
      }
      
      totalWeight += reputation;
    }
    
    // Calculate weighted score (0-1)
    const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    
    return {
      weightedScore,
      verifiedCount,
      totalMarketplaces: verifications.length
    };
  }

  /**
   * Calculate a score based on listing consistency across marketplaces
   * 
   * @param verifications Array of marketplace verifications
   * @returns A score between 0-1 representing listing consistency
   */
  private calculateListingConsistencyScore(verifications: TrustScoreTypes.MarketplaceVerification[]): number {
    if (verifications.length < 2) {
      return 0.5; // Not enough data for meaningful analysis
    }
    
    // Count active, inactive, and removed listings
    const statusCounts = {
      active: 0,
      inactive: 0,
      removed: 0
    };
    
    for (const verification of verifications) {
      statusCounts[verification.listingStatus]++;
    }
    
    // Calculate consistency score based on dominant status
    const totalListings = verifications.length;
    const dominantStatusCount = Math.max(
      statusCounts.active,
      statusCounts.inactive,
      statusCounts.removed
    );
    
    // Higher score for more consistent status
    return dominantStatusCount / totalListings;
  }

  /**
   * Calculate the confidence in the marketplace verification score
   * 
   * @param inputData The NFT input data
   * @param metrics Metrics about marketplace data
   * @returns A confidence value between 0-1
   */
  public calculateConfidence(inputData: TrustScoreTypes.NFTInputData, metrics: any): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Adjust based on number of marketplaces (more marketplaces = higher confidence)
    if (metrics.marketplaceCount > 5) {
      confidence += 0.3;
    } else if (metrics.marketplaceCount > 3) {
      confidence += 0.2;
    } else if (metrics.marketplaceCount > 1) {
      confidence += 0.1;
    }
    
    // Adjust based on presence of top marketplaces
    if (inputData.marketplaceVerifications) {
      const hasTopMarketplace = inputData.marketplaceVerifications.some(v => 
        ['opensea', 'rarible', 'superrare', 'foundation', 'niftygateway'].includes(v.marketplace.toLowerCase())
      );
      
      if (hasTopMarketplace) {
        confidence += 0.15;
      }
    }
    
    // Cap confidence at 0.95 (never 100% confident)
    return Math.min(0.95, confidence);
  }

  /**
   * Identify red flags related to marketplace verification
   * 
   * @param inputData The NFT input data
   * @param score The calculated verification score
   * @returns Array of red flags
   */
  public identifyRedFlags(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    if (!inputData.marketplaceVerifications || inputData.marketplaceVerifications.length === 0) {
      redFlags.push({
        severity: 'medium',
        description: 'No marketplace data',
        evidence: 'Unable to verify NFT status across marketplaces due to missing data.'
      });
      return redFlags;
    }
    
    const verifications = inputData.marketplaceVerifications;
    
    // Check for no verifications
    if (!verifications.some(v => v.verified)) {
      redFlags.push({
        severity: 'high',
        description: 'Not verified on any marketplace',
        evidence: `NFT is listed on ${verifications.length} marketplaces but not verified on any of them.`
      });
    }
    
    // Check for removed listings
    const removedListings = verifications.filter(v => v.listingStatus === 'removed');
    if (removedListings.length > 0) {
      redFlags.push({
        severity: 'medium',
        description: 'Removed from marketplaces',
        evidence: `NFT has been removed from ${removedListings.length} marketplace(s): ${removedListings.map(v => v.marketplace).join(', ')}.`
      });
    }
    
    // Check for inconsistent verification status
    const verifiedMarketplaces = verifications.filter(v => v.verified);
    const unverifiedMarketplaces = verifications.filter(v => !v.verified);
    if (verifiedMarketplaces.length > 0 && unverifiedMarketplaces.length > 0) {
      // Only flag if verified on minor marketplaces but not on major ones
      const verifiedOnMajor = verifiedMarketplaces.some(v => 
        ['opensea', 'rarible', 'superrare', 'foundation', 'niftygateway'].includes(v.marketplace.toLowerCase())
      );
      
      const unverifiedOnMajor = unverifiedMarketplaces.some(v => 
        ['opensea', 'rarible', 'superrare', 'foundation', 'niftygateway'].includes(v.marketplace.toLowerCase())
      );
      
      if (!verifiedOnMajor && unverifiedOnMajor) {
        redFlags.push({
          severity: 'medium',
          description: 'Inconsistent verification status',
          evidence: 'NFT is verified on minor marketplaces but not on major platforms.'
        });
      }
    }
    
    return redFlags;
  }

  /**
   * Identify strengths related to marketplace verification
   * 
   * @param inputData The NFT input data
   * @param score The calculated verification score
   * @returns Array of strengths
   */
  public identifyStrengths(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.Strength[] {
    const strengths: TrustScoreTypes.Strength[] = [];
    
    if (!inputData.marketplaceVerifications || inputData.marketplaceVerifications.length === 0) {
      return strengths;
    }
    
    const verifications = inputData.marketplaceVerifications;
    
    // Check for verification on multiple marketplaces
    const verifiedMarketplaces = verifications.filter(v => v.verified);
    if (verifiedMarketplaces.length > 2) {
      strengths.push({
        significance: 'high',
        description: 'Verified across multiple marketplaces',
        evidence: `NFT is verified on ${verifiedMarketplaces.length} marketplaces: ${verifiedMarketplaces.map(v => v.marketplace).join(', ')}.`
      });
    } else if (verifiedMarketplaces.length > 0) {
      strengths.push({
        significance: 'medium',
        description: 'Marketplace verified',
        evidence: `NFT is verified on ${verifiedMarketplaces.map(v => v.marketplace).join(', ')}.`
      });
    }
    
    // Check for verification on top marketplaces
    const verifiedOnTopMarketplaces = verifiedMarketplaces.filter(v => 
      ['opensea', 'rarible', 'superrare', 'foundation', 'niftygateway'].includes(v.marketplace.toLowerCase())
    );
    
    if (verifiedOnTopMarketplaces.length > 0) {
      strengths.push({
        significance: 'high',
        description: 'Verified on top marketplaces',
        evidence: `NFT is verified on leading marketplaces: ${verifiedOnTopMarketplaces.map(v => v.marketplace).join(', ')}.`
      });
    }
    
    // Check for consistent active listings
    const activeListings = verifications.filter(v => v.listingStatus === 'active');
    if (activeListings.length === verifications.length && verifications.length > 1) {
      strengths.push({
        significance: 'medium',
        description: 'Consistent active listings',
        evidence: `NFT is actively listed on all ${verifications.length} marketplaces.`
      });
    }
    
    return strengths;
  }

  /**
   * Get a detailed explanation of how this factor is calculated
   * 
   * @returns A human-readable explanation of the factor calculation
   */
  public getExplanation(): string {
    return `The Marketplace Verification Factor evaluates the NFT's verification status across various marketplaces. It considers:

1. Verification Status (70%): Whether the NFT is verified on marketplaces, weighted by each marketplace's reputation.
2. Listing Consistency (30%): The consistency of the NFT's listing status across marketplaces.

The confidence in this score increases with data from more marketplaces, especially major platforms.`;
  }
}
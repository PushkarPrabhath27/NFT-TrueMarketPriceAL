/**
 * CreatorReputationFactor.ts
 * 
 * Implementation of the Creator Reputation Factor calculator.
 * This factor evaluates the reputation of an NFT's creator based on historical NFT quality,
 * project delivery history, and verification status across platforms.
 * It accounts for 15% of the overall trust score.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';

/**
 * Calculates the Creator Reputation Factor score for NFTs based on creator history.
 */
export class CreatorReputationFactor implements FactorCalculator {
  /**
   * The weight of this factor in the overall trust score (15%)
   */
  public readonly weight: number;

  /**
   * Initialize the Creator Reputation Factor calculator with its weight
   * 
   * @param weight The weight of this factor in the overall trust score
   */
  constructor(weight: number = 0.15) {
    this.weight = weight;
  }

  /**
   * Calculate the creator reputation score based on creator history
   * 
   * @param inputData The NFT data including creator history
   * @returns A factor score with confidence metrics and explanations
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values for when no creator history data is available
    let score = 50; // Neutral score
    let confidence = 0.3; // Low confidence without data
    let explanation = "Limited creator history available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process creator history if available
    if (inputData.creatorHistory) {
      const creatorHistory = inputData.creatorHistory;
      
      // Calculate various metrics for creator reputation
      const nftQualityScore = creatorHistory.averageNFTQualityScore || 0.5;
      const projectDeliveryScore = creatorHistory.projectDeliveryRate || 0.5;
      const verificationScore = this.calculateVerificationScore(creatorHistory.verificationStatuses);
      
      details.nftQualityScore = nftQualityScore;
      details.projectDeliveryScore = projectDeliveryScore;
      details.verificationScore = verificationScore;
      details.totalNFTsCreated = creatorHistory.totalNFTsCreated;
      details.creatorSince = creatorHistory.firstCreationDate;
      
      // Calculate overall reputation score (higher is better)
      score = Math.round((
        nftQualityScore * 0.4 + 
        projectDeliveryScore * 0.4 + 
        verificationScore * 0.2
      ) * 100);
      
      // Calculate confidence based on history length and data completeness
      confidence = this.calculateConfidence(inputData, {
        historyLength: this.getHistoryLengthInDays(creatorHistory.firstCreationDate),
        totalNFTs: creatorHistory.totalNFTsCreated
      });
      
      // Generate explanation
      if (score >= 90) {
        explanation = `Creator has an excellent reputation with high-quality NFTs and consistent project delivery.`;
      } else if (score >= 70) {
        explanation = `Creator has a good reputation with quality NFTs and reliable project delivery.`;
      } else if (score >= 50) {
        explanation = `Creator has a moderate reputation with average NFT quality and project delivery.`;
      } else if (score >= 30) {
        explanation = `Creator has a questionable reputation with below-average NFT quality or project delivery issues.`;
      } else {
        explanation = `Creator has a poor reputation with low-quality NFTs or significant project delivery failures.`;
      }
      
      // Add verification status to explanation
      if (verificationScore > 0.8) {
        explanation += ` Creator is verified across multiple platforms.`;
      } else if (verificationScore > 0.5) {
        explanation += ` Creator is verified on some platforms.`;
      } else if (verificationScore > 0) {
        explanation += ` Creator has limited verification across platforms.`;
      } else {
        explanation += ` Creator is not verified on any platforms.`;
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
   * Calculate a score based on verification status across platforms
   * 
   * @param verifications Array of verification statuses
   * @returns A score between 0-1 representing verification strength
   */
  private calculateVerificationScore(verifications: TrustScoreTypes.CreatorVerification[]): number {
    if (!verifications || verifications.length === 0) {
      return 0;
    }
    
    const verifiedCount = verifications.filter(v => v.verified).length;
    return verifiedCount / verifications.length;
  }

  /**
   * Calculate the length of creator history in days
   * 
   * @param firstCreationDate The date of first NFT creation
   * @returns Number of days since first creation
   */
  private getHistoryLengthInDays(firstCreationDate: string): number {
    const firstDate = new Date(firstCreationDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate the confidence in the creator reputation score
   * 
   * @param inputData The NFT input data
   * @param metrics Metrics about creator history
   * @returns A confidence value between 0-1
   */
  public calculateConfidence(inputData: TrustScoreTypes.NFTInputData, metrics: any): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Adjust based on history length (longer history = higher confidence)
    if (metrics.historyLength > 365) { // More than a year
      confidence += 0.2;
    } else if (metrics.historyLength > 180) { // More than 6 months
      confidence += 0.15;
    } else if (metrics.historyLength > 90) { // More than 3 months
      confidence += 0.1;
    } else if (metrics.historyLength > 30) { // More than a month
      confidence += 0.05;
    }
    
    // Adjust based on number of NFTs created (more NFTs = higher confidence)
    if (metrics.totalNFTs > 100) {
      confidence += 0.2;
    } else if (metrics.totalNFTs > 50) {
      confidence += 0.15;
    } else if (metrics.totalNFTs > 20) {
      confidence += 0.1;
    } else if (metrics.totalNFTs > 5) {
      confidence += 0.05;
    }
    
    // Cap confidence at 0.95 (never 100% confident)
    return Math.min(0.95, confidence);
  }

  /**
   * Identify red flags related to creator reputation
   * 
   * @param inputData The NFT input data
   * @param score The calculated reputation score
   * @returns Array of red flags
   */
  public identifyRedFlags(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    if (!inputData.creatorHistory) {
      redFlags.push({
        severity: 'medium',
        description: 'No creator history available',
        evidence: 'Unable to verify creator reputation due to missing history data.'
      });
      return redFlags;
    }
    
    const history = inputData.creatorHistory;
    
    // Check for low project delivery rate
    if (history.projectDeliveryRate !== undefined && history.projectDeliveryRate < 0.5) {
      redFlags.push({
        severity: 'high',
        description: 'Poor project delivery history',
        evidence: `Creator has only delivered ${Math.round(history.projectDeliveryRate * 100)}% of promised projects on time.`
      });
    }
    
    // Check for low NFT quality score
    if (history.averageNFTQualityScore !== undefined && history.averageNFTQualityScore < 0.5) {
      redFlags.push({
        severity: 'medium',
        description: 'Below average NFT quality',
        evidence: `Creator's previous NFTs have an average quality score of ${Math.round(history.averageNFTQualityScore * 100)}/100.`
      });
    }
    
    // Check for lack of verification
    if (history.verificationStatuses.length > 0 && !history.verificationStatuses.some(v => v.verified)) {
      redFlags.push({
        severity: 'medium',
        description: 'Unverified creator',
        evidence: 'Creator is not verified on any connected platforms.'
      });
    }
    
    // Check for very new creator
    const historyLength = this.getHistoryLengthInDays(history.firstCreationDate);
    if (historyLength < 30) {
      redFlags.push({
        severity: 'low',
        description: 'New creator',
        evidence: `Creator has only been active for ${historyLength} days.`
      });
    }
    
    return redFlags;
  }

  /**
   * Identify strengths related to creator reputation
   * 
   * @param inputData The NFT input data
   * @param score The calculated reputation score
   * @returns Array of strengths
   */
  public identifyStrengths(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.Strength[] {
    const strengths: TrustScoreTypes.Strength[] = [];
    
    if (!inputData.creatorHistory) {
      return strengths;
    }
    
    const history = inputData.creatorHistory;
    
    // Check for high project delivery rate
    if (history.projectDeliveryRate !== undefined && history.projectDeliveryRate > 0.8) {
      strengths.push({
        significance: 'high',
        description: 'Excellent project delivery history',
        evidence: `Creator has delivered ${Math.round(history.projectDeliveryRate * 100)}% of promised projects on time.`
      });
    }
    
    // Check for high NFT quality score
    if (history.averageNFTQualityScore !== undefined && history.averageNFTQualityScore > 0.8) {
      strengths.push({
        significance: 'high',
        description: 'High quality NFTs',
        evidence: `Creator's previous NFTs have an average quality score of ${Math.round(history.averageNFTQualityScore * 100)}/100.`
      });
    }
    
    // Check for strong verification
    const verifiedPlatforms = history.verificationStatuses.filter(v => v.verified).map(v => v.platform);
    if (verifiedPlatforms.length > 2) {
      strengths.push({
        significance: 'medium',
        description: 'Well-verified creator',
        evidence: `Creator is verified on multiple platforms: ${verifiedPlatforms.join(', ')}.`
      });
    }
    
    // Check for established creator
    const historyLength = this.getHistoryLengthInDays(history.firstCreationDate);
    if (historyLength > 365) {
      strengths.push({
        significance: 'medium',
        description: 'Established creator',
        evidence: `Creator has been active for over ${Math.floor(historyLength / 365)} year(s).`
      });
    }
    
    // Check for prolific creator
    if (history.totalNFTsCreated > 50) {
      strengths.push({
        significance: 'low',
        description: 'Prolific creator',
        evidence: `Creator has produced over ${history.totalNFTsCreated} NFTs.`
      });
    }
    
    return strengths;
  }

  /**
   * Calculate the factor score for a creator
   * 
   * @param inputData The creator data needed for calculation
   * @returns A factor score for the creator
   */
  public async calculateForCreator(inputData: TrustScoreTypes.CreatorInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values
    let score = 50;
    let confidence = 0.3;
    let explanation = "Limited creator data available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    if (inputData.nfts.length > 0) {
      // Calculate average NFT quality from all NFTs
      const nftQualityScores = inputData.nfts.map(nft => {
        if (nft.creatorHistory?.averageNFTQualityScore) {
          return nft.creatorHistory.averageNFTQualityScore;
        }
        return 0.5; // Neutral score if not available
      });
      
      const avgNftQuality = nftQualityScores.reduce((sum, score) => sum + score, 0) / nftQualityScores.length;
      details.averageNFTQuality = avgNftQuality;
      
      // Calculate project delivery metrics if available
      let projectDeliveryScore = 0.5;
      if (inputData.projectDeliveryHistory && inputData.projectDeliveryHistory.length > 0) {
        const deliveredProjects = inputData.projectDeliveryHistory.filter(p => 
          p.actualDeliveryDate && p.promisedDeliveryDate && 
          new Date(p.actualDeliveryDate) <= new Date(p.promisedDeliveryDate)
        );
        
        projectDeliveryScore = deliveredProjects.length / inputData.projectDeliveryHistory.length;
        details.projectDeliveryScore = projectDeliveryScore;
        details.projectsDelivered = `${deliveredProjects.length}/${inputData.projectDeliveryHistory.length}`;
      }
      
      // Calculate verification score
      const verificationScore = inputData.creatorVerifications ? 
        this.calculateVerificationScore(inputData.creatorVerifications) : 0;
      details.verificationScore = verificationScore;
      
      // Calculate overall score
      score = Math.round((
        avgNftQuality * 0.4 + 
        projectDeliveryScore * 0.4 + 
        verificationScore * 0.2
      ) * 100);
      
      // Calculate confidence based on data completeness
      confidence = Math.min(0.95, 0.3 + 
        (inputData.nfts.length > 10 ? 0.3 : inputData.nfts.length * 0.03) + 
        (inputData.projectDeliveryHistory ? 0.2 : 0) + 
        (inputData.creatorVerifications ? 0.2 : 0)
      );
      
      // Generate explanation
      if (score >= 90) {
        explanation = `Creator has an excellent reputation with high-quality NFTs and consistent project delivery.`;
      } else if (score >= 70) {
        explanation = `Creator has a good reputation with quality NFTs and reliable project delivery.`;
      } else if (score >= 50) {
        explanation = `Creator has a moderate reputation with average NFT quality and project delivery.`;
      } else if (score >= 30) {
        explanation = `Creator has a questionable reputation with below-average NFT quality or project delivery issues.`;
      } else {
        explanation = `Creator has a poor reputation with low-quality NFTs or significant project delivery failures.`;
      }
    }
    
    // Identify red flags and strengths
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    const strengths: TrustScoreTypes.Strength[] = [];
    
    // Add red flags based on score components
    if (details.projectDeliveryScore !== undefined && details.projectDeliveryScore < 0.5) {
      redFlags.push({
        severity: 'high',
        description: 'Poor project delivery history',
        evidence: `Creator has only delivered ${Math.round(details.projectDeliveryScore * 100)}% of promised projects on time.`
      });
    }
    
    // Add strengths based on score components
    if (details.averageNFTQuality !== undefined && details.averageNFTQuality > 0.8) {
      strengths.push({
        significance: 'high',
        description: 'High quality NFTs',
        evidence: `Creator's NFTs have an average quality score of ${Math.round(details.averageNFTQuality * 100)}/100.`
      });
    }
    
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
   * Get a detailed explanation of how this factor is calculated
   * 
   * @returns A human-readable explanation of the factor calculation
   */
  public getExplanation(): string {
    return `The Creator Reputation Factor evaluates the creator's historical NFT quality, project delivery consistency, and verification status across platforms. It considers:

1. Historical NFT Quality (40%): The average quality of the creator's previous NFTs.
2. Project Delivery History (40%): The creator's track record of delivering promised projects on time.
3. Verification Status (20%): Whether the creator is verified across various platforms.

The confidence in this score increases with longer creator history and more NFTs created.`;
  }
}
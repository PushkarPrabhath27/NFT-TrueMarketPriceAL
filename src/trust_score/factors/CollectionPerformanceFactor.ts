/**
 * CollectionPerformanceFactor.ts
 * 
 * Implementation of the Collection Performance Factor calculator.
 * This factor evaluates the performance of an NFT's collection based on floor price stability,
 * trading volume consistency, and holder distribution metrics.
 * It accounts for 15% of the overall trust score.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';

/**
 * Calculates the Collection Performance Factor score for NFTs based on collection metrics.
 */
export class CollectionPerformanceFactor implements FactorCalculator {
  /**
   * The weight of this factor in the overall trust score (15%)
   */
  public readonly weight: number;

  /**
   * Initialize the Collection Performance Factor calculator with its weight
   * 
   * @param weight The weight of this factor in the overall trust score
   */
  constructor(weight: number = 0.15) {
    this.weight = weight;
  }

  /**
   * Calculate the collection performance score based on collection metrics
   * 
   * @param inputData The NFT data including collection data
   * @returns A factor score with confidence metrics and explanations
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values for when no collection data is available
    let score = 50; // Neutral score
    let confidence = 0.3; // Low confidence without data
    let explanation = "Limited collection data available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process collection data if available
    if (inputData.collectionData) {
      const collectionData = inputData.collectionData;
      details.collectionName = collectionData.name;
      details.collectionSize = collectionData.size;
      details.creationDate = collectionData.creationDate;
      
      // Calculate floor price stability if data available
      let floorPriceStabilityScore = 0.5; // Default neutral score
      if (inputData.collectionData.floorPrice) {
        details.currentFloorPrice = collectionData.floorPrice;
      }
      
      // Process floor price history if available
      if (inputData.collectionInputData?.floorPriceHistory && 
          inputData.collectionInputData.floorPriceHistory.length > 0) {
        const floorPriceHistory = inputData.collectionInputData.floorPriceHistory;
        floorPriceStabilityScore = this.calculateFloorPriceStability(floorPriceHistory);
        details.floorPriceStabilityScore = floorPriceStabilityScore;
        details.floorPriceHistoryLength = floorPriceHistory.length;
      }
      
      // Calculate trading volume consistency if data available
      let tradingVolumeScore = 0.5; // Default neutral score
      if (inputData.collectionInputData?.tradingVolumeHistory && 
          inputData.collectionInputData.tradingVolumeHistory.length > 0) {
        const volumeHistory = inputData.collectionInputData.tradingVolumeHistory;
        tradingVolumeScore = this.calculateTradingVolumeConsistency(volumeHistory);
        details.tradingVolumeScore = tradingVolumeScore;
        details.volumeHistoryLength = volumeHistory.length;
      }
      
      // Calculate holder distribution metrics if data available
      let holderDistributionScore = 0.5; // Default neutral score
      if (inputData.collectionInputData?.holderDistribution) {
        const holderDistribution = inputData.collectionInputData.holderDistribution;
        holderDistributionScore = this.calculateHolderDistributionScore(holderDistribution);
        details.holderDistributionScore = holderDistributionScore;
        details.uniqueHolders = holderDistribution.uniqueHolders;
        details.topHolderPercentage = holderDistribution.topHolderPercentage;
      }
      
      // Calculate overall collection performance score (higher is better)
      score = Math.round((
        floorPriceStabilityScore * 0.4 + 
        tradingVolumeScore * 0.3 + 
        holderDistributionScore * 0.3
      ) * 100);
      
      // Calculate confidence based on collection size and age
      confidence = this.calculateConfidence(inputData, {
        collectionSize: collectionData.size,
        collectionAge: this.getCollectionAgeInDays(collectionData.creationDate)
      });
      
      // Generate explanation
      if (score >= 90) {
        explanation = `Collection shows excellent performance with stable floor price, consistent trading volume, and healthy holder distribution.`;
      } else if (score >= 70) {
        explanation = `Collection shows good performance with relatively stable metrics and healthy trading activity.`;
      } else if (score >= 50) {
        explanation = `Collection shows moderate performance with average stability and trading activity.`;
      } else if (score >= 30) {
        explanation = `Collection shows concerning performance with unstable floor price or inconsistent trading activity.`;
      } else {
        explanation = `Collection shows poor performance with highly volatile metrics or problematic holder distribution.`;
      }
      
      // Add specific details to explanation based on component scores
      if (floorPriceStabilityScore < 0.3) {
        explanation += ` Floor price shows high volatility.`;
      } else if (floorPriceStabilityScore > 0.7) {
        explanation += ` Floor price shows good stability.`;
      }
      
      if (holderDistributionScore < 0.3) {
        explanation += ` Holder distribution is concerning with high concentration among few wallets.`;
      } else if (holderDistributionScore > 0.7) {
        explanation += ` Holder distribution is healthy with good diversification.`;
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
   * Calculate floor price stability score based on price history
   * 
   * @param priceHistory Array of price points over time
   * @returns A score between 0-1 representing floor price stability
   */
  private calculateFloorPriceStability(priceHistory: TrustScoreTypes.PricePoint[]): number {
    if (priceHistory.length < 2) {
      return 0.5; // Not enough data for meaningful analysis
    }
    
    // Convert price strings to numbers
    const prices = priceHistory.map(point => parseFloat(point.price));
    
    // Calculate volatility (standard deviation / mean)
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = mean > 0 ? stdDev / mean : 1; // Coefficient of variation
    
    // Calculate trend direction and strength
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const priceChange = (lastPrice - firstPrice) / firstPrice;
    
    // Calculate stability score (inverse of volatility, adjusted for positive trend)
    let stabilityScore = Math.max(0, 1 - volatility);
    
    // Bonus for positive trend, penalty for negative trend
    if (priceChange > 0) {
      stabilityScore = Math.min(1, stabilityScore + (priceChange * 0.2)); // Bonus for positive trend
    } else if (priceChange < -0.5) { // Significant drop
      stabilityScore = Math.max(0, stabilityScore + (priceChange * 0.2)); // Penalty for negative trend
    }
    
    return stabilityScore;
  }

  /**
   * Calculate trading volume consistency score based on volume history
   * 
   * @param volumeHistory Array of trading volume points over time
   * @returns A score between 0-1 representing trading volume consistency
   */
  private calculateTradingVolumeConsistency(volumeHistory: TrustScoreTypes.VolumePoint[]): number {
    if (volumeHistory.length < 2) {
      return 0.5; // Not enough data for meaningful analysis
    }
    
    // Convert volume strings to numbers
    const volumes = volumeHistory.map(point => parseFloat(point.volume));
    const transactions = volumeHistory.map(point => point.numberOfTransactions);
    
    // Calculate volume consistency (inverse of coefficient of variation)
    const meanVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const varianceVolume = volumes.reduce((sum, vol) => sum + Math.pow(vol - meanVolume, 2), 0) / volumes.length;
    const stdDevVolume = Math.sqrt(varianceVolume);
    const volumeVariability = meanVolume > 0 ? stdDevVolume / meanVolume : 1;
    
    // Calculate transaction consistency
    const meanTx = transactions.reduce((sum, tx) => sum + tx, 0) / transactions.length;
    const varianceTx = transactions.reduce((sum, tx) => sum + Math.pow(tx - meanTx, 2), 0) / transactions.length;
    const stdDevTx = Math.sqrt(varianceTx);
    const txVariability = meanTx > 0 ? stdDevTx / meanTx : 1;
    
    // Calculate overall consistency score (inverse of variability)
    const volumeConsistencyScore = Math.max(0, 1 - volumeVariability);
    const txConsistencyScore = Math.max(0, 1 - txVariability);
    
    // Combine scores with more weight on transaction consistency
    return (volumeConsistencyScore * 0.4) + (txConsistencyScore * 0.6);
  }

  /**
   * Calculate holder distribution score based on distribution metrics
   * 
   * @param distribution Holder distribution data
   * @returns A score between 0-1 representing holder distribution health
   */
  private calculateHolderDistributionScore(distribution: TrustScoreTypes.HolderDistribution): number {
    // Calculate score based on top holder percentage (lower is better)
    const topHolderScore = Math.max(0, 1 - (distribution.topHolderPercentage / 100));
    
    // Calculate score based on whale concentration (lower is better)
    const whaleScore = distribution.whaleConcentration !== undefined ? 
      Math.max(0, 1 - (distribution.whaleConcentration / 100)) : 0.5;
    
    // Calculate score based on holder retention (higher is better)
    const retentionScore = distribution.holderRetentionRate !== undefined ? 
      distribution.holderRetentionRate / 100 : 0.5;
    
    // Calculate score based on unique holders relative to collection size
    // This requires collection size which we don't have here, so using a default score
    const uniqueHolderScore = 0.5;
    
    // Combine scores with weights
    return (
      topHolderScore * 0.3 +
      whaleScore * 0.3 +
      retentionScore * 0.3 +
      uniqueHolderScore * 0.1
    );
  }

  /**
   * Calculate the age of a collection in days
   * 
   * @param creationDate The creation date of the collection
   * @returns Number of days since collection creation
   */
  private getCollectionAgeInDays(creationDate: string): number {
    const creationTime = new Date(creationDate).getTime();
    const now = new Date().getTime();
    return Math.floor((now - creationTime) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate the confidence in the collection performance score
   * 
   * @param inputData The NFT input data
   * @param metrics Metrics about collection size and age
   * @returns A confidence value between 0-1
   */
  public calculateConfidence(inputData: TrustScoreTypes.NFTInputData, metrics: any): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Adjust based on collection age (older collection = higher confidence)
    if (metrics.collectionAge > 365) { // More than a year
      confidence += 0.2;
    } else if (metrics.collectionAge > 180) { // More than 6 months
      confidence += 0.15;
    } else if (metrics.collectionAge > 90) { // More than 3 months
      confidence += 0.1;
    } else if (metrics.collectionAge > 30) { // More than a month
      confidence += 0.05;
    }
    
    // Adjust based on collection size (larger collection = higher confidence)
    if (metrics.collectionSize > 10000) {
      confidence += 0.2;
    } else if (metrics.collectionSize > 5000) {
      confidence += 0.15;
    } else if (metrics.collectionSize > 1000) {
      confidence += 0.1;
    } else if (metrics.collectionSize > 100) {
      confidence += 0.05;
    }
    
    // Cap confidence at 0.95 (never 100% confident)
    return Math.min(0.95, confidence);
  }

  /**
   * Identify red flags related to collection performance
   * 
   * @param inputData The NFT input data
   * @param score The calculated performance score
   * @returns Array of red flags
   */
  public identifyRedFlags(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    if (!inputData.collectionData) {
      redFlags.push({
        severity: 'medium',
        description: 'No collection data available',
        evidence: 'Unable to verify collection performance due to missing data.'
      });
      return redFlags;
    }
    
    // Check for very new collection
    const collectionAge = this.getCollectionAgeInDays(inputData.collectionData.creationDate);
    if (collectionAge < 30) {
      redFlags.push({
        severity: 'medium',
        description: 'Very new collection',
        evidence: `Collection is only ${collectionAge} days old, which provides limited performance history.`
      });
    }
    
    // Check for small collection size
    if (inputData.collectionData.size < 10) {
      redFlags.push({
        severity: 'low',
        description: 'Very small collection',
        evidence: `Collection only contains ${inputData.collectionData.size} NFTs, which may indicate limited market interest.`
      });
    }
    
    // Check for floor price volatility
    if (inputData.collectionInputData?.floorPriceHistory && 
        inputData.collectionInputData.floorPriceHistory.length > 1) {
      const floorPriceStability = this.calculateFloorPriceStability(
        inputData.collectionInputData.floorPriceHistory
      );
      
      if (floorPriceStability < 0.3) {
        redFlags.push({
          severity: 'high',
          description: 'Highly volatile floor price',
          evidence: 'Collection floor price shows extreme volatility, which may indicate market instability.'
        });
      }
    }
    
    // Check for holder distribution issues
    if (inputData.collectionInputData?.holderDistribution) {
      const distribution = inputData.collectionInputData.holderDistribution;
      
      if (distribution.topHolderPercentage > 50) {
        redFlags.push({
          severity: 'high',
          description: 'Concentrated ownership',
          evidence: `Top 1% of holders control ${distribution.topHolderPercentage}% of the collection, indicating high concentration risk.`
        });
      }
      
      if (distribution.whaleConcentration !== undefined && distribution.whaleConcentration > 70) {
        redFlags.push({
          severity: 'high',
          description: 'Whale dominance',
          evidence: `Top 10 wallets control ${distribution.whaleConcentration}% of the collection, creating significant market control risk.`
        });
      }
    }
    
    return redFlags;
  }

  /**
   * Identify strengths related to collection performance
   * 
   * @param inputData The NFT input data
   * @param score The calculated performance score
   * @returns Array of strengths
   */
  public identifyStrengths(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.Strength[] {
    const strengths: TrustScoreTypes.Strength[] = [];
    
    if (!inputData.collectionData) {
      return strengths;
    }
    
    // Check for established collection
    const collectionAge = this.getCollectionAgeInDays(inputData.collectionData.creationDate);
    if (collectionAge > 365) {
      strengths.push({
        significance: 'medium',
        description: 'Established collection',
        evidence: `Collection has been active for over ${Math.floor(collectionAge / 365)} year(s), demonstrating longevity.`
      });
    }
    
    // Check for substantial collection size
    if (inputData.collectionData.size > 5000) {
      strengths.push({
        significance: 'medium',
        description: 'Large collection',
        evidence: `Collection contains ${inputData.collectionData.size} NFTs, indicating substantial market presence.`
      });
    }
    
    // Check for floor price stability
    if (inputData.collectionInputData?.floorPriceHistory && 
        inputData.collectionInputData.floorPriceHistory.length > 1) {
      const floorPriceStability = this.calculateFloorPriceStability(
        inputData.collectionInputData.floorPriceHistory
      );
      
      if (floorPriceStability > 0.7) {
        strengths.push({
          significance: 'high',
          description: 'Stable floor price',
          evidence: 'Collection floor price shows excellent stability, indicating healthy market dynamics.'
        });
      }
    }
    
    // Check for good holder distribution
    if (inputData.collectionInputData?.holderDistribution) {
      const distribution = inputData.collectionInputData.holderDistribution;
      
      if (distribution.topHolderPercentage < 20) {
        strengths.push({
          significance: 'high',
          description: 'Well-distributed ownership',
          evidence: `Top 1% of holders control only ${distribution.topHolderPercentage}% of the collection, indicating healthy distribution.`
        });
      }
      
      if (distribution.holderRetentionRate !== undefined && distribution.holderRetentionRate > 70) {
        strengths.push({
          significance: 'high',
          description: 'Strong holder retention',
          evidence: `${distribution.holderRetentionRate}% of holders keep their NFTs for more than 30 days, indicating strong collector confidence.`
        });
      }
    }
    
    return strengths;
  }

  /**
   * Calculate the factor score for a collection
   * 
   * @param inputData The collection data needed for calculation
   * @returns A factor score for the collection
   */
  public async calculateForCollection(inputData: TrustScoreTypes.CollectionInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values
    let score = 50;
    let confidence = 0.3;
    let explanation = "Limited collection data available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process collection data
    details.collectionId = inputData.collectionId;
    details.contractAddress = inputData.contractAddress;
    details.nftCount = inputData.nfts.length;
    
    // Calculate floor price stability if data available
    let floorPriceStabilityScore = 0.5; // Default neutral score
    if (inputData.floorPriceHistory && inputData.floorPriceHistory.length > 0) {
      floorPriceStabilityScore = this.calculateFloorPriceStability(inputData.floorPriceHistory);
      details.floorPriceStabilityScore = floorPriceStabilityScore;
      details.floorPriceHistoryLength = inputData.floorPriceHistory.length;
    }
    
    // Calculate trading volume consistency if data available
    let tradingVolumeScore = 0.5; // Default neutral score
    if (inputData.tradingVolumeHistory && inputData.tradingVolumeHistory.length > 0) {
      tradingVolumeScore = this.calculateTradingVolumeConsistency(inputData.tradingVolumeHistory);
      details.tradingVolumeScore = tradingVolumeScore;
      details.volumeHistoryLength = inputData.tradingVolumeHistory.length;
    }
    
    // Calculate holder distribution metrics if data available
    let holderDistributionScore = 0.5; // Default neutral score
    if (inputData.holderDistribution) {
      holderDistributionScore = this.calculateHolderDistributionScore(inputData.holderDistribution);
      details.holderDistributionScore = holderDistributionScore;
      details.uniqueHolders = inputData.holderDistribution.uniqueHolders;
      details.topHolderPercentage = inputData.holderDistribution.topHolderPercentage;
    }
    
    // Calculate overall collection performance score (higher is better)
    score = Math.round((
      floorPriceStabilityScore * 0.4 + 
      tradingVolumeScore * 0.3 + 
      holderDistributionScore * 0.3
    ) * 100);
    
    // Calculate confidence based on data completeness
    confidence = Math.min(0.95, 0.3 + 
      (inputData.nfts.length > 100 ? 0.3 : inputData.nfts.length * 0.003) + 
      (inputData.floorPriceHistory ? 0.2 : 0) + 
      (inputData.tradingVolumeHistory ? 0.1 : 0) + 
      (inputData.holderDistribution ? 0.1 : 0)
    );
    
    // Generate explanation
    if (score >= 90) {
      explanation = `Collection shows excellent performance with stable floor price, consistent trading volume, and healthy holder distribution.`;
    } else if (score >= 70) {
      explanation = `Collection shows good performance with relatively stable metrics and healthy trading activity.`;
    } else if (score >= 50) {
      explanation = `Collection shows moderate performance with average stability and trading activity.`;
    } else if (score >= 30) {
      explanation = `Collection shows concerning performance with unstable floor price or inconsistent trading activity.`;
    } else {
      explanation = `Collection shows poor performance with highly volatile metrics or problematic holder distribution.`;
    }
    
    // Identify red flags and strengths
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    const strengths: TrustScoreTypes.Strength[] = [];
    
    // Add red flags based on score components
    if (floorPriceStabilityScore < 0.3) {
      redFlags.push({
        severity: 'high',
        description: 'Highly volatile floor price',
        evidence: 'Collection floor price shows extreme volatility, which may indicate market instability.'
      });
    }
    
    // Add strengths based on score components
    if (holderDistributionScore > 0.7) {
      strengths.push({
        significance: 'high',
        description: 'Healthy holder distribution',
        evidence: 'Collection has a well-distributed ownership structure with good holder retention.'
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
    return `The Collection Performance Factor evaluates the health and stability of the NFT's collection based on market metrics. It considers:

1. Floor Price Stability (40%): The consistency and trend of the collection's floor price over time.
2. Trading Volume Consistency (30%): The regularity and predictability of trading activity.
3. Holder Distribution (30%): The diversity of ownership and retention patterns.

The confidence in this score increases with larger collection size and longer history.`;
  }
}
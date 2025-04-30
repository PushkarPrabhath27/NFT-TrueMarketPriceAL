/**
 * SocialValidationFactor.ts
 * 
 * Implementation of the Social Validation Factor calculator.
 * This factor evaluates the social perception of an NFT based on mention frequency,
 * sentiment analysis, and engagement metrics quality.
 * It accounts for 10% of the overall trust score.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';

/**
 * Calculates the Social Validation Factor score for NFTs based on social signals.
 */
export class SocialValidationFactor implements FactorCalculator {
  /**
   * The weight of this factor in the overall trust score (10%)
   */
  public readonly weight: number;

  /**
   * Initialize the Social Validation Factor calculator with its weight
   * 
   * @param weight The weight of this factor in the overall trust score
   */
  constructor(weight: number = 0.10) {
    this.weight = weight;
  }

  /**
   * Calculate the social validation score based on social signals
   * 
   * @param inputData The NFT data including social signals
   * @returns A factor score with confidence metrics and explanations
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values for when no social signal data is available
    let score = 50; // Neutral score
    let confidence = 0.3; // Low confidence without data
    let explanation = "Limited social validation data available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process social signals if available
    if (inputData.socialSignals && inputData.socialSignals.length > 0) {
      const signals = inputData.socialSignals;
      
      // Calculate mention frequency score
      const mentionFrequencyScore = this.calculateMentionFrequencyScore(signals);
      details.mentionFrequencyScore = mentionFrequencyScore;
      details.totalMentions = signals.reduce((sum, signal) => sum + signal.mentionCount, 0);
      
      // Calculate sentiment score
      const sentimentScore = this.calculateSentimentScore(signals);
      details.sentimentScore = sentimentScore;
      
      // Calculate engagement quality score
      const engagementQualityScore = this.calculateEngagementQualityScore(signals);
      details.engagementQualityScore = engagementQualityScore;
      
      // Calculate overall social validation score (higher is better)
      score = Math.round((
        mentionFrequencyScore * 0.4 + 
        sentimentScore * 0.3 + 
        engagementQualityScore * 0.3
      ) * 100);
      
      // Calculate confidence based on data volume and diversity
      confidence = this.calculateConfidence(inputData, {
        signalCount: signals.length,
        platformCount: new Set(signals.map(s => s.platform)).size,
        hasSentimentData: signals.some(s => s.sentimentScore !== undefined),
        hasEngagementData: signals.some(s => s.engagementMetrics !== undefined)
      });
      
      // Generate explanation
      if (score >= 90) {
        explanation = `NFT has excellent social validation with frequent positive mentions and high-quality engagement.`;
      } else if (score >= 70) {
        explanation = `NFT has good social validation with regular mentions and generally positive sentiment.`;
      } else if (score >= 50) {
        explanation = `NFT has moderate social validation with average mention frequency and mixed sentiment.`;
      } else if (score >= 30) {
        explanation = `NFT has limited social validation with few mentions or negative sentiment.`;
      } else {
        explanation = `NFT has poor social validation with very few mentions or predominantly negative sentiment.`;
      }
      
      // Add specific details to explanation
      if (details.totalMentions > 0) {
        explanation += ` Found ${details.totalMentions} mentions across ${details.platformCount} platforms.`;
      }
      
      if (sentimentScore > 0.7) {
        explanation += ` Sentiment is predominantly positive.`;
      } else if (sentimentScore < 0.3) {
        explanation += ` Sentiment is predominantly negative.`;
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
   * Calculate a score based on mention frequency
   * 
   * @param signals Array of social signals
   * @returns A score between 0-1 representing mention frequency
   */
  private calculateMentionFrequencyScore(signals: TrustScoreTypes.SocialSignal[]): number {
    if (signals.length === 0) {
      return 0.5; // Neutral score if no data
    }
    
    // Calculate total mentions
    const totalMentions = signals.reduce((sum, signal) => sum + signal.mentionCount, 0);
    
    // Calculate platforms count
    const platforms = new Set(signals.map(s => s.platform));
    const platformCount = platforms.size;
    
    // Calculate recency of mentions (weighted more for recent mentions)
    const now = new Date();
    const recentMentions = signals.reduce((sum, signal) => {
      const daysSince = Math.max(0, (now.getTime() - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      const recencyWeight = Math.exp(-0.05 * daysSince); // Exponential decay with time
      return sum + (signal.mentionCount * recencyWeight);
    }, 0);
    
    // Calculate mention frequency score based on total mentions and platform diversity
    // This is a sigmoid function that gives diminishing returns for very high mention counts
    const mentionScore = 1 / (1 + Math.exp(-0.01 * totalMentions + 3)); // Sigmoid centered at 300 mentions
    const platformDiversityScore = 1 - (1 / (1 + platformCount));
    const recencyScore = recentMentions / totalMentions;
    
    // Combine scores with weights
    return (
      mentionScore * 0.6 +
      platformDiversityScore * 0.2 +
      recencyScore * 0.2
    );
  }

  /**
   * Calculate a score based on sentiment analysis
   * 
   * @param signals Array of social signals
   * @returns A score between 0-1 representing sentiment (higher is more positive)
   */
  private calculateSentimentScore(signals: TrustScoreTypes.SocialSignal[]): number {
    // Filter signals with sentiment data
    const sentimentSignals = signals.filter(s => s.sentimentScore !== undefined);
    
    if (sentimentSignals.length === 0) {
      return 0.5; // Neutral score if no sentiment data
    }
    
    // Calculate weighted average sentiment (weighted by mention count)
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const signal of sentimentSignals) {
      if (signal.sentimentScore !== undefined) {
        // Convert sentiment from -1 to 1 scale to 0 to 1 scale
        const normalizedSentiment = (signal.sentimentScore + 1) / 2;
        weightedSum += normalizedSentiment * signal.mentionCount;
        totalWeight += signal.mentionCount;
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  /**
   * Calculate a score based on engagement metrics quality
   * 
   * @param signals Array of social signals
   * @returns A score between 0-1 representing engagement quality
   */
  private calculateEngagementQualityScore(signals: TrustScoreTypes.SocialSignal[]): number {
    // Filter signals with engagement metrics
    const engagementSignals = signals.filter(s => s.engagementMetrics !== undefined);
    
    if (engagementSignals.length === 0) {
      return 0.5; // Neutral score if no engagement data
    }
    
    // Calculate engagement metrics across all signals
    const totalLikes = engagementSignals.reduce((sum, s) => sum + (s.engagementMetrics?.likes || 0), 0);
    const totalShares = engagementSignals.reduce((sum, s) => sum + (s.engagementMetrics?.shares || 0), 0);
    const totalComments = engagementSignals.reduce((sum, s) => sum + (s.engagementMetrics?.comments || 0), 0);
    const totalViews = engagementSignals.reduce((sum, s) => sum + (s.engagementMetrics?.views || 0), 0);
    
    // Calculate engagement ratios (if view data is available)
    let engagementRatio = 0.5; // Default neutral score
    if (totalViews > 0) {
      const likesRatio = totalLikes / totalViews;
      const sharesRatio = totalShares / totalViews;
      const commentsRatio = totalComments / totalViews;
      
      // Calculate engagement ratio score (higher is better)
      // These thresholds can be adjusted based on typical engagement rates
      const normalizedLikesRatio = Math.min(1, likesRatio * 100); // Cap at 1% like rate
      const normalizedSharesRatio = Math.min(1, sharesRatio * 500); // Cap at 0.2% share rate
      const normalizedCommentsRatio = Math.min(1, commentsRatio * 200); // Cap at 0.5% comment rate
      
      engagementRatio = (
        normalizedLikesRatio * 0.4 +
        normalizedSharesRatio * 0.4 +
        normalizedCommentsRatio * 0.2
      );
    } else {
      // If no view data, use absolute engagement numbers
      const totalEngagements = totalLikes + totalShares + totalComments;
      const totalMentions = engagementSignals.reduce((sum, s) => sum + s.mentionCount, 0);
      
      if (totalMentions > 0) {
        // Calculate engagements per mention
        const engagementsPerMention = totalEngagements / totalMentions;
        engagementRatio = Math.min(1, engagementsPerMention / 10); // Cap at 10 engagements per mention
      }
    }
    
    // Detect artificial engagement patterns
    const artificialEngagementScore = this.detectArtificialEngagement(engagementSignals);
    
    // Combine scores (penalize for artificial engagement)
    return engagementRatio * artificialEngagementScore;
  }

  /**
   * Detect artificial engagement patterns and return a penalty score
   * 
   * @param signals Array of social signals with engagement metrics
   * @returns A score between 0-1 (1 = no artificial patterns, lower = suspicious patterns)
   */
  private detectArtificialEngagement(signals: TrustScoreTypes.SocialSignal[]): number {
    if (signals.length < 2) {
      return 1.0; // Not enough data to detect patterns
    }
    
    let suspiciousPatternScore = 1.0;
    
    // Check for unusually uniform engagement ratios across different platforms
    const platformEngagementRatios: Record<string, number[]> = {};
    
    for (const signal of signals) {
      if (signal.engagementMetrics && signal.mentionCount > 0) {
        const totalEngagements = (
          signal.engagementMetrics.likes +
          signal.engagementMetrics.shares +
          signal.engagementMetrics.comments
        );
        
        const ratio = totalEngagements / signal.mentionCount;
        
        if (!platformEngagementRatios[signal.platform]) {
          platformEngagementRatios[signal.platform] = [];
        }
        
        platformEngagementRatios[signal.platform].push(ratio);
      }
    }
    
    // Check for suspiciously similar engagement patterns across platforms
    if (Object.keys(platformEngagementRatios).length > 1) {
      const platformAverages = Object.entries(platformEngagementRatios).map(([platform, ratios]) => {
        return {
          platform,
          average: ratios.reduce((sum, r) => sum + r, 0) / ratios.length
        };
      });
      
      // Calculate coefficient of variation across platform averages
      const avgValues = platformAverages.map(p => p.average);
      const mean = avgValues.reduce((sum, v) => sum + v, 0) / avgValues.length;
      const variance = avgValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / avgValues.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0;
      
      // If engagement patterns are too similar across platforms (low CV), it's suspicious
      if (cv < 0.2) { // Threshold for suspiciously uniform engagement
        suspiciousPatternScore -= 0.3; // Penalty for suspicious uniformity
      }
    }
    
    // Check for suspiciously high engagement spikes
    const allRatios = Object.values(platformEngagementRatios).flat();
    if (allRatios.length > 0) {
      const maxRatio = Math.max(...allRatios);
      const avgRatio = allRatios.reduce((sum, r) => sum + r, 0) / allRatios.length;
      
      // If max ratio is much higher than average, it's suspicious
      if (maxRatio > avgRatio * 5) {
        suspiciousPatternScore -= 0.2; // Penalty for suspicious spikes
      }
    }
    
    return Math.max(0.3, suspiciousPatternScore); // Minimum score of 0.3
  }

  /**
   * Calculate the confidence in the social validation score
   * 
   * @param inputData The NFT input data
   * @param metrics Metrics about social data
   * @returns A confidence value between 0-1
   */
  public calculateConfidence(inputData: TrustScoreTypes.NFTInputData, metrics: any): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Adjust based on signal count (more signals = higher confidence)
    if (metrics.signalCount > 50) {
      confidence += 0.2;
    } else if (metrics.signalCount > 20) {
      confidence += 0.15;
    } else if (metrics.signalCount > 10) {
      confidence += 0.1;
    } else if (metrics.signalCount > 5) {
      confidence += 0.05;
    }
    
    // Adjust based on platform diversity (more platforms = higher confidence)
    if (metrics.platformCount > 5) {
      confidence += 0.2;
    } else if (metrics.platformCount > 3) {
      confidence += 0.1;
    } else if (metrics.platformCount > 1) {
      confidence += 0.05;
    }
    
    // Adjust based on data completeness
    if (metrics.hasSentimentData) {
      confidence += 0.1;
    }
    
    if (metrics.hasEngagementData) {
      confidence += 0.1;
    }
    
    // Cap confidence at 0.95 (never 100% confident)
    return Math.min(0.95, confidence);
  }

  /**
   * Identify red flags related to social validation
   * 
   * @param inputData The NFT input data
   * @param score The calculated social validation score
   * @returns Array of red flags
   */
  public identifyRedFlags(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    if (!inputData.socialSignals || inputData.socialSignals.length === 0) {
      redFlags.push({
        severity: 'low',
        description: 'No social validation data',
        evidence: 'Unable to verify social perception due to missing data.'
      });
      return redFlags;
    }
    
    const signals = inputData.socialSignals;
    
    // Check for very low mention count
    const totalMentions = signals.reduce((sum, s) => sum + s.mentionCount, 0);
    if (totalMentions < 10) {
      redFlags.push({
        severity: 'medium',
        description: 'Very low social visibility',
        evidence: `NFT has only ${totalMentions} mentions across all platforms, indicating limited market awareness.`
      });
    }
    
    // Check for predominantly negative sentiment
    const sentimentSignals = signals.filter(s => s.sentimentScore !== undefined);
    if (sentimentSignals.length > 0) {
      const weightedSentiment = sentimentSignals.reduce((sum, s) => {
        return sum + ((s.sentimentScore || 0) * s.mentionCount);
      }, 0) / sentimentSignals.reduce((sum, s) => sum + s.mentionCount, 0);
      
      if (weightedSentiment < -0.3) { // Significantly negative
        redFlags.push({
          severity: 'high',
          description: 'Negative social sentiment',
          evidence: 'NFT has predominantly negative sentiment in social mentions.'
        });
      }
    }
    
    // Check for artificial engagement patterns
    const engagementSignals = signals.filter(s => s.engagementMetrics !== undefined);
    if (engagementSignals.length > 1) {
      const artificialEngagementScore = this.detectArtificialEngagement(engagementSignals);
      
      if (artificialEngagementScore < 0.7) {
        redFlags.push({
          severity: 'high',
          description: 'Suspicious engagement patterns',
          evidence: 'Engagement metrics show patterns that may indicate artificial manipulation.'
        });
      }
    }
    
    return redFlags;
  }

  /**
   * Identify strengths related to social validation
   * 
   * @param inputData The NFT input data
   * @param score The calculated social validation score
   * @returns Array of strengths
   */
  public identifyStrengths(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.Strength[] {
    const strengths: TrustScoreTypes.Strength[] = [];
    
    if (!inputData.socialSignals || inputData.socialSignals.length === 0) {
      return strengths;
    }
    
    const signals = inputData.socialSignals;
    
    // Check for high mention count
    const totalMentions = signals.reduce((sum, s) => sum + s.mentionCount, 0);
    if (totalMentions > 100) {
      strengths.push({
        significance: 'high',
        description: 'Strong social visibility',
        evidence: `NFT has ${totalMentions} mentions across social platforms, indicating significant market awareness.`
      });
    } else if (totalMentions > 50) {
      strengths.push({
        significance: 'medium',
        description: 'Good social visibility',
        evidence: `NFT has ${totalMentions} mentions across social platforms.`
      });
    }
    
    // Check for positive sentiment
    const sentimentSignals = signals.filter(s => s.sentimentScore !== undefined);
    if (sentimentSignals.length > 0) {
      const weightedSentiment = sentimentSignals.reduce((sum, s) => {
        return sum + ((s.sentimentScore || 0) * s.mentionCount);
      }, 0) / sentimentSignals.reduce((sum, s) => sum + s.mentionCount, 0);
      
      if (weightedSentiment > 0.3) { // Significantly positive
        strengths.push({
          significance: 'high',
          description: 'Positive social sentiment',
          evidence: 'NFT has predominantly positive sentiment in social mentions.'
        });
      }
    }
    
    // Check for high engagement
    const engagementSignals = signals.filter(s => s.engagementMetrics !== undefined);
    if (engagementSignals.length > 0) {
      const totalEngagements = engagementSignals.reduce((sum, s) => {
        const metrics = s.engagementMetrics;
        if (!metrics) return sum;
        return sum + metrics.likes + metrics.shares + metrics.comments;
      }, 0);
      
      if (totalEngagements > 1000) {
        strengths.push({
          significance: 'high',
          description: 'Strong social engagement',
          evidence: `NFT has generated over ${totalEngagements} engagements (likes, shares, comments) across platforms.`
        });
      } else if (totalEngagements > 500) {
        strengths.push({
          significance: 'medium',
          description: 'Good social engagement',
          evidence: `NFT has generated ${totalEngagements} engagements across platforms.`
        });
      }
    }
    
    // Check for platform diversity
    const platforms = new Set(signals.map(s => s.platform));
    if (platforms.size > 3) {
      strengths.push({
        significance: 'medium',
        description: 'Broad platform presence',
        evidence: `NFT has mentions across ${platforms.size} different social platforms.`
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
    return `The Social Validation Factor evaluates the NFT's perception and visibility across social platforms. It considers:

1. Mention Frequency (40%): How often the NFT is mentioned across different platforms, with emphasis on recency.
2. Sentiment Analysis (30%): The overall sentiment of mentions, from negative to positive.
3. Engagement Quality (30%): The quality and authenticity of social engagements, detecting potential artificial patterns.

The confidence in this score increases with more data from diverse platforms and the presence of sentiment and engagement metrics.`;
  }
}
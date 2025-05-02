/**
 * ChangeSignificanceDetector.ts
 * 
 * Implements the change significance detection component of the Notification Generation System.
 * Responsible for detecting significant changes in trust scores, prices, and risk levels
 * that warrant user notifications.
 */

import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the change significance detector
 */
export interface ChangeSignificanceConfig {
  // Absolute thresholds for different metrics
  absoluteThresholds: {
    trustScore: number;       // e.g., 50 - notify if score drops below this
    riskLevel: number;        // e.g., 7 - notify if risk exceeds this
    priceChange: number;      // e.g., 1.0 ETH - notify if price changes by this amount
  };
  
  // Relative thresholds (percentage changes)
  relativeThresholds: {
    trustScore: number;       // e.g., 0.2 - notify if score changes by 20%
    price: number;            // e.g., 0.2 - notify if price changes by 20%
    riskLevel: number;        // e.g., 0.3 - notify if risk level changes by 30%
    socialSentiment: number;  // e.g., 0.4 - notify if sentiment changes by 40%
  };
  
  // Trend detection settings
  trendDetection: {
    minDataPoints: number;    // Minimum data points needed to detect a trend
    significanceThreshold: number; // Statistical significance threshold
    reversalConfirmationPoints: number; // Points needed to confirm trend reversal
  };
  
  // Anomaly detection settings
  anomalyDetection: {
    zScoreThreshold: number;  // Z-score threshold for statistical anomalies
    outlierPercentile: number; // Percentile threshold for outliers
  };
  
  // User personalization settings
  personalization: {
    enabled: boolean;         // Whether personalization is enabled
    defaultInterestLevel: number; // Default interest level for new users (0-1)
    maxNotificationsPerDay: number; // Maximum notifications per day per user
    portfolioRelevanceWeight: number; // Weight for portfolio relevance in significance
  };
}

/**
 * Result of significance detection
 */
export interface SignificanceResult {
  isSignificant: boolean;     // Whether the change is significant
  significanceScore: number;  // Score representing how significant (0-10)
  significanceFactors: string[]; // Factors that contributed to significance
  recommendedPriority: number; // Recommended notification priority (1-10)
  userRelevance?: number;     // How relevant this is to the user (0-1)
}

/**
 * Historical data point for trend analysis
 */
interface HistoricalDataPoint {
  value: number;
  timestamp: number;
}

/**
 * Detects significant changes that warrant notifications
 */
export class ChangeSignificanceDetector {
  private config: ChangeSignificanceConfig;
  private historicalData: Map<string, HistoricalDataPoint[]> = new Map();
  private userInterests: Map<string, Map<string, number>> = new Map();
  private userNotificationCounts: Map<string, number> = new Map();
  private lastResetTime: number = Date.now();
  
  /**
   * Initialize the Change Significance Detector
   * 
   * @param config Configuration for the detector
   */
  constructor(config: Partial<ChangeSignificanceConfig> = {}) {
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<ChangeSignificanceConfig>): ChangeSignificanceConfig {
    return {
      absoluteThresholds: {
        trustScore: 50,       // Notify if trust score drops below 50
        riskLevel: 7,         // Notify if risk level exceeds 7 (high risk)
        priceChange: 1.0,     // Notify if price changes by 1.0 ETH or more
        ...config.absoluteThresholds
      },
      relativeThresholds: {
        trustScore: 0.2,      // 20% change in trust score
        price: 0.2,           // 20% change in price
        riskLevel: 0.3,       // 30% change in risk level
        socialSentiment: 0.4, // 40% change in social sentiment
        ...config.relativeThresholds
      },
      trendDetection: {
        minDataPoints: 5,      // Need at least 5 data points to detect a trend
        significanceThreshold: 0.05, // 95% confidence level
        reversalConfirmationPoints: 3, // Need 3 points to confirm a reversal
        ...config.trendDetection
      },
      anomalyDetection: {
        zScoreThreshold: 2.5,  // Z-score > 2.5 is an anomaly (99% confidence)
        outlierPercentile: 0.95, // 95th percentile is an outlier
        ...config.anomalyDetection
      },
      personalization: {
        enabled: true,
        defaultInterestLevel: 0.5, // Medium interest by default
        maxNotificationsPerDay: 10,
        portfolioRelevanceWeight: 0.7, // Portfolio items get 70% boost
        ...config.personalization
      }
    };
  }
  
  /**
   * Detect if a change is significant enough to warrant a notification
   * 
   * @param event The update event to evaluate
   * @param userId Optional user ID for personalization
   * @param previousValue Previous value before the change
   * @param currentValue Current value after the change
   * @returns Significance detection result
   */
  public detectSignificance(
    event: TrustScoreTypes.UpdateEvent,
    userId?: string,
    previousValue?: number,
    currentValue?: number
  ): SignificanceResult {
    // Reset notification counts if a day has passed
    this.checkAndResetNotificationCounts();
    
    // Initialize result
    const result: SignificanceResult = {
      isSignificant: false,
      significanceScore: 0,
      significanceFactors: [],
      recommendedPriority: 5, // Default medium priority
    };
    
    // Check absolute thresholds
    const absoluteSignificance = this.checkAbsoluteThresholds(event, currentValue);
    if (absoluteSignificance.isSignificant) {
      result.isSignificant = true;
      result.significanceScore += absoluteSignificance.score;
      result.significanceFactors.push(...absoluteSignificance.factors);
    }
    
    // Check relative thresholds if we have previous and current values
    if (previousValue !== undefined && currentValue !== undefined) {
      const relativeSignificance = this.checkRelativeThresholds(
        event, previousValue, currentValue
      );
      if (relativeSignificance.isSignificant) {
        result.isSignificant = true;
        result.significanceScore += relativeSignificance.score;
        result.significanceFactors.push(...relativeSignificance.factors);
      }
      
      // Store historical data for trend analysis
      this.storeHistoricalDataPoint(event, currentValue);
      
      // Check for trend reversals
      const trendSignificance = this.checkTrendReversal(event);
      if (trendSignificance.isSignificant) {
        result.isSignificant = true;
        result.significanceScore += trendSignificance.score;
        result.significanceFactors.push(...trendSignificance.factors);
      }
      
      // Check for anomalies
      const anomalySignificance = this.checkForAnomalies(event, currentValue);
      if (anomalySignificance.isSignificant) {
        result.isSignificant = true;
        result.significanceScore += anomalySignificance.score;
        result.significanceFactors.push(...anomalySignificance.factors);
      }
    }
    
    // Apply personalization if enabled and userId provided
    if (this.config.personalization.enabled && userId) {
      const personalizationResult = this.applyPersonalization(event, userId);
      result.userRelevance = personalizationResult.relevance;
      
      // Adjust significance based on user relevance
      if (personalizationResult.relevance < 0.3) {
        // Low relevance can make a significant change insignificant
        result.significanceScore *= personalizationResult.relevance;
        if (result.significanceScore < 2) {
          result.isSignificant = false;
        }
      } else if (personalizationResult.relevance > 0.7) {
        // High relevance can boost significance
        result.significanceScore *= (1 + (personalizationResult.relevance - 0.7));
      }
      
      // Check notification frequency limits
      if (result.isSignificant && !this.checkNotificationFrequencyLimit(userId)) {
        result.isSignificant = false;
        result.significanceFactors.push('Frequency limit reached');
      }
    }
    
    // Calculate final recommended priority based on significance score
    if (result.isSignificant) {
      // Scale significance score (0-10) to priority (1-10)
      result.recommendedPriority = Math.max(1, Math.min(10, Math.round(result.significanceScore)));
    }
    
    return result;
  }
  
  /**
   * Check if the current value violates any absolute thresholds
   */
  private checkAbsoluteThresholds(event: TrustScoreTypes.UpdateEvent, currentValue?: number): {
    isSignificant: boolean;
    score: number;
    factors: string[];
  } {
    const result = {
      isSignificant: false,
      score: 0,
      factors: [] as string[]
    };
    
    if (currentValue === undefined) {
      return result;
    }
    
    // Check trust score threshold
    if (event.eventType.includes('trust_score') && 
        currentValue < this.config.absoluteThresholds.trustScore) {
      result.isSignificant = true;
      result.score += 5; // Medium-high significance
      result.factors.push(`Trust score below threshold (${currentValue} < ${this.config.absoluteThresholds.trustScore})`);
    }
    
    // Check risk level threshold
    if (event.eventType.includes('risk') && 
        currentValue > this.config.absoluteThresholds.riskLevel) {
      result.isSignificant = true;
      result.score += 7; // High significance
      result.factors.push(`Risk level above threshold (${currentValue} > ${this.config.absoluteThresholds.riskLevel})`);
    }
    
    // Check price change threshold
    if (event.eventType.includes('price') && 
        Math.abs(currentValue) > this.config.absoluteThresholds.priceChange) {
      result.isSignificant = true;
      result.score += 6; // Medium-high significance
      result.factors.push(`Price change exceeds threshold (${Math.abs(currentValue)} > ${this.config.absoluteThresholds.priceChange})`);
    }
    
    // Fraud detection is always significant
    if (event.eventType.includes('fraud')) {
      result.isSignificant = true;
      result.score += 8; // Very high significance
      result.factors.push('Fraud detection finding');
    }
    
    return result;
  }
  
  /**
   * Check if the change between previous and current values exceeds relative thresholds
   */
  private checkRelativeThresholds(
    event: TrustScoreTypes.UpdateEvent,
    previousValue: number,
    currentValue: number
  ): {
    isSignificant: boolean;
    score: number;
    factors: string[];
  } {
    const result = {
      isSignificant: false,
      score: 0,
      factors: [] as string[]
    };
    
    // Calculate percentage change
    const absoluteChange = Math.abs(currentValue - previousValue);
    const percentageChange = previousValue !== 0 ? 
      absoluteChange / Math.abs(previousValue) : 
      absoluteChange > 0 ? 1 : 0;
    
    // Check trust score threshold
    if (event.eventType.includes('trust_score') && 
        percentageChange > this.config.relativeThresholds.trustScore) {
      result.isSignificant = true;
      result.score += 4 + (percentageChange * 10); // Scale with magnitude
      result.factors.push(`Trust score changed by ${(percentageChange * 100).toFixed(1)}%`);
    }
    
    // Check price threshold
    if (event.eventType.includes('price') && 
        percentageChange > this.config.relativeThresholds.price) {
      result.isSignificant = true;
      result.score += 3 + (percentageChange * 10); // Scale with magnitude
      result.factors.push(`Price changed by ${(percentageChange * 100).toFixed(1)}%`);
    }
    
    // Check risk level threshold
    if (event.eventType.includes('risk') && 
        percentageChange > this.config.relativeThresholds.riskLevel) {
      result.isSignificant = true;
      result.score += 5 + (percentageChange * 10); // Scale with magnitude
      result.factors.push(`Risk level changed by ${(percentageChange * 100).toFixed(1)}%`);
    }
    
    // Check social sentiment threshold
    if (event.eventType.includes('social') && 
        percentageChange > this.config.relativeThresholds.socialSentiment) {
      result.isSignificant = true;
      result.score += 3 + (percentageChange * 8); // Scale with magnitude
      result.factors.push(`Social sentiment changed by ${(percentageChange * 100).toFixed(1)}%`);
    }
    
    return result;
  }
  
  /**
   * Store a historical data point for trend analysis
   */
  private storeHistoricalDataPoint(event: TrustScoreTypes.UpdateEvent, value: number): void {
    const key = `${event.entityType}-${event.entityId}-${event.eventType}`;
    
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }
    
    const dataPoints = this.historicalData.get(key)!;
    
    // Add new data point
    dataPoints.push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only the last 30 data points to limit memory usage
    if (dataPoints.length > 30) {
      dataPoints.shift();
    }
  }
  
  /**
   * Check if there's a trend reversal
   */
  private checkTrendReversal(event: TrustScoreTypes.UpdateEvent): {
    isSignificant: boolean;
    score: number;
    factors: string[];
  } {
    const result = {
      isSignificant: false,
      score: 0,
      factors: [] as string[]
    };
    
    const key = `${event.entityType}-${event.entityId}-${event.eventType}`;
    const dataPoints = this.historicalData.get(key);
    
    if (!dataPoints || dataPoints.length < this.config.trendDetection.minDataPoints) {
      return result;
    }
    
    // Sort data points by timestamp
    const sortedPoints = [...dataPoints].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate trends for first and second half of the data
    const midpoint = Math.floor(sortedPoints.length / 2);
    const firstHalf = sortedPoints.slice(0, midpoint);
    const secondHalf = sortedPoints.slice(midpoint);
    
    // Simple linear regression to detect trend direction
    const firstTrend = this.calculateTrendSlope(firstHalf);
    const secondTrend = this.calculateTrendSlope(secondHalf);
    
    // Check if trend direction has reversed
    if (firstTrend * secondTrend < 0 && // Opposite signs indicate reversal
        Math.abs(firstTrend) > 0.01 && Math.abs(secondTrend) > 0.01) { // Significant trends
      
      // Confirm reversal with enough points
      if (secondHalf.length >= this.config.trendDetection.reversalConfirmationPoints) {
        result.isSignificant = true;
        result.score = 6; // Medium-high significance
        
        const direction = secondTrend > 0 ? 'upward' : 'downward';
        result.factors.push(`Trend reversal detected (now ${direction})`);
      }
    }
    
    return result;
  }
  
  /**
   * Calculate the slope of a trend from data points
   */
  private calculateTrendSlope(dataPoints: HistoricalDataPoint[]): number {
    if (dataPoints.length < 2) {
      return 0;
    }
    
    // Simple linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = dataPoints.length;
    
    // Normalize timestamps to avoid numerical issues
    const baseTime = dataPoints[0].timestamp;
    
    for (const point of dataPoints) {
      const x = (point.timestamp - baseTime) / (1000 * 60 * 60); // Convert to hours
      const y = point.value;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    
    // Calculate slope
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
  
  /**
   * Check for statistical anomalies in the data
   */
  private checkForAnomalies(event: TrustScoreTypes.UpdateEvent, currentValue: number): {
    isSignificant: boolean;
    score: number;
    factors: string[];
  } {
    const result = {
      isSignificant: false,
      score: 0,
      factors: [] as string[]
    };
    
    const key = `${event.entityType}-${event.entityId}-${event.eventType}`;
    const dataPoints = this.historicalData.get(key);
    
    if (!dataPoints || dataPoints.length < 5) { // Need at least 5 points for meaningful statistics
      return result;
    }
    
    // Calculate mean and standard deviation
    const values = dataPoints.map(p => p.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-score for current value
    const zScore = stdDev !== 0 ? Math.abs(currentValue - mean) / stdDev : 0;
    
    // Check if z-score exceeds threshold
    if (zScore > this.config.anomalyDetection.zScoreThreshold) {
      result.isSignificant = true;
      result.score = 5 + Math.min(3, zScore - this.config.anomalyDetection.zScoreThreshold);
      result.factors.push(`Statistical anomaly detected (z-score: ${zScore.toFixed(2)})`);
    }
    
    // Check if current value is in the outlier percentile
    const sortedValues = [...values].sort((a, b) => a - b);
    const percentileIndex = Math.floor(sortedValues.length * this.config.anomalyDetection.outlierPercentile);
    const percentileThreshold = sortedValues[percentileIndex];
    
    if ((currentValue > mean && currentValue > percentileThreshold) || 
        (currentValue < mean && currentValue < sortedValues[sortedValues.length - 1 - percentileIndex])) {
      result.isSignificant = true;
      result.score += 4; // Medium significance
      result.factors.push(`Outlier value detected (outside ${this.config.anomalyDetection.outlierPercentile * 100}th percentile)`);
    }
    
    return result;
  }
  
  /**
   * Apply personalization based on user interests and portfolio
   */
  private applyPersonalization(event: TrustScoreTypes.UpdateEvent, userId: string): {
    relevance: number;
  } {
    // Default medium relevance
    let relevance = this.config.personalization.defaultInterestLevel;
    
    // Get user interests if available
    const userInterests = this.userInterests.get(userId);
    if (userInterests) {
      // Check interest in this entity
      const entityKey = `${event.entityType}-${event.entityId}`;
      if (userInterests.has(entityKey)) {
        relevance = userInterests.get(entityKey)!;
      }
      
      // Check interest in this entity type
      else if (userInterests.has(event.entityType)) {
        relevance = userInterests.get(event.entityType)!;
      }
      
      // Check interest in this event type
      else if (userInterests.has(event.eventType)) {
        relevance = userInterests.get(event.eventType)!;
      }
    }
    
    // Portfolio items get a boost
    if (event.data?.inUserPortfolio && this.config.personalization.portfolioRelevanceWeight > 0) {
      relevance = relevance * (1 - this.config.personalization.portfolioRelevanceWeight) + 
                 1 * this.config.personalization.portfolioRelevanceWeight;
    }
    
    return { relevance };
  }
  
  /**
   * Check if the user has reached their notification frequency limit
   */
  private checkNotificationFrequencyLimit(userId: string): boolean {
    // Reset notification counts if a day has passed
    this.checkAndResetNotificationCounts();
    
    // Get current count
    const count = this.userNotificationCounts.get(userId) || 0;
    
    // Check if limit reached
    if (count >= this.config.personalization.maxNotificationsPerDay) {
      return false;
    }
    
    // Increment count
    this.userNotificationCounts.set(userId, count + 1);
    return true;
  }
  
  /**
   * Check if a day has passed and reset notification counts if needed
   */
  private checkAndResetNotificationCounts(): void {
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (now - this.lastResetTime >= oneDayInMs) {
      this.userNotificationCounts.clear();
      this.lastResetTime = now;
    }
  }
  
  /**
   * Set user interest level for an entity, entity type, or event type
   * 
   * @param userId User ID
   * @param key Interest key (entity ID, entity type, or event type)
   * @param interestLevel Interest level (0-1)
   */
  public setUserInterest(userId: string, key: string, interestLevel: number): void {
    if (!this.userInterests.has(userId)) {
      this.userInterests.set(userId, new Map());
    }
    
    const interests = this.userInterests.get(userId)!;
    interests.set(key, Math.max(0, Math.min(1, interestLevel)));
  }
  
  /**
   * Get user interest level for an entity, entity type, or event type
   * 
   * @param userId User ID
   * @param key Interest key (entity ID, entity type, or event type)
   * @returns Interest level (0-1) or default if not set
   */
  public getUserInterest(userId: string, key: string): number {
    const interests = this.userInterests.get(userId);
    if (!interests || !interests.has(key)) {
      return this.config.personalization.defaultInterestLevel;
    }
    
    return interests.get(key)!;
  }
}
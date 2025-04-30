/**
 * SuccessMetricsMonitor.ts
 * 
 * Implements a monitoring system for tracking the success metrics specified
 * in the technical considerations. This component collects, analyzes, and
 * reports on key performance indicators to ensure the trust score engine
 * meets its performance and accuracy requirements.
 */

import { TrustScoreTypes } from '../types';
import { PerformanceMetrics } from '../performance/PerformanceOptimizer';

/**
 * Success metrics configuration
 */
export interface SuccessMetricsConfig {
  // Accuracy validation configuration
  accuracyValidation: {
    // Target agreement percentage with expert assessments
    targetAgreementPercentage: number;
    // Frequency of accuracy validation in days
    validationFrequencyDays: number;
    // Minimum number of samples for validation
    minimumSampleSize: number;
  };
  // Performance targets configuration
  performanceTargets: {
    // Maximum update latency in milliseconds
    maxUpdateLatencyMs: number;
    // Maximum API response time in milliseconds
    maxApiResponseTimeMs: number;
    // Target concurrent request capacity
    targetConcurrentRequests: number;
  };
  // User feedback configuration
  userFeedback: {
    // Target usefulness rating (out of 5)
    targetUsefulnessRating: number;
    // Minimum number of ratings to consider
    minimumRatingsRequired: number;
  };
  // Proactive detection configuration
  proactiveDetection: {
    // Whether to enable proactive detection of problematic NFTs
    enabled: boolean;
    // Confidence threshold for flagging
    confidenceThreshold: number;
    // Minimum risk score for flagging
    minimumRiskScore: number;
  };
}

/**
 * Success metrics report
 */
export interface SuccessMetricsReport {
  // Timestamp of the report
  timestamp: string;
  // Accuracy metrics
  accuracy: {
    // Agreement percentage with expert assessments
    expertAgreementPercentage: number;
    // Number of samples evaluated
    sampleSize: number;
    // Whether the target is met
    targetMet: boolean;
  };
  // Performance metrics
  performance: {
    // Average update latency in milliseconds
    averageUpdateLatencyMs: number;
    // 95th percentile update latency in milliseconds
    p95UpdateLatencyMs: number;
    // Average API response time in milliseconds
    averageApiResponseTimeMs: number;
    // 95th percentile API response time in milliseconds
    p95ApiResponseTimeMs: number;
    // Maximum concurrent requests handled
    maxConcurrentRequests: number;
    // Whether all targets are met
    allTargetsMet: boolean;
  };
  // User feedback metrics
  userFeedback: {
    // Average usefulness rating (out of 5)
    averageUsefulnessRating: number;
    // Number of ratings received
    ratingCount: number;
    // Whether the target is met
    targetMet: boolean;
  };
  // Proactive detection metrics
  proactiveDetection: {
    // Number of problematic NFTs detected before public awareness
    proactiveDetectionCount: number;
    // Average lead time in days
    averageLeadTimeDays: number;
    // Detection success rate
    detectionSuccessRate: number;
  };
}

/**
 * Expert assessment for accuracy validation
 */
interface ExpertAssessment {
  nftId: string;
  expertScore: number;
  expertConfidence: number;
  assessmentDate: string;
  expertId: string;
}

/**
 * User feedback for usefulness rating
 */
interface UserFeedback {
  userId: string;
  nftId?: string;
  creatorId?: string;
  collectionId?: string;
  usefulnessRating: number; // 1-5
  comments?: string;
  feedbackDate: string;
}

/**
 * Problematic NFT detection record
 */
interface ProblematicNFTDetection {
  nftId: string;
  detectionDate: string;
  publicAwarenessDate?: string;
  issueType: string;
  trustScore: number;
  riskScore: number;
  confidence: number;
}

/**
 * Success metrics monitor for tracking and reporting on key performance indicators
 */
export class SuccessMetricsMonitor {
  private config: SuccessMetricsConfig;
  private expertAssessments: ExpertAssessment[];
  private updateLatencies: number[];
  private apiResponseTimes: number[];
  private concurrentRequestCounts: number[];
  private userFeedbacks: UserFeedback[];
  private problematicNFTDetections: ProblematicNFTDetection[];
  private lastReportTimestamp?: string;
  
  /**
   * Initialize the success metrics monitor with configuration
   * 
   * @param config Configuration options for success metrics
   */
  constructor(config?: Partial<SuccessMetricsConfig>) {
    // Default configuration
    this.config = {
      accuracyValidation: {
        targetAgreementPercentage: 90, // 90% agreement target
        validationFrequencyDays: 30, // Monthly validation
        minimumSampleSize: 100 // At least 100 samples
      },
      performanceTargets: {
        maxUpdateLatencyMs: 30000, // 30 seconds
        maxApiResponseTimeMs: 200, // 200 milliseconds
        targetConcurrentRequests: 1000 // 1000 concurrent requests
      },
      userFeedback: {
        targetUsefulnessRating: 4.5, // 4.5/5 target
        minimumRatingsRequired: 50 // At least 50 ratings
      },
      proactiveDetection: {
        enabled: true,
        confidenceThreshold: 0.7, // 70% confidence
        minimumRiskScore: 0.8 // 80% risk score
      },
      ...config
    };
    
    // Initialize data structures
    this.expertAssessments = [];
    this.updateLatencies = [];
    this.apiResponseTimes = [];
    this.concurrentRequestCounts = [];
    this.userFeedbacks = [];
    this.problematicNFTDetections = [];
  }
  
  /**
   * Record an expert assessment for accuracy validation
   * 
   * @param assessment Expert assessment
   */
  public recordExpertAssessment(assessment: ExpertAssessment): void {
    this.expertAssessments.push(assessment);
    console.log(`Recorded expert assessment for NFT ${assessment.nftId} with score ${assessment.expertScore}`);
  }
  
  /**
   * Record an update latency measurement
   * 
   * @param latencyMs Update latency in milliseconds
   */
  public recordUpdateLatency(latencyMs: number): void {
    this.updateLatencies.push(latencyMs);
    
    // Keep only the last 1000 measurements
    if (this.updateLatencies.length > 1000) {
      this.updateLatencies.shift();
    }
    
    // Log warning if latency exceeds target
    if (latencyMs > this.config.performanceTargets.maxUpdateLatencyMs) {
      console.warn(`Update latency of ${latencyMs}ms exceeds target of ${this.config.performanceTargets.maxUpdateLatencyMs}ms`);
    }
  }
  
  /**
   * Record an API response time measurement
   * 
   * @param responseTimeMs API response time in milliseconds
   */
  public recordApiResponseTime(responseTimeMs: number): void {
    this.apiResponseTimes.push(responseTimeMs);
    
    // Keep only the last 10000 measurements
    if (this.apiResponseTimes.length > 10000) {
      this.apiResponseTimes.shift();
    }
    
    // Log warning if response time exceeds target
    if (responseTimeMs > this.config.performanceTargets.maxApiResponseTimeMs) {
      console.warn(`API response time of ${responseTimeMs}ms exceeds target of ${this.config.performanceTargets.maxApiResponseTimeMs}ms`);
    }
  }
  
  /**
   * Record a concurrent request count measurement
   * 
   * @param concurrentRequests Number of concurrent requests
   */
  public recordConcurrentRequests(concurrentRequests: number): void {
    this.concurrentRequestCounts.push(concurrentRequests);
    
    // Keep only the last 1000 measurements
    if (this.concurrentRequestCounts.length > 1000) {
      this.concurrentRequestCounts.shift();
    }
  }
  
  /**
   * Record user feedback
   * 
   * @param feedback User feedback
   */
  public recordUserFeedback(feedback: UserFeedback): void {
    this.userFeedbacks.push(feedback);
    console.log(`Recorded user feedback with usefulness rating ${feedback.usefulnessRating}/5`);
    
    // Calculate current average rating
    const averageRating = this.calculateAverageUsefulnessRating();
    
    // Log warning if average rating falls below target
    if (this.userFeedbacks.length >= this.config.userFeedback.minimumRatingsRequired && 
        averageRating < this.config.userFeedback.targetUsefulnessRating) {
      console.warn(`Average usefulness rating of ${averageRating.toFixed(2)}/5 is below target of ${this.config.userFeedback.targetUsefulnessRating}/5`);
    }
  }
  
  /**
   * Record a problematic NFT detection
   * 
   * @param detection Problematic NFT detection
   */
  public recordProblematicNFTDetection(detection: ProblematicNFTDetection): void {
    this.problematicNFTDetections.push(detection);
    console.log(`Recorded problematic NFT detection for NFT ${detection.nftId} (${detection.issueType})`);
  }
  
  /**
   * Update a problematic NFT detection with public awareness date
   * 
   * @param nftId NFT ID
   * @param publicAwarenessDate Date when the issue became publicly known
   */
  public updateProblematicNFTDetection(nftId: string, publicAwarenessDate: string): void {
    const detection = this.problematicNFTDetections.find(d => d.nftId === nftId);
    
    if (detection) {
      detection.publicAwarenessDate = publicAwarenessDate;
      
      // Calculate lead time in days
      const detectionDate = new Date(detection.detectionDate);
      const awarenessDate = new Date(publicAwarenessDate);
      const leadTimeDays = (awarenessDate.getTime() - detectionDate.getTime()) / (1000 * 60 * 60 * 24);
      
      console.log(`Updated problematic NFT detection for NFT ${nftId} with lead time of ${leadTimeDays.toFixed(1)} days`);
    }
  }
  
  /**
   * Generate a success metrics report
   * 
   * @returns Success metrics report
   */
  public generateReport(): SuccessMetricsReport {
    const now = new Date();
    
    // Calculate accuracy metrics
    const accuracyMetrics = this.calculateAccuracyMetrics();
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics();
    
    // Calculate user feedback metrics
    const userFeedbackMetrics = this.calculateUserFeedbackMetrics();
    
    // Calculate proactive detection metrics
    const proactiveDetectionMetrics = this.calculateProactiveDetectionMetrics();
    
    // Create report
    const report: SuccessMetricsReport = {
      timestamp: now.toISOString(),
      accuracy: accuracyMetrics,
      performance: performanceMetrics,
      userFeedback: userFeedbackMetrics,
      proactiveDetection: proactiveDetectionMetrics
    };
    
    // Update last report timestamp
    this.lastReportTimestamp = now.toISOString();
    
    // Log report summary
    console.log('Success Metrics Report Summary:');
    console.log(`- Accuracy: ${accuracyMetrics.expertAgreementPercentage.toFixed(1)}% agreement (target: ${this.config.accuracyValidation.targetAgreementPercentage}%)`);
    console.log(`- Performance: Avg API response time ${performanceMetrics.averageApiResponseTimeMs.toFixed(1)}ms (target: ${this.config.performanceTargets.maxApiResponseTimeMs}ms)`);
    console.log(`- User Feedback: ${userFeedbackMetrics.averageUsefulnessRating.toFixed(2)}/5 from ${userFeedbackMetrics.ratingCount} ratings (target: ${this.config.userFeedback.targetUsefulnessRating}/5)`);
    console.log(`- Proactive Detection: ${proactiveDetectionMetrics.proactiveDetectionCount} NFTs detected with ${proactiveDetectionMetrics.averageLeadTimeDays.toFixed(1)} days average lead time`);
    
    return report;
  }
  
  /**
   * Calculate accuracy metrics
   * 
   * @returns Accuracy metrics
   */
  private calculateAccuracyMetrics(): SuccessMetricsReport['accuracy'] {
    // Filter assessments to those within the validation frequency period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.accuracyValidation.validationFrequencyDays);
    
    const recentAssessments = this.expertAssessments.filter(
      assessment => new Date(assessment.assessmentDate) >= cutoffDate
    );
    
    // Calculate agreement percentage
    let agreementCount = 0;
    
    for (const assessment of recentAssessments) {
      // In a real implementation, this would compare the expert score with the system score
      // This is a placeholder implementation
      const systemScore = 85; // Placeholder
      const difference = Math.abs(assessment.expertScore - systemScore);
      
      // Consider scores within 10 points as in agreement
      if (difference <= 10) {
        agreementCount++;
      }
    }
    
    const agreementPercentage = recentAssessments.length > 0 ?
      (agreementCount / recentAssessments.length) * 100 : 0;
    
    return {
      expertAgreementPercentage: agreementPercentage,
      sampleSize: recentAssessments.length,
      targetMet: agreementPercentage >= this.config.accuracyValidation.targetAgreementPercentage &&
                recentAssessments.length >= this.config.accuracyValidation.minimumSampleSize
    };
  }
  
  /**
   * Calculate performance metrics
   * 
   * @returns Performance metrics
   */
  private calculatePerformanceMetrics(): SuccessMetricsReport['performance'] {
    // Calculate update latency metrics
    const averageUpdateLatencyMs = this.calculateAverage(this.updateLatencies);
    const p95UpdateLatencyMs = this.calculatePercentile(this.updateLatencies, 95);
    
    // Calculate API response time metrics
    const averageApiResponseTimeMs = this.calculateAverage(this.apiResponseTimes);
    const p95ApiResponseTimeMs = this.calculatePercentile(this.apiResponseTimes, 95);
    
    // Calculate concurrent request metrics
    const maxConcurrentRequests = this.concurrentRequestCounts.length > 0 ?
      Math.max(...this.concurrentRequestCounts) : 0;
    
    // Check if all targets are met
    const updateLatencyTargetMet = p95UpdateLatencyMs <= this.config.performanceTargets.maxUpdateLatencyMs;
    const apiResponseTimeTargetMet = p95ApiResponseTimeMs <= this.config.performanceTargets.maxApiResponseTimeMs;
    const concurrentRequestsTargetMet = maxConcurrentRequests >= this.config.performanceTargets.targetConcurrentRequests;
    
    return {
      averageUpdateLatencyMs,
      p95UpdateLatencyMs,
      averageApiResponseTimeMs,
      p95ApiResponseTimeMs,
      maxConcurrentRequests,
      allTargetsMet: updateLatencyTargetMet && apiResponseTimeTargetMet && concurrentRequestsTargetMet
    };
  }
  
  /**
   * Calculate user feedback metrics
   * 
   * @returns User feedback metrics
   */
  private calculateUserFeedbackMetrics(): SuccessMetricsReport['userFeedback'] {
    const averageRating = this.calculateAverageUsefulnessRating();
    const ratingCount = this.userFeedbacks.length;
    
    return {
      averageUsefulnessRating: averageRating,
      ratingCount,
      targetMet: averageRating >= this.config.userFeedback.targetUsefulnessRating &&
                ratingCount >= this.config.userFeedback.minimumRatingsRequired
    };
  }
  
  /**
   * Calculate proactive detection metrics
   * 
   * @returns Proactive detection metrics
   */
  private calculateProactiveDetectionMetrics(): SuccessMetricsReport['proactiveDetection'] {
    // Count detections with public awareness date
    const detectionsWithPublicAwareness = this.problematicNFTDetections.filter(
      detection => detection.publicAwarenessDate
    );
    
    // Calculate lead times
    const leadTimes: number[] = [];
    
    for (const detection of detectionsWithPublicAwareness) {
      const detectionDate = new Date(detection.detectionDate);
      const awarenessDate = new Date(detection.publicAwarenessDate!);
      
      // Calculate lead time in days
      const leadTimeDays = (awarenessDate.getTime() - detectionDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Only count positive lead times (detected before public awareness)
      if (leadTimeDays > 0) {
        leadTimes.push(leadTimeDays);
      }
    }
    
    // Calculate success rate
    const successfulDetections = leadTimes.length;
    const successRate = detectionsWithPublicAwareness.length > 0 ?
      successfulDetections / detectionsWithPublicAwareness.length : 0;
    
    return {
      proactiveDetectionCount: successfulDetections,
      averageLeadTimeDays: this.calculateAverage(leadTimes),
      detectionSuccessRate: successRate
    };
  }
  
  /**
   * Calculate the average usefulness rating
   * 
   * @returns Average usefulness rating
   */
  private calculateAverageUsefulnessRating(): number {
    if (this.userFeedbacks.length === 0) {
      return 0;
    }
    
    const sum = this.userFeedbacks.reduce((total, feedback) => total + feedback.usefulnessRating, 0);
    return sum / this.userFeedbacks.length;
  }
  
  /**
   * Calculate the average of an array of numbers
   * 
   * @param values Array of numbers
   * @returns Average value
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    
    const sum = values.reduce((total, value) => total + value, 0);
    return sum / values.length;
  }
  
  /**
   * Calculate a percentile of an array of numbers
   * 
   * @param values Array of numbers
   * @param percentile Percentile to calculate (0-100)
   * @returns Percentile value
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }
    
    // Sort values
    const sorted = [...values].sort((a, b) => a - b);
    
    // Calculate index
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[index];
  }
  
  /**
   * Check if all success metrics targets are being met
   * 
   * @returns Whether all targets are being met
   */
  public areAllTargetsMet(): boolean {
    const report = this.generateReport();
    
    return report.accuracy.targetMet &&
           report.performance.allTargetsMet &&
           report.userFeedback.targetMet;
  }
  
  /**
   * Get metrics that are not meeting targets
   * 
   * @returns Array of metrics not meeting targets
   */
  public getUnmetTargets(): string[] {
    const report = this.generateReport();
    const unmetTargets: string[] = [];
    
    if (!report.accuracy.targetMet) {
      unmetTargets.push(`Accuracy: ${report.accuracy.expertAgreementPercentage.toFixed(1)}% (target: ${this.config.accuracyValidation.targetAgreementPercentage}%)`);
    }
    
    if (report.performance.p95UpdateLatencyMs > this.config.performanceTargets.maxUpdateLatencyMs) {
      unmetTargets.push(`Update Latency: ${report.performance.p95UpdateLatencyMs.toFixed(1)}ms (target: ${this.config.performanceTargets.maxUpdateLatencyMs}ms)`);
    }
    
    if (report.performance.p95ApiResponseTimeMs > this.config.performanceTargets.maxApiResponseTimeMs) {
      unmetTargets.push(`API Response Time: ${report.performance.p95ApiResponseTimeMs.toFixed(1)}ms (target: ${this.config.performanceTargets.maxApiResponseTimeMs}ms)`);
    }
    
    if (report.performance.maxConcurrentRequests < this.config.performanceTargets.targetConcurrentRequests) {
      unmetTargets.push(`Concurrent Requests: ${report.performance.maxConcurrentRequests} (target: ${this.config.performanceTargets.targetConcurrentRequests})`);
    }
    
    if (!report.userFeedback.targetMet) {
      unmetTargets.push(`User Feedback: ${report.userFeedback.averageUsefulnessRating.toFixed(2)}/5 (target: ${this.config.userFeedback.targetUsefulnessRating}/5)`);
    }
    
    return unmetTargets;
  }
}
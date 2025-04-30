/**
 * NotificationGenerator.ts
 * 
 * Implements the Notification Generation component of the Real-Time Update System.
 * Responsible for detecting significant changes, creating personalized notification
 * thresholds, generating natural language change descriptions, and determining
 * notification priority and delivery channels.
 */

import { TrustScoreTypes } from '../types';
import { IncrementalUpdateManager } from '../updates/IncrementalUpdateManager';

/**
 * Configuration for notification generation
 */
export interface NotificationConfig {
  // Default threshold for considering a change significant enough for notification (0-1)
  defaultSignificanceThreshold: number;
  // Maximum number of notifications to generate per entity per day
  maxNotificationsPerDay: number;
  // Whether to enable personalized notification thresholds
  enablePersonalization: boolean;
  // Default notification channels to use
  defaultChannels: string[];
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  // User-specific threshold for considering a change significant (0-1)
  significanceThreshold: number;
  // Factors the user is interested in receiving notifications for
  interestedFactors: string[];
  // Risk levels the user is interested in receiving notifications for
  interestedRiskLevels: ('low' | 'medium' | 'high')[];
  // Preferred notification channels
  preferredChannels: string[];
  // Whether to receive notifications for positive changes
  notifyPositiveChanges: boolean;
  // Whether to receive notifications for negative changes
  notifyNegativeChanges: boolean;
}

/**
 * Notification object representing a change that should be communicated to users
 */
export interface Notification {
  id: string;
  entityId: string;
  entityType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  changeType: 'positive' | 'negative' | 'neutral';
  factorKey?: string;
  riskDimension?: string;
  scoreChange?: number;
  channels: string[];
  data?: Record<string, any>;
}

/**
 * Responsible for generating notifications based on significant changes
 * in trust scores and risk assessments.
 */
export class NotificationGenerator {
  private incrementalUpdateManager: IncrementalUpdateManager;
  private config: NotificationConfig;
  private userPreferences: Map<string, NotificationPreferences>;
  private notificationHistory: Map<string, Notification[]>;
  private lastNotificationTimes: Map<string, Map<string, number>>;
  
  /**
   * Initialize the Notification Generator
   * 
   * @param incrementalUpdateManager Reference to the incremental update manager
   * @param config Configuration for notification generation
   */
  constructor(
    incrementalUpdateManager: IncrementalUpdateManager,
    config: NotificationConfig = {
      defaultSignificanceThreshold: 0.1, // 10% change is significant by default
      maxNotificationsPerDay: 5,
      enablePersonalization: true,
      defaultChannels: ['email', 'app']
    }
  ) {
    this.incrementalUpdateManager = incrementalUpdateManager;
    this.config = config;
    this.userPreferences = new Map<string, NotificationPreferences>();
    this.notificationHistory = new Map<string, Notification[]>();
    this.lastNotificationTimes = new Map<string, Map<string, number>>();
  }
  
  /**
   * Set notification preferences for a user
   * 
   * @param userId The user ID
   * @param preferences The user's notification preferences
   */
  public setUserPreferences(userId: string, preferences: NotificationPreferences): void {
    this.userPreferences.set(userId, preferences);
  }
  
  /**
   * Check if a change is significant enough to generate a notification
   * 
   * @param oldScore The old trust score
   * @param newScore The new trust score
   * @param userId Optional user ID for personalized threshold
   * @returns Whether the change is significant
   */
  public isChangeSignificant(
    oldScore: TrustScoreTypes.NFTTrustScore | TrustScoreTypes.FactorScore,
    newScore: TrustScoreTypes.NFTTrustScore | TrustScoreTypes.FactorScore,
    userId?: string
  ): boolean {
    // Get the appropriate threshold
    let threshold = this.config.defaultSignificanceThreshold;
    
    // If personalization is enabled and user ID is provided, use personalized threshold
    if (this.config.enablePersonalization && userId) {
      const preferences = this.userPreferences.get(userId);
      if (preferences) {
        threshold = preferences.significanceThreshold;
      }
    }
    
    // For factor scores, use the incremental update manager's significance check
    if ('redFlags' in oldScore && 'redFlags' in newScore) {
      return this.incrementalUpdateManager.isChangeSignificant(
        oldScore as TrustScoreTypes.FactorScore,
        newScore as TrustScoreTypes.FactorScore
      );
    }
    
    // For trust scores, check the overall score change
    const scoreDiff = Math.abs(newScore.score - oldScore.score);
    const percentageChange = scoreDiff / 100; // Scores are 0-100
    
    if (percentageChange >= threshold) {
      return true;
    }
    
    // Check if confidence changed significantly
    const confidenceDiff = Math.abs(newScore.confidence - oldScore.confidence);
    if (confidenceDiff >= threshold) {
      return true;
    }
    
    // For NFT trust scores, check if any factor scores changed significantly
    if ('factorScores' in oldScore && 'factorScores' in newScore) {
      const oldFactors = (oldScore as TrustScoreTypes.NFTTrustScore).factorScores;
      const newFactors = (newScore as TrustScoreTypes.NFTTrustScore).factorScores;
      
      for (const [factorKey, newFactorScore] of newFactors.entries()) {
        const oldFactorScore = oldFactors.get(factorKey);
        if (oldFactorScore) {
          if (this.incrementalUpdateManager.isChangeSignificant(oldFactorScore, newFactorScore)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Generate notifications for a trust score change
   * 
   * @param entityId The entity ID
   * @param entityType The entity type (nft, creator, collection)
   * @param oldScore The old trust score
   * @param newScore The new trust score
   * @param userIds Optional array of user IDs to generate notifications for
   * @returns Array of generated notifications
   */
  public generateScoreChangeNotifications(
    entityId: string,
    entityType: string,
    oldScore: TrustScoreTypes.NFTTrustScore | TrustScoreTypes.CreatorTrustScore | TrustScoreTypes.CollectionTrustScore,
    newScore: TrustScoreTypes.NFTTrustScore | TrustScoreTypes.CreatorTrustScore | TrustScoreTypes.CollectionTrustScore,
    userIds?: string[]
  ): Notification[] {
    const notifications: Notification[] = [];
    
    // Check if the change is significant
    if (!this.isChangeSignificant(oldScore, newScore)) {
      return notifications;
    }
    
    // Determine if this is a positive or negative change
    const changeType: 'positive' | 'negative' | 'neutral' = 
      newScore.score > oldScore.score ? 'positive' : 
      newScore.score < oldScore.score ? 'negative' : 'neutral';
    
    // Generate a base notification
    const baseNotification: Notification = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityId,
      entityType,
      title: this.generateNotificationTitle(entityType, changeType),
      description: this.generateScoreChangeDescription(entityType, oldScore.score, newScore.score),
      priority: this.determineNotificationPriority(oldScore.score, newScore.score),
      timestamp: new Date().toISOString(),
      changeType,
      scoreChange: newScore.score - oldScore.score,
      channels: this.config.defaultChannels,
      data: {
        oldScore: oldScore.score,
        newScore: newScore.score,
        oldConfidence: oldScore.confidence,
        newConfidence: newScore.confidence
      }
    };
    
    // If no user IDs are provided, create a generic notification
    if (!userIds || userIds.length === 0) {
      notifications.push(baseNotification);
      return notifications;
    }
    
    // Generate personalized notifications for each user
    for (const userId of userIds) {
      const preferences = this.userPreferences.get(userId);
      
      // Skip if user doesn't want this type of notification
      if (preferences) {
        if (changeType === 'positive' && !preferences.notifyPositiveChanges) continue;
        if (changeType === 'negative' && !preferences.notifyNegativeChanges) continue;
      }
      
      // Check if we've sent too many notifications to this user today
      if (this.hasReachedDailyLimit(userId, entityId)) continue;
      
      // Create a personalized notification
      const personalizedNotification: Notification = {
        ...baseNotification,
        id: `${baseNotification.id}_${userId}`,
        channels: preferences ? preferences.preferredChannels : baseNotification.channels
      };
      
      notifications.push(personalizedNotification);
      
      // Update notification history
      this.recordNotification(userId, personalizedNotification);
    }
    
    return notifications;
  }
  
  /**
   * Generate notifications for a risk assessment change
   * 
   * @param entityId The entity ID
   * @param entityType The entity type (nft, creator, collection)
   * @param oldAssessment The old risk assessment
   * @param newAssessment The new risk assessment
   * @param userIds Optional array of user IDs to generate notifications for
   * @returns Array of generated notifications
   */
  public generateRiskChangeNotifications(
    entityId: string,
    entityType: string,
    oldAssessment: TrustScoreTypes.RiskAssessment,
    newAssessment: TrustScoreTypes.RiskAssessment,
    userIds?: string[]
  ): Notification[] {
    const notifications: Notification[] = [];
    
    // Check if the overall risk level changed
    const overallRiskChanged = oldAssessment.overallRiskLevel !== newAssessment.overallRiskLevel;
    
    // Check if any risk dimensions changed significantly
    const changedDimensions: string[] = [];
    for (const [dimensionKey, newDimension] of newAssessment.riskDimensions.entries()) {
      const oldDimension = oldAssessment.riskDimensions.get(dimensionKey);
      if (oldDimension && oldDimension.level !== newDimension.level) {
        changedDimensions.push(dimensionKey);
      }
    }
    
    // If nothing significant changed, return empty array
    if (!overallRiskChanged && changedDimensions.length === 0) {
      return notifications;
    }
    
    // Determine if this is a positive or negative change
    let changeType: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (overallRiskChanged) {
      const riskLevels = ['low', 'medium', 'high'];
      const oldIndex = riskLevels.indexOf(oldAssessment.overallRiskLevel);
      const newIndex = riskLevels.indexOf(newAssessment.overallRiskLevel);
      
      changeType = newIndex < oldIndex ? 'positive' : 'negative';
    }
    
    // Generate a base notification for overall risk change
    if (overallRiskChanged) {
      const baseNotification: Notification = {
        id: `${entityType}_${entityId}_risk_${Date.now()}`,
        entityId,
        entityType,
        title: this.generateRiskNotificationTitle(entityType, changeType),
        description: this.generateRiskChangeDescription(entityType, oldAssessment.overallRiskLevel, newAssessment.overallRiskLevel),
        priority: this.determineRiskNotificationPriority(oldAssessment.overallRiskLevel, newAssessment.overallRiskLevel),
        timestamp: new Date().toISOString(),
        changeType,
        channels: this.config.defaultChannels,
        data: {
          oldRiskLevel: oldAssessment.overallRiskLevel,
          newRiskLevel: newAssessment.overallRiskLevel
        }
      };
      
      // If no user IDs are provided, create a generic notification
      if (!userIds || userIds.length === 0) {
        notifications.push(baseNotification);
      } else {
        // Generate personalized notifications for each user
        for (const userId of userIds) {
          const preferences = this.userPreferences.get(userId);
          
          // Skip if user doesn't want this type of notification
          if (preferences) {
            if (changeType === 'positive' && !preferences.notifyPositiveChanges) continue;
            if (changeType === 'negative' && !preferences.notifyNegativeChanges) continue;
            
            // Skip if user isn't interested in this risk level
            if (!preferences.interestedRiskLevels.includes(newAssessment.overallRiskLevel)) continue;
          }
          
          // Check if we've sent too many notifications to this user today
          if (this.hasReachedDailyLimit(userId, entityId)) continue;
          
          // Create a personalized notification
          const personalizedNotification: Notification = {
            ...baseNotification,
            id: `${baseNotification.id}_${userId}`,
            channels: preferences ? preferences.preferredChannels : baseNotification.channels
          };
          
          notifications.push(personalizedNotification);
          
          // Update notification history
          this.recordNotification(userId, personalizedNotification);
        }
      }
    }
    
    // Generate notifications for each changed risk dimension
    for (const dimensionKey of changedDimensions) {
      const oldDimension = oldAssessment.riskDimensions.get(dimensionKey)!;
      const newDimension = newAssessment.riskDimensions.get(dimensionKey)!;
      
      // Determine if this is a positive or negative change
      const riskLevels = ['low', 'medium', 'high'];
      const oldIndex = riskLevels.indexOf(oldDimension.level);
      const newIndex = riskLevels.indexOf(newDimension.level);
      
      const dimensionChangeType: 'positive' | 'negative' | 'neutral' = 
        newIndex < oldIndex ? 'positive' : 
        newIndex > oldIndex ? 'negative' : 'neutral';
      
      // Skip neutral changes
      if (dimensionChangeType === 'neutral') continue;
      
      const dimensionNotification: Notification = {
        id: `${entityType}_${entityId}_risk_${dimensionKey}_${Date.now()}`,
        entityId,
        entityType,
        title: this.generateRiskDimensionNotificationTitle(entityType, dimensionKey, dimensionChangeType),
        description: this.generateRiskDimensionChangeDescription(entityType, dimensionKey, oldDimension.level, newDimension.level),
        priority: this.determineRiskNotificationPriority(oldDimension.level, newDimension.level),
        timestamp: new Date().toISOString(),
        changeType: dimensionChangeType,
        riskDimension: dimensionKey,
        channels: this.config.defaultChannels,
        data: {
          oldRiskLevel: oldDimension.level,
          newRiskLevel: newDimension.level,
          dimensionName: newDimension.name
        }
      };
      
      // If no user IDs are provided, create a generic notification
      if (!userIds || userIds.length === 0) {
        notifications.push(dimensionNotification);
      } else {
        // Generate personalized notifications for each user
        for (const userId of userIds) {
          const preferences = this.userPreferences.get(userId);
          
          // Skip if user doesn't want this type of notification
          if (preferences) {
            if (dimensionChangeType === 'positive' && !preferences.notifyPositiveChanges) continue;
            if (dimensionChangeType === 'negative' && !preferences.notifyNegativeChanges) continue;
            
            // Skip if user isn't interested in this risk level
            if (!preferences.interestedRiskLevels.includes(newDimension.level)) continue;
          }
          
          // Check if we've sent too many notifications to this user today
          if (this.hasReachedDailyLimit(userId, entityId)) continue;
          
          // Create a personalized notification
          const personalizedNotification: Notification = {
            ...dimensionNotification,
            id: `${dimensionNotification.id}_${userId}`,
            channels: preferences ? preferences.preferredChannels : dimensionNotification.channels
          };
          
          notifications.push(personalizedNotification);
          
          // Update notification history
          this.recordNotification(userId, personalizedNotification);
        }
      }
    }
    
    return notifications;
  }
  
  /**
   * Generate a notification title for score changes
   * 
   * @param entityType The entity type
   * @param changeType The type of change
   * @returns Notification title
   */
  private generateNotificationTitle(
    entityType: string,
    changeType: 'positive' | 'negative' | 'neutral'
  ): string {
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    if (changeType === 'positive') {
      return `${entityName} Trust Score Improved`;
    } else if (changeType === 'negative') {
      return `${entityName} Trust Score Decreased`;
    } else {
      return `${entityName} Trust Score Updated`;
    }
  }
  
  /**
   * Generate a notification title for risk changes
   * 
   * @param entityType The entity type
   * @param changeType The type of change
   * @returns Notification title
   */
  private generateRiskNotificationTitle(
    entityType: string,
    changeType: 'positive' | 'negative' | 'neutral'
  ): string {
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    if (changeType === 'positive') {
      return `${entityName} Risk Level Decreased`;
    } else if (changeType === 'negative') {
      return `${entityName} Risk Level Increased`;
    } else {
      return `${entityName} Risk Assessment Updated`;
    }
  }
  
  /**
   * Generate a notification title for risk dimension changes
   * 
   * @param entityType The entity type
   * @param dimensionKey The risk dimension key
   * @param changeType The type of change
   * @returns Notification title
   */
  private generateRiskDimensionNotificationTitle(
    entityType: string,
    dimensionKey: string,
    changeType: 'positive' | 'negative' | 'neutral'
  ): string {
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    const dimensionName = dimensionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (changeType === 'positive') {
      return `${entityName} ${dimensionName} Risk Decreased`;
    } else if (changeType === 'negative') {
      return `${entityName} ${dimensionName} Risk Increased`;
    } else {
      return `${entityName} ${dimensionName} Risk Updated`;
    }
  }
  
  /**
   * Generate a description for score changes
   * 
   * @param entityType The entity type
   * @param oldScore The old score
   * @param newScore The new score
   * @returns Description of the change
   */
  private generateScoreChangeDescription(
    entityType: string,
    oldScore: number,
    newScore: number
  ): string {
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    const scoreDiff = Math.abs(newScore - oldScore).toFixed(1);
    
    if (newScore > oldScore) {
      return `The ${entityName} trust score has improved by ${scoreDiff} points, from ${oldScore.toFixed(1)} to ${newScore.toFixed(1)}.`;
    } else if (newScore < oldScore) {
      return `The ${entityName} trust score has decreased by ${scoreDiff} points, from ${oldScore.toFixed(1)} to ${newScore.toFixed(1)}.`;
    } else {
      return `The ${entityName} trust score has been updated but remains at ${newScore.toFixed(1)}.`;
    }
  }
  
  /**
   * Generate a description for risk changes
   * 
   * @param entityType The entity type
   * @param oldLevel The old risk level
   * @param newLevel The new risk level
   * @returns Description of the change
   */
  private generateRiskChangeDescription(
    entityType: string,
    oldLevel: 'low' | 'medium' | 'high',
    newLevel: 'low' | 'medium' | 'high'
  ): string {
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    if (oldLevel === newLevel) {
      return `The ${entityName} risk assessment has been updated but remains at ${newLevel} risk.`;
    }
    
    return `The ${entityName} overall risk level has changed from ${oldLevel} to ${newLevel} risk.`;
  }
  
  /**
   * Generate a description for risk dimension changes
   * 
   * @param entityType The entity type
   * @param dimensionKey The risk dimension key
   * @param oldLevel The old risk level
   * @param newLevel The new risk level
   * @returns Description of the change
   */
  private generateRiskDimensionChangeDescription(
    entityType: string,
    dimensionKey: string,
    oldLevel: 'low' | 'medium' | 'high',
    newLevel: 'low' | 'medium' | 'high'
  ): string {
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    const dimensionName = dimensionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `The ${entityName} ${dimensionName} risk has changed from ${oldLevel} to ${newLevel}.`;
  }
  
  /**
   * Determine the priority of a score change notification
   * 
   * @param oldScore The old score
   * @param newScore The new score
   * @returns Notification priority
   */
  private determineNotificationPriority(
    oldScore: number,
    newScore: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const scoreDiff = Math.abs(newScore - oldScore);
    
    if (scoreDiff >= 20) {
      return newScore < oldScore ? 'critical' : 'high';
    } else if (scoreDiff >= 10) {
      return newScore < oldScore ? 'high' : 'medium';
    } else if (scoreDiff >= 5) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Determine the priority of a risk change notification
   * 
   * @param oldLevel The old risk level
   * @param newLevel The new risk level
   * @returns Notification priority
   */
  private determineRiskNotificationPriority(
    oldLevel: 'low' | 'medium' | 'high',
    newLevel: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskLevels = ['low', 'medium', 'high'];
    const oldIndex = riskLevels.indexOf(oldLevel);
    const newIndex = riskLevels.indexOf(newLevel);
    const levelDiff = Math.abs(newIndex - oldIndex);
    
    if (levelDiff === 0) {
      return 'low';
    } else if (levelDiff === 1) {
      return newIndex > oldIndex ? 'high' : 'medium';
    } else {
      return newIndex > oldIndex ? 'critical' : 'high';
    }
  }
  
  /**
   * Check if a user has reached their daily notification limit for an entity
   * 
   * @param userId The user ID
   * @param entityId The entity ID
   * @returns Whether the daily limit has been reached
   */
  private hasReachedDailyLimit(userId: string, entityId: string): boolean {
    // Get the user's notification history
    const userHistory = this.notificationHistory.get(userId);
    if (!userHistory) return false;
    
    // Count notifications for this entity in the last 24 hours
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentNotifications = userHistory.filter(notification => 
      notification.entityId === entityId &&
      new Date(notification.timestamp).getTime() > last24Hours
    );
    
    return recentNotifications.length >= this.config.maxNotificationsPerDay;
  }
  
  /**
   * Record a notification in the user's history
   * 
   * @param userId The user ID
   * @param notification The notification to record
   */
  private recordNotification(userId: string, notification: Notification): void {
    // Initialize the user's notification history if it doesn't exist
    if (!this.notificationHistory.has(userId)) {
      this.notificationHistory.set(userId, []);
    }
    
    // Add the notification to the history
    this.notificationHistory.get(userId)!.push(notification);
    
    // Initialize the last notification time map if it doesn't exist
    if (!this.lastNotificationTimes.has(userId)) {
      this.lastNotificationTimes.set(userId, new Map());
    }
    
    // Update the last notification time for this entity
    this.lastNotificationTimes.get(userId)!.set(
      notification.entityId,
      new Date(notification.timestamp).getTime()
    );
  }
}
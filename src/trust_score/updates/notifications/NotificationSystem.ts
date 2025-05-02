/**
 * NotificationSystem.ts
 * 
 * Implements the complete Notification Generation System by integrating all three components:
 * 1. Change Significance Detection - Detects significant changes that warrant notifications
 * 2. Notification Content Generation - Creates personalized, context-aware notification content
 * 3. Delivery Channel Management - Delivers notifications through appropriate channels
 */

import { TrustScoreTypes } from '../../types';
import { ChangeSignificanceDetector, SignificanceResult } from './ChangeSignificanceDetector';
import { NotificationContentGenerator, NotificationContent } from './NotificationContentGenerator';
import { DeliveryChannelManager, UserDeliveryPreferences } from './DeliveryChannelManager';
import { Notification } from './NotificationGenerator';

/**
 * Configuration for the notification system
 */
export interface NotificationSystemConfig {
  // Whether the notification system is enabled
  enabled: boolean;
  
  // Configuration for the change significance detector
  significanceDetection: {
    // Whether to enable significance detection
    enabled: boolean;
    // Minimum significance score to generate a notification (0-10)
    minimumSignificanceScore: number;
  };
  
  // Configuration for content generation
  contentGeneration: {
    // Whether to enable natural language generation
    enableNaturalLanguage: boolean;
    // Whether to include technical details
    includeTechnicalDetails: boolean;
    // Default language for notifications
    defaultLanguage: string;
  };
  
  // Configuration for delivery
  delivery: {
    // Whether to enable multi-channel delivery
    enableMultiChannel: boolean;
    // Whether to respect quiet hours
    respectQuietHours: boolean;
    // Whether to batch non-critical notifications
    batchNotifications: boolean;
  };
}

/**
 * Manages the complete notification generation process from detecting significant
 * changes to generating content and delivering notifications.
 */
export class NotificationSystem {
  private config: NotificationSystemConfig;
  private significanceDetector: ChangeSignificanceDetector;
  private contentGenerator: NotificationContentGenerator;
  private deliveryManager: DeliveryChannelManager;
  
  /**
   * Initialize the Notification System
   * 
   * @param config Configuration for the notification system
   */
  constructor(config: Partial<NotificationSystemConfig> = {}) {
    this.config = this.getDefaultConfig(config);
    
    // Initialize components
    this.significanceDetector = new ChangeSignificanceDetector();
    this.contentGenerator = new NotificationContentGenerator({
      enableNaturalLanguage: this.config.contentGeneration.enableNaturalLanguage,
      includeTechnicalDetails: this.config.contentGeneration.includeTechnicalDetails,
      localization: {
        defaultLanguage: this.config.contentGeneration.defaultLanguage
      }
    });
    this.deliveryManager = new DeliveryChannelManager({
      deliveryTiming: {
        respectQuietHours: this.config.delivery.respectQuietHours,
        batchNotifications: this.config.delivery.batchNotifications
      }
    });
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<NotificationSystemConfig>): NotificationSystemConfig {
    return {
      enabled: true,
      significanceDetection: {
        enabled: true,
        minimumSignificanceScore: 3.0,
        ...config.significanceDetection
      },
      contentGeneration: {
        enableNaturalLanguage: true,
        includeTechnicalDetails: true,
        defaultLanguage: 'en',
        ...config.contentGeneration
      },
      delivery: {
        enableMultiChannel: true,
        respectQuietHours: true,
        batchNotifications: true,
        ...config.delivery
      },
      ...config
    };
  }
  
  /**
   * Process an update event and generate notifications if significant
   * 
   * @param event The update event to process
   * @param userIds The user IDs to notify
   * @param previousValue Optional previous value for comparison
   * @param currentValue Optional current value for comparison
   * @returns Whether notifications were generated and delivered
   */
  public async processUpdateEvent(
    event: TrustScoreTypes.UpdateEvent,
    userIds: string[],
    previousValue?: number,
    currentValue?: number
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }
    
    // Step 1: Detect if the change is significant
    if (this.config.significanceDetection.enabled) {
      let anySignificant = false;
      
      // Check significance for each user (personalized)
      for (const userId of userIds) {
        const significanceResult = this.significanceDetector.detectSignificance(
          event, userId, previousValue, currentValue
        );
        
        if (this.isSignificantForNotification(significanceResult)) {
          // Generate and deliver notification for this user
          await this.generateAndDeliverNotification(
            event, userId, significanceResult, previousValue, currentValue
          );
          anySignificant = true;
        }
      }
      
      return anySignificant;
    } else {
      // If significance detection is disabled, generate notifications for all users
      let anyDelivered = false;
      
      for (const userId of userIds) {
        const delivered = await this.generateAndDeliverNotification(
          event, userId, null, previousValue, currentValue
        );
        if (delivered) {
          anyDelivered = true;
        }
      }
      
      return anyDelivered;
    }
  }
  
  /**
   * Check if a significance result warrants a notification
   * 
   * @param result The significance detection result
   * @returns Whether the change is significant enough for a notification
   */
  private isSignificantForNotification(result: SignificanceResult | null): boolean {
    if (!result) {
      return true; // If no result (significance detection disabled), consider it significant
    }
    
    return result.isSignificant && 
           result.significanceScore >= this.config.significanceDetection.minimumSignificanceScore;
  }
  
  /**
   * Generate and deliver a notification for a user
   * 
   * @param event The update event
   * @param userId The user ID to notify
   * @param significanceResult The significance detection result
   * @param previousValue The previous value
   * @param currentValue The current value
   * @returns Whether the notification was delivered
   */
  private async generateAndDeliverNotification(
    event: TrustScoreTypes.UpdateEvent,
    userId: string,
    significanceResult: SignificanceResult | null,
    previousValue?: number,
    currentValue?: number
  ): Promise<boolean> {
    // Step 2: Generate notification content
    const content = this.contentGenerator.generateContent(
      event, previousValue, currentValue
    );
    
    // Create notification object
    const notification = this.createNotification(event, content, significanceResult);
    
    // Step 3: Deliver the notification
    if (this.config.delivery.enableMultiChannel) {
      return await this.deliveryManager.deliverNotification(notification, userId);
    } else {
      // If multi-channel delivery is disabled, just log the notification
      console.log(`Notification for user ${userId}:`, notification);
      return true;
    }
  }
  
  /**
   * Create a notification object from event and content
   * 
   * @param event The update event
   * @param content The notification content
   * @param significanceResult The significance detection result
   * @returns The notification object
   */
  private createNotification(
    event: TrustScoreTypes.UpdateEvent,
    content: NotificationContent,
    significanceResult: SignificanceResult | null
  ): Notification {
    // Map severity to priority
    let priority: number;
    switch (content.severity) {
      case 'critical':
        priority = 10;
        break;
      case 'high':
        priority = 8;
        break;
      case 'medium':
        priority = 5;
        break;
      case 'low':
        priority = 3;
        break;
      default:
        priority = 5;
    }
    
    // If we have a significance result, use its recommended priority
    if (significanceResult) {
      priority = significanceResult.recommendedPriority;
    }
    
    // Determine delivery channels based on priority
    const deliveryChannels: string[] = ['inApp']; // Always include in-app
    
    if (priority >= 5) {
      deliveryChannels.push('push');
    }
    
    if (priority >= 8) {
      deliveryChannels.push('email');
    }
    
    if (priority >= 9) {
      deliveryChannels.push('sms');
    }
    
    // Create the notification
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId: event.entityId,
      entityType: event.entityType,
      eventType: event.eventType,
      title: content.title,
      message: content.message,
      priority,
      timestamp: Date.now(),
      data: {
        ...event.data,
        actionRecommendations: content.actionRecommendations,
        evidenceItems: content.evidenceItems,
        technicalDetails: content.technicalDetails,
        significanceFactors: significanceResult?.significanceFactors
      },
      deliveryChannels
    };
    
    return notification;
  }
  
  /**
   * Set user preferences for significance detection
   * 
   * @param userId The user ID
   * @param entityKey The entity key (entity ID, entity type, or event type)
   * @param interestLevel The interest level (0-1)
   */
  public setUserInterest(userId: string, entityKey: string, interestLevel: number): void {
    this.significanceDetector.setUserInterest(userId, entityKey, interestLevel);
  }
  
  /**
   * Set user preferences for notification delivery
   * 
   * @param userId The user ID
   * @param preferences The user's delivery preferences
   */
  public setUserDeliveryPreferences(userId: string, preferences: Partial<UserDeliveryPreferences>): void {
    this.deliveryManager.setUserPreferences(userId, preferences);
  }
  
  /**
   * Mark a notification as read
   * 
   * @param notificationId The notification ID
   * @param userId The user ID
   * @returns Whether the operation was successful
   */
  public markNotificationAsRead(notificationId: string, userId: string): boolean {
    return this.deliveryManager.markAsRead(notificationId, userId);
  }
  
  /**
   * Get the change significance detector
   * 
   * @returns The change significance detector
   */
  public getSignificanceDetector(): ChangeSignificanceDetector {
    return this.significanceDetector;
  }
  
  /**
   * Get the notification content generator
   * 
   * @returns The notification content generator
   */
  public getContentGenerator(): NotificationContentGenerator {
    return this.contentGenerator;
  }
  
  /**
   * Get the delivery channel manager
   * 
   * @returns The delivery channel manager
   */
  public getDeliveryManager(): DeliveryChannelManager {
    return this.deliveryManager;
  }
}
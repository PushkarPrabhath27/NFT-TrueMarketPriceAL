/**
 * DeliveryChannelManager.ts
 * 
 * Implements the delivery channel management component of the Notification Generation System.
 * Responsible for delivering notifications through multiple channels, optimizing delivery timing,
 * managing user preferences, and tracking delivery status.
 */

import { TrustScoreTypes } from '../../types';
import { Notification } from './NotificationGenerator';

/**
 * Configuration for the delivery channel manager
 */
export interface DeliveryChannelConfig {
  // Available delivery channels
  availableChannels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sms: boolean;
    webhook: boolean;
  };
  
  // Delivery timing settings
  deliveryTiming: {
    // Whether to respect user quiet hours
    respectQuietHours: boolean;
    // Default quiet hours start time (24-hour format)
    defaultQuietHoursStart: number;
    // Default quiet hours end time (24-hour format)
    defaultQuietHoursEnd: number;
    // Whether to batch notifications
    batchNotifications: boolean;
    // Batch interval in minutes
    batchIntervalMinutes: number;
  };
  
  // Delivery optimization settings
  deliveryOptimization: {
    // Whether to group similar notifications
    groupSimilarNotifications: boolean;
    // Maximum notifications per group
    maxNotificationsPerGroup: number;
    // Whether to escalate unread critical notifications
    escalateUnreadCritical: boolean;
    // Time in minutes before escalation
    escalationTimeMinutes: number;
  };
  
  // Delivery tracking settings
  deliveryTracking: {
    // Whether to track delivery status
    trackDeliveryStatus: boolean;
    // Whether to track read status
    trackReadStatus: boolean;
    // Whether to track user actions
    trackUserActions: boolean;
  };
}

/**
 * User delivery preferences
 */
export interface UserDeliveryPreferences {
  // User ID
  userId: string;
  // Preferred channels for different notification types
  channelPreferences: Record<string, string[]>;
  // Quiet hours settings
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone: string;
  };
  // Notification frequency preferences
  frequency: {
    // Maximum notifications per day
    maxPerDay: number;
    // Preferred time of day for non-urgent notifications (24-hour format)
    preferredTimeOfDay: number;
    // Whether to batch notifications into digests
    batchIntoDigests: boolean;
  };
}

/**
 * Delivery status for a notification
 */
export interface DeliveryStatus {
  notificationId: string;
  userId: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  timestamp: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification group for batched delivery
 */
interface NotificationGroup {
  userId: string;
  notifications: Notification[];
  createdAt: number;
  channels: string[];
  sent: boolean;
}

/**
 * Manages the delivery of notifications through multiple channels
 */
export class DeliveryChannelManager {
  private config: DeliveryChannelConfig;
  private userPreferences: Map<string, UserDeliveryPreferences> = new Map();
  private deliveryStatuses: Map<string, DeliveryStatus[]> = new Map();
  private notificationGroups: NotificationGroup[] = [];
  private notificationCounts: Map<string, number> = new Map();
  private lastResetTime: number = Date.now();
  
  // Channel handlers
  private channelHandlers: Record<string, (notification: Notification, userId: string) => Promise<boolean>> = {};
  
  /**
   * Initialize the Delivery Channel Manager
   * 
   * @param config Configuration for the delivery channel manager
   */
  constructor(config: Partial<DeliveryChannelConfig> = {}) {
    this.config = this.getDefaultConfig(config);
    this.initializeChannelHandlers();
    
    // Start periodic tasks
    this.startPeriodicTasks();
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<DeliveryChannelConfig>): DeliveryChannelConfig {
    return {
      availableChannels: {
        email: true,
        push: true,
        inApp: true,
        sms: false,  // SMS disabled by default due to cost
        webhook: false, // Webhook disabled by default
        ...config.availableChannels
      },
      deliveryTiming: {
        respectQuietHours: true,
        defaultQuietHoursStart: 22, // 10 PM
        defaultQuietHoursEnd: 8,    // 8 AM
        batchNotifications: true,
        batchIntervalMinutes: 30,   // Batch every 30 minutes
        ...config.deliveryTiming
      },
      deliveryOptimization: {
        groupSimilarNotifications: true,
        maxNotificationsPerGroup: 5,
        escalateUnreadCritical: true,
        escalationTimeMinutes: 60,  // Escalate after 1 hour
        ...config.deliveryOptimization
      },
      deliveryTracking: {
        trackDeliveryStatus: true,
        trackReadStatus: true,
        trackUserActions: false,    // Disabled by default for privacy
        ...config.deliveryTracking
      }
    };
  }
  
  /**
   * Initialize handlers for different delivery channels
   */
  private initializeChannelHandlers(): void {
    // In-app notification handler
    this.channelHandlers['inApp'] = async (notification, userId) => {
      // In a real implementation, this would store the notification in a database
      // for retrieval when the user loads the app
      console.log(`[In-App] Delivering notification ${notification.id} to user ${userId}`);
      return true;
    };
    
    // Email notification handler
    this.channelHandlers['email'] = async (notification, userId) => {
      // In a real implementation, this would send an email using a service like SendGrid
      console.log(`[Email] Delivering notification ${notification.id} to user ${userId}`);
      return true;
    };
    
    // Push notification handler
    this.channelHandlers['push'] = async (notification, userId) => {
      // In a real implementation, this would send a push notification using FCM or similar
      console.log(`[Push] Delivering notification ${notification.id} to user ${userId}`);
      return true;
    };
    
    // SMS notification handler
    this.channelHandlers['sms'] = async (notification, userId) => {
      // In a real implementation, this would send an SMS using Twilio or similar
      console.log(`[SMS] Delivering notification ${notification.id} to user ${userId}`);
      return true;
    };
    
    // Webhook notification handler
    this.channelHandlers['webhook'] = async (notification, userId) => {
      // In a real implementation, this would make an HTTP request to the user's webhook URL
      console.log(`[Webhook] Delivering notification ${notification.id} to user ${userId}`);
      return true;
    };
  }
  
  /**
   * Start periodic tasks for notification management
   */
  private startPeriodicTasks(): void {
    // Process notification batches periodically
    setInterval(() => {
      this.processBatchedNotifications();
    }, this.config.deliveryTiming.batchIntervalMinutes * 60 * 1000);
    
    // Check for unread critical notifications that need escalation
    setInterval(() => {
      this.checkForEscalations();
    }, this.config.deliveryOptimization.escalationTimeMinutes * 60 * 1000);
    
    // Reset notification counts daily
    setInterval(() => {
      this.checkAndResetNotificationCounts();
    }, 60 * 60 * 1000); // Check every hour
  }
  
  /**
   * Set delivery preferences for a user
   * 
   * @param userId User ID
   * @param preferences User delivery preferences
   */
  public setUserPreferences(userId: string, preferences: Partial<UserDeliveryPreferences>): void {
    const existingPrefs = this.userPreferences.get(userId) || this.getDefaultUserPreferences(userId);
    
    this.userPreferences.set(userId, {
      ...existingPrefs,
      ...preferences,
      // Merge nested objects properly
      quietHours: {
        ...existingPrefs.quietHours,
        ...preferences.quietHours
      },
      frequency: {
        ...existingPrefs.frequency,
        ...preferences.frequency
      },
      // For channelPreferences, we need to merge the records
      channelPreferences: {
        ...existingPrefs.channelPreferences,
        ...preferences.channelPreferences
      }
    });
  }
  
  /**
   * Get default user preferences
   * 
   * @param userId User ID
   * @returns Default user preferences
   */
  private getDefaultUserPreferences(userId: string): UserDeliveryPreferences {
    return {
      userId,
      channelPreferences: {
        // Default to all available channels for all notification types
        default: Object.keys(this.config.availableChannels).filter(
          channel => this.config.availableChannels[channel as keyof typeof this.config.availableChannels]
        )
      },
      quietHours: {
        enabled: this.config.deliveryTiming.respectQuietHours,
        startHour: this.config.deliveryTiming.defaultQuietHoursStart,
        endHour: this.config.deliveryTiming.defaultQuietHoursEnd,
        timezone: 'UTC'
      },
      frequency: {
        maxPerDay: 20,
        preferredTimeOfDay: 12, // Noon
        batchIntoDigests: this.config.deliveryTiming.batchNotifications
      }
    };
  }
  
  /**
   * Deliver a notification to a user
   * 
   * @param notification The notification to deliver
   * @param userId The user ID to deliver to
   * @returns Whether the delivery was successful
   */
  public async deliverNotification(notification: Notification, userId: string): Promise<boolean> {
    // Reset notification counts if a day has passed
    this.checkAndResetNotificationCounts();
    
    // Check if user has reached their notification limit
    const currentCount = this.notificationCounts.get(userId) || 0;
    const userPrefs = this.userPreferences.get(userId) || this.getDefaultUserPreferences(userId);
    
    if (currentCount >= userPrefs.frequency.maxPerDay && notification.priority < 8) {
      // Skip non-critical notifications if user has reached their limit
      this.trackDeliveryStatus(notification.id, userId, 'inApp', 'failed', 'Frequency limit reached');
      return false;
    }
    
    // Increment notification count
    this.notificationCounts.set(userId, currentCount + 1);
    
    // Check if we should batch this notification
    if (this.shouldBatchNotification(notification, userId)) {
      return this.addToBatch(notification, userId);
    }
    
    // Determine channels to use
    const channels = this.determineChannelsForUser(notification, userId);
    
    // Check quiet hours for non-critical notifications
    if (notification.priority < 8 && this.isInQuietHours(userId)) {
      // For non-critical notifications during quiet hours, only use in-app
      const inAppOnly = channels.filter(channel => channel === 'inApp');
      return this.deliverToChannels(notification, userId, inAppOnly);
    }
    
    // Deliver to all determined channels
    return this.deliverToChannels(notification, userId, channels);
  }
  
  /**
   * Determine which channels to use for a user
   * 
   * @param notification The notification to deliver
   * @param userId The user ID to deliver to
   * @returns The channels to use
   */
  private determineChannelsForUser(notification: Notification, userId: string): string[] {
    const userPrefs = this.userPreferences.get(userId) || this.getDefaultUserPreferences(userId);
    
    // Check if user has specific preferences for this notification type
    if (userPrefs.channelPreferences[notification.eventType]) {
      return userPrefs.channelPreferences[notification.eventType];
    }
    
    // Check if user has specific preferences for this entity type
    if (userPrefs.channelPreferences[notification.entityType]) {
      return userPrefs.channelPreferences[notification.entityType];
    }
    
    // Fall back to default preferences
    return userPrefs.channelPreferences.default || notification.deliveryChannels || ['inApp'];
  }
  
  /**
   * Check if the current time is within a user's quiet hours
   * 
   * @param userId The user ID to check
   * @returns Whether it's currently quiet hours for the user
   */
  private isInQuietHours(userId: string): boolean {
    const userPrefs = this.userPreferences.get(userId) || this.getDefaultUserPreferences(userId);
    
    if (!userPrefs.quietHours.enabled) {
      return false;
    }
    
    // Get current hour in user's timezone
    const now = new Date();
    const currentHour = now.getUTCHours(); // Simplified - in real implementation, use proper timezone conversion
    
    const start = userPrefs.quietHours.startHour;
    const end = userPrefs.quietHours.endHour;
    
    // Handle cases where quiet hours span midnight
    if (start > end) {
      return currentHour >= start || currentHour < end;
    } else {
      return currentHour >= start && currentHour < end;
    }
  }
  
  /**
   * Check if a notification should be batched
   * 
   * @param notification The notification to check
   * @param userId The user ID
   * @returns Whether the notification should be batched
   */
  private shouldBatchNotification(notification: Notification, userId: string): boolean {
    const userPrefs = this.userPreferences.get(userId) || this.getDefaultUserPreferences(userId);
    
    // Don't batch high priority notifications
    if (notification.priority >= 8) {
      return false;
    }
    
    // Don't batch if user has disabled batching
    if (!userPrefs.frequency.batchIntoDigests) {
      return false;
    }
    
    // Don't batch if system has disabled batching
    if (!this.config.deliveryTiming.batchNotifications) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Add a notification to a batch for later delivery
   * 
   * @param notification The notification to add
   * @param userId The user ID
   * @returns Whether the notification was added to a batch
   */
  private addToBatch(notification: Notification, userId: string): boolean {
    // Find existing group for this user
    let group = this.notificationGroups.find(g => g.userId === userId && !g.sent);
    
    // Determine channels
    const channels = this.determineChannelsForUser(notification, userId);
    
    if (!group) {
      // Create a new group
      group = {
        userId,
        notifications: [],
        createdAt: Date.now(),
        channels,
        sent: false
      };
      this.notificationGroups.push(group);
    } else {
      // Update channels to include all channels from both notifications
      group.channels = [...new Set([...group.channels, ...channels])];
    }
    
    // Add notification to group
    group.notifications.push(notification);
    
    // Track status
    this.trackDeliveryStatus(notification.id, userId, 'batch', 'pending');
    
    return true;
  }
  
  /**
   * Process batched notifications
   */
  private async processBatchedNotifications(): Promise<void> {
    const now = Date.now();
    const batchInterval = this.config.deliveryTiming.batchIntervalMinutes * 60 * 1000;
    
    // Find groups that are ready to be sent
    const readyGroups = this.notificationGroups.filter(group => 
      !group.sent && 
      (now - group.createdAt >= batchInterval || 
       group.notifications.length >= this.config.deliveryOptimization.maxNotificationsPerGroup)
    );
    
    // Process each ready group
    for (const group of readyGroups) {
      await this.deliverNotificationGroup(group);
      group.sent = true;
    }
    
    // Remove sent groups
    this.notificationGroups = this.notificationGroups.filter(group => !group.sent);
  }
  
  /**
   * Deliver a group of notifications
   * 
   * @param group The notification group to deliver
   */
  private async deliverNotificationGroup(group: NotificationGroup): Promise<void> {
    // Create a digest notification
    const digestNotification: Notification = {
      id: `digest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId: 'digest',
      entityType: 'system',
      eventType: 'notification_digest',
      title: `Notification Digest (${group.notifications.length} updates)`,
      message: this.createDigestMessage(group.notifications),
      priority: Math.max(...group.notifications.map(n => n.priority)),
      timestamp: Date.now(),
      data: {
        notifications: group.notifications,
        count: group.notifications.length
      },
      deliveryChannels: group.channels
    };
    
    // Deliver the digest
    await this.deliverToChannels(digestNotification, group.userId, group.channels);
    
    // Update status for all notifications in the group
    for (const notification of group.notifications) {
      for (const channel of group.channels) {
        this.trackDeliveryStatus(notification.id, group.userId, channel, 'delivered', undefined, {
          digestId: digestNotification.id
        });
      }
    }
  }
  
  /**
   * Create a digest message from multiple notifications
   * 
   * @param notifications The notifications to include in the digest
   * @returns The digest message
   */
  private createDigestMessage(notifications: Notification[]): string {
    let message = `You have ${notifications.length} new notifications:\n\n`;
    
    // Group notifications by entity type
    const groupedByType: Record<string, Notification[]> = {};
    
    for (const notification of notifications) {
      if (!groupedByType[notification.entityType]) {
        groupedByType[notification.entityType] = [];
      }
      groupedByType[notification.entityType].push(notification);
    }
    
    // Create a summary for each entity type
    for (const [entityType, typeNotifications] of Object.entries(groupedByType)) {
      message += `${this.capitalizeFirstLetter(entityType)} Updates (${typeNotifications.length}):\n`;
      
      // List the first 3 notifications of this type
      const previewCount = Math.min(typeNotifications.length, 3);
      for (let i = 0; i < previewCount; i++) {
        message += `- ${typeNotifications[i].title}\n`;
      }
      
      // If there are more, add a summary
      if (typeNotifications.length > previewCount) {
        message += `- And ${typeNotifications.length - previewCount} more...\n`;
      }
      
      message += '\n';
    }
    
    return message;
  }
  
  /**
   * Deliver a notification to multiple channels
   * 
   * @param notification The notification to deliver
   * @param userId The user ID to deliver to
   * @param channels The channels to deliver to
   * @returns Whether the delivery was successful on any channel
   */
  private async deliverToChannels(notification: Notification, userId: string, channels: string[]): Promise<boolean> {
    let anySuccess = false;
    
    // Filter to only available channels
    const availableChannels = channels.filter(channel => 
      this.config.availableChannels[channel as keyof typeof this.config.availableChannels] && 
      this.channelHandlers[channel]
    );
    
    // Deliver to each channel
    for (const channel of availableChannels) {
      try {
        const success = await this.channelHandlers[channel](notification, userId);
        
        // Track delivery status
        this.trackDeliveryStatus(
          notification.id,
          userId,
          channel,
          success ? 'delivered' : 'failed'
        );
        
        if (success) {
          anySuccess = true;
        }
      } catch (error) {
        // Track delivery failure
        this.trackDeliveryStatus(
          notification.id,
          userId,
          channel,
          'failed',
          error.message
        );
      }
    }
    
    return anySuccess;
  }
  
  /**
   * Check for unread critical notifications that need escalation
   */
  private async checkForEscalations(): Promise<void> {
    if (!this.config.deliveryOptimization.escalateUnreadCritical) {
      return;
    }
    
    const now = Date.now();
    const escalationTime = this.config.deliveryOptimization.escalationTimeMinutes * 60 * 1000;
    
    // Check all delivery statuses
    for (const [notificationId, statuses] of this.deliveryStatuses.entries()) {
      // Find delivered but unread critical notifications
      const deliveredStatus = statuses.find(s => s.status === 'delivered');
      const readStatus = statuses.find(s => s.status === 'read');
      
      if (deliveredStatus && !readStatus) {
        // Check if it's been long enough for escalation
        if (now - deliveredStatus.timestamp >= escalationTime) {
          // Get the notification and check if it's critical
          const notification = this.getNotificationById(notificationId);
          if (notification && notification.priority >= 8) {
            // Escalate by sending through additional channels
            await this.escalateNotification(notification, deliveredStatus.userId);
          }
        }
      }
    }
  }
  
  /**
   * Escalate a critical notification that hasn't been read
   * 
   * @param notification The notification to escalate
   * @param userId The user ID
   */
  private async escalateNotification(notification: Notification, userId: string): Promise<void> {
    // Create an escalated version of the notification
    const escalatedNotification: Notification = {
      ...notification,
      id: `escalated-${notification.id}`,
      title: `URGENT: ${notification.title}`,
      priority: 10, // Maximum priority
      timestamp: Date.now(),
      data: {
        ...notification.data,
        escalated: true,
        originalNotificationId: notification.id
      }
    };
    
    // Determine escalation channels - use SMS if available
    const escalationChannels = ['sms', 'email', 'push'].filter(channel => 
      this.config.availableChannels[channel as keyof typeof this.config.availableChannels]
    );
    
    // Deliver through escalation channels
    await this.deliverToChannels(escalatedNotification, userId, escalationChannels);
  }
  
  /**
   * Track the delivery status of a notification
   * 
   * @param notificationId The notification ID
   * @param userId The user ID
   * @param channel The delivery channel
   * @param status The delivery status
   * @param error Optional error message
   * @param metadata Optional additional metadata
   */
  public trackDeliveryStatus(
    notificationId: string,
    userId: string,
    channel: string,
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read',
    error?: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.deliveryTracking.trackDeliveryStatus) {
      return;
    }
    
    if (!this.deliveryStatuses.has(notificationId)) {
      this.deliveryStatuses.set(notificationId, []);
    }
    
    const statuses = this.deliveryStatuses.get(notificationId)!;
    
    // Update existing status if found
    const existingIndex = statuses.findIndex(s => s.userId === userId && s.channel === channel);
    
    if (existingIndex >= 0) {
      statuses[existingIndex] = {
        ...statuses[existingIndex],
        status,
        timestamp: Date.now(),
        error,
        metadata: {
          ...statuses[existingIndex].metadata,
          ...metadata
        }
      };
    } else {
      // Add new status
      statuses.push({
        notificationId,
        userId,
        channel,
        status,
        timestamp: Date.now(),
        error,
        metadata
      });
    }
  }
  
  /**
   * Mark a notification as read by a user
   * 
   * @param notificationId The notification ID
   * @param userId The user ID
   * @returns Whether the operation was successful
   */
  public markAsRead(notificationId: string, userId: string): boolean {
    if (!this.config.deliveryTracking.trackReadStatus) {
      return false;
    }
    
    if (!this.deliveryStatuses.has(notificationId)) {
      return false;
    }
    
    // Update status for all channels
    const statuses = this.deliveryStatuses.get(notificationId)!;
    let updated = false;
    
    for (const status of statuses) {
      if (status.userId === userId && status.status === 'delivered') {
        status.status = 'read';
        status.timestamp = Date.now();
        updated = true;
      }
    }
    
    return updated;
  }
  
  /**
   * Get all notifications for a user
   * 
   * @param userId The user ID
   * @param options Options for filtering notifications
   * @returns The user's notifications
   */
  public getUserNotifications(userId: string, options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    entityType?: string;
    eventType?: string;
  } = {}): { notifications: Notification[]; total: number } {
    // In a real implementation, this would query a database
    // This is a simplified version that just returns an empty array
    return {
      notifications: [],
      total: 0
    };
  }
  
  /**
   * Get a notification by ID
   * 
   * @param notificationId The notification ID
   * @returns The notification, or undefined if not found
   */
  private getNotificationById(notificationId: string): Notification | undefined {
    // In a real implementation, this would query a database
    // This is a simplified version that just returns undefined
    return undefined;
  }
  
  /**
   * Check if a day has passed and reset notification counts if needed
   */
  private checkAndResetNotificationCounts(): void {
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (now - this.lastResetTime >= oneDayInMs) {
      this.notificationCounts.clear();
      this.lastResetTime = now;
    }
  }
  
  /**
   * Capitalize the first letter of a string
   * 
   * @param str The string to capitalize
   * @returns The capitalized string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
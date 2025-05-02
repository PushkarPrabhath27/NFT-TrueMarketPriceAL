/**
 * NotificationGenerator.ts
 * 
 * Implements the notification generation component of the Real-Time Update System.
 * Responsible for creating personalized notifications when significant changes occur
 * in trust scores, price predictions, or risk assessments.
 */

import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the notification generator
 */
export interface NotificationGeneratorConfig {
  // Thresholds for different notification types (0-1 where 1 means always notify)
  notificationThresholds: Record<string, number>;
  // Whether to generate personalized notifications
  enablePersonalization: boolean;
  // Whether to include natural language descriptions
  enableNaturalLanguage: boolean;
  // Maximum number of notifications per entity per day
  maxNotificationsPerEntityPerDay: number;
  // Priority thresholds for different delivery channels
  deliveryChannelThresholds: {
    email: number;
    push: number;
    inApp: number;
    sms: number;
  };
}

/**
 * Represents a notification to be sent to users
 */
export interface Notification {
  id: string;
  entityId: string;
  entityType: string;
  eventType: string;
  title: string;
  message: string;
  priority: number;
  timestamp: number;
  data: any;
  deliveryChannels: string[];
}

/**
 * Manages notification generation for significant changes
 */
export class NotificationGenerator {
  private config: NotificationGeneratorConfig;
  private notificationCounts: Map<string, number> = new Map();
  private lastResetTime: number = Date.now();
  
  /**
   * Initialize the Notification Generator
   * 
   * @param config Configuration for the notification generator
   */
  constructor(config: Partial<NotificationGeneratorConfig> = {}) {
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<NotificationGeneratorConfig>): NotificationGeneratorConfig {
    return {
      notificationThresholds: {
        // Trust score changes
        trust_score_decrease: 0.1, // 10% decrease
        trust_score_increase: 0.2, // 20% increase
        
        // Price prediction changes
        price_prediction_decrease: 0.15, // 15% decrease
        price_prediction_increase: 0.15, // 15% increase
        
        // Risk assessment changes
        risk_level_increase: 0.0, // Any increase
        risk_level_decrease: 0.2, // 20% decrease
        
        // Fraud detection
        fraud_detection: 0.0, // Any fraud detection
        
        // Default for unknown notification types
        default: 0.1
      },
      enablePersonalization: true,
      enableNaturalLanguage: true,
      maxNotificationsPerEntityPerDay: 5,
      deliveryChannelThresholds: {
        email: 7, // High priority (7-10)
        push: 5, // Medium priority (5-10)
        inApp: 3, // Low priority (3-10)
        sms: 9 // Very high priority (9-10)
      },
      ...config
    };
  }
  
  /**
   * Generate a notification for an event
   * 
   * @param event The event to generate a notification for
   * @returns The generated notification
   */
  public generateNotification(event: TrustScoreTypes.UpdateEvent): Notification {
    // Reset notification counts if a day has passed
    this.checkAndResetNotificationCounts();
    
    // Check if we've reached the maximum notifications for this entity
    const entityKey = `${event.entityType}-${event.entityId}`;
    const currentCount = this.notificationCounts.get(entityKey) || 0;
    
    if (currentCount >= this.config.maxNotificationsPerEntityPerDay) {
      // Generate a minimal notification if we've reached the limit
      return this.generateMinimalNotification(event);
    }
    
    // Increment notification count
    this.notificationCounts.set(entityKey, currentCount + 1);
    
    // Generate notification content
    const title = this.generateTitle(event);
    const message = this.generateMessage(event);
    
    // Determine delivery channels
    const deliveryChannels = this.determineDeliveryChannels(event.priority || 5);
    
    // Create notification
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId: event.entityId,
      entityType: event.entityType,
      eventType: event.eventType,
      title,
      message,
      priority: event.priority || 5,
      timestamp: Date.now(),
      data: event.data,
      deliveryChannels
    };
    
    return notification;
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
   * Generate a minimal notification when the daily limit is reached
   * 
   * @param event The event to generate a notification for
   * @returns A minimal notification
   */
  private generateMinimalNotification(event: TrustScoreTypes.UpdateEvent): Notification {
    return {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId: event.entityId,
      entityType: event.entityType,
      eventType: event.eventType,
      title: 'Update Notification',
      message: `There has been an update related to ${this.getEntityTypeDisplay(event.entityType)} ${event.entityId}.`,
      priority: Math.min(event.priority || 5, 4), // Cap priority at 4 for minimal notifications
      timestamp: Date.now(),
      data: { limitReached: true },
      deliveryChannels: ['inApp'] // Only deliver in-app for minimal notifications
    };
  }
  
  /**
   * Generate a title for a notification
   * 
   * @param event The event to generate a title for
   * @returns The generated title
   */
  private generateTitle(event: TrustScoreTypes.UpdateEvent): string {
    // Base titles for different event types
    switch (event.eventType) {
      case 'nft_transfer':
        return 'NFT Ownership Changed';
      
      case 'nft_sale':
        return 'NFT Sale Completed';
      
      case 'nft_mint':
        return 'New NFT Minted';
      
      case 'fraud_wash_trading':
        return 'Potential Wash Trading Detected';
      
      case 'fraud_image_analysis':
        return 'Image Analysis Results';
      
      case 'fraud_similarity_score':
        return 'Similar NFTs Detected';
      
      case 'market_floor_price_change':
        return 'Collection Floor Price Change';
      
      case 'social_sentiment_shift':
        return 'Social Sentiment Shift';
      
      default:
        return `${this.getEventTypeDisplay(event.eventType)} Update`;
    }
  }
  
  /**
   * Generate a message for a notification
   * 
   * @param event The event to generate a message for
   * @returns The generated message
   */
  private generateMessage(event: TrustScoreTypes.UpdateEvent): string {
    if (!this.config.enableNaturalLanguage) {
      return `There has been an update related to ${this.getEntityTypeDisplay(event.entityType)} ${event.entityId}.`;
    }
    
    // Generate natural language message based on event type
    switch (event.eventType) {
      case 'nft_transfer':
        return `NFT ${event.data.tokenId} from collection ${event.data.contractAddress} has been transferred from ${this.shortenAddress(event.data.from)} to ${this.shortenAddress(event.data.to)}.`;
      
      case 'nft_sale':
        return `NFT ${event.data.tokenId} from collection ${event.data.contractAddress} has been sold for ${event.data.price} ETH on ${event.data.marketplace}.`;
      
      case 'nft_mint':
        return `A new NFT (${event.data.tokenId}) has been minted in collection ${event.data.contractAddress} by ${this.shortenAddress(event.data.creator)}.`;
      
      case 'fraud_wash_trading':
        return `Potential wash trading detected for NFT ${event.entityId} with ${event.data.confidence * 100}% confidence. ${event.data.involvedAddresses?.length || 0} suspicious addresses identified.`;
      
      case 'fraud_image_analysis':
        return `Image analysis for NFT ${event.entityId} completed with ${event.data.flags?.length || 0} potential issues detected.`;
      
      case 'fraud_similarity_score':
        return `NFT ${event.entityId} has a high similarity score (${event.data.similarityScore}) with ${event.data.similarNfts?.length || 0} other NFTs.`;
      
      case 'market_floor_price_change':
        const direction = event.data.percentageChange > 0 ? 'increased' : 'decreased';
        return `The floor price for collection ${event.entityId} has ${direction} by ${Math.abs(event.data.percentageChange)}%.`;
      
      case 'social_sentiment_shift':
        const sentimentDirection = event.data.direction === 'positive' ? 'positive' : 'negative';
        return `Social sentiment for ${this.getEntityTypeDisplay(event.entityType)} ${event.entityId} has shifted in a ${sentimentDirection} direction with magnitude ${event.data.magnitude}.`;
      
      default:
        return `There has been an update related to ${this.getEntityTypeDisplay(event.entityType)} ${event.entityId}.`;
    }
  }
  
  /**
   * Determine which delivery channels to use based on notification priority
   * 
   * @param priority The notification priority
   * @returns The delivery channels to use
   */
  private determineDeliveryChannels(priority: number): string[] {
    const channels: string[] = [];
    
    // Always include in-app notifications
    if (priority >= this.config.deliveryChannelThresholds.inApp) {
      channels.push('inApp');
    }
    
    // Add push notifications for medium priority and above
    if (priority >= this.config.deliveryChannelThresholds.push) {
      channels.push('push');
    }
    
    // Add email notifications for high priority
    if (priority >= this.config.deliveryChannelThresholds.email) {
      channels.push('email');
    }
    
    // Add SMS notifications for very high priority
    if (priority >= this.config.deliveryChannelThresholds.sms) {
      channels.push('sms');
    }
    
    return channels;
  }
  
  /**
   * Get a display-friendly version of an entity type
   * 
   * @param entityType The entity type
   * @returns A display-friendly version
   */
  private getEntityTypeDisplay(entityType: string): string {
    switch (entityType) {
      case 'nft':
        return 'NFT';
      case 'collection':
        return 'Collection';
      case 'creator':
        return 'Creator';
      case 'market':
        return 'Market';
      default:
        return entityType;
    }
  }
  
  /**
   * Get a display-friendly version of an event type
   * 
   * @param eventType The event type
   * @returns A display-friendly version
   */
  private getEventTypeDisplay(eventType: string): string {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Shorten an Ethereum address for display
   * 
   * @param address The address to shorten
   * @returns The shortened address
   */
  private shortenAddress(address: string): string {
    if (!address || address.length < 10) {
      return address;
    }
    
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}
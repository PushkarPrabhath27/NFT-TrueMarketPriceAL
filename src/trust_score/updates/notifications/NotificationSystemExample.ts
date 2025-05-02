/**
 * NotificationSystemExample.ts
 * 
 * Provides examples of how to use the Notification Generation System components.
 * This file demonstrates the integration of Change Significance Detection,
 * Notification Content Generation, and Delivery Channel Management.
 */

import { TrustScoreTypes } from '../../types';
import { ChangeSignificanceDetector } from './ChangeSignificanceDetector';
import { NotificationContentGenerator } from './NotificationContentGenerator';
import { DeliveryChannelManager, UserDeliveryPreferences } from './DeliveryChannelManager';
import { NotificationSystem } from './NotificationSystem';

/**
 * Example class demonstrating the usage of the Notification System
 */
export class NotificationSystemExample {
  private notificationSystem: NotificationSystem;
  
  constructor() {
    // Initialize the notification system with custom configuration
    this.notificationSystem = new NotificationSystem({
      enabled: true,
      significanceDetection: {
        enabled: true,
        minimumSignificanceScore: 3.0
      },
      contentGeneration: {
        enableNaturalLanguage: true,
        includeTechnicalDetails: true,
        defaultLanguage: 'en'
      },
      delivery: {
        enableMultiChannel: true,
        respectQuietHours: true,
        batchNotifications: true
      }
    });
    
    // Set up user preferences
    this.setupUserPreferences();
  }
  
  /**
   * Set up example user preferences
   */
  private setupUserPreferences(): void {
    // User 1: Interested in high-value NFTs and fraud detection
    const user1 = 'user123';
    this.notificationSystem.setUserInterest(user1, 'nft', 0.7); // High interest in NFTs
    this.notificationSystem.setUserInterest(user1, 'fraud_detection', 1.0); // Maximum interest in fraud
    
    // Set delivery preferences for User 1
    this.notificationSystem.setUserDeliveryPreferences(user1, {
      channelPreferences: {
        'fraud_detection': ['push', 'email', 'sms'], // Critical notifications on all channels
        'price_increase': ['push', 'inApp'], // Price increases on push and in-app
        'default': ['inApp'] // Everything else just in-app
      },
      quietHours: {
        enabled: true,
        startHour: 22, // 10 PM
        endHour: 8,    // 8 AM
        timezone: 'America/New_York'
      },
      frequency: {
        maxPerDay: 15,
        preferredTimeOfDay: 9, // 9 AM
        batchIntoDigests: true
      }
    });
    
    // User 2: Collector interested in price changes and floor price movements
    const user2 = 'user456';
    this.notificationSystem.setUserInterest(user2, 'price_increase', 0.9);
    this.notificationSystem.setUserInterest(user2, 'price_decrease', 0.8);
    this.notificationSystem.setUserInterest(user2, 'market_floor_price_change', 1.0);
    
    // Set delivery preferences for User 2
    this.notificationSystem.setUserDeliveryPreferences(user2, {
      channelPreferences: {
        'price_decrease': ['push', 'email'], // Price decreases on push and email
        'market_floor_price_change': ['push', 'email'], // Floor price changes on push and email
        'default': ['inApp'] // Everything else just in-app
      },
      quietHours: {
        enabled: false // No quiet hours
      },
      frequency: {
        maxPerDay: 30, // Higher notification limit
        batchIntoDigests: false // Don't batch notifications
      }
    });
  }
  
  /**
   * Run examples demonstrating different notification scenarios
   */
  public async runExamples(): Promise<void> {
    console.log('Running Notification System Examples...');
    
    // Example 1: Trust score decrease (significant change)
    await this.exampleTrustScoreDecrease();
    
    // Example 2: Price increase (significant change)
    await this.examplePriceIncrease();
    
    // Example 3: Fraud detection (always significant)
    await this.exampleFraudDetection();
    
    // Example 4: Minor change (not significant enough)
    await this.exampleMinorChange();
    
    // Example 5: Floor price change with batch delivery
    await this.exampleFloorPriceChange();
    
    console.log('All examples completed.');
  }
  
  /**
   * Example 1: Trust score decrease
   */
  private async exampleTrustScoreDecrease(): Promise<void> {
    console.log('\nExample 1: Trust Score Decrease');
    
    const event: TrustScoreTypes.UpdateEvent = {
      entityId: 'nft123',
      entityType: 'nft',
      eventType: 'trust_score_update',
      timestamp: Date.now(),
      data: {
        collectionName: 'Bored Ape Yacht Club',
        inUserPortfolio: true, // This NFT is in user1's portfolio
        reasonText: 'Due to suspicious trading patterns and ownership history.'
      }
    };
    
    const previousScore = 85;
    const currentScore = 65;
    
    // Process the event for both users
    const result = await this.notificationSystem.processUpdateEvent(
      event, ['user123', 'user456'], previousScore, currentScore
    );
    
    console.log(`Notifications generated: ${result}`);
    
    // Demonstrate direct component usage
    this.demonstrateDirectComponentUsage(event, previousScore, currentScore);
  }
  
  /**
   * Example 2: Price increase
   */
  private async examplePriceIncrease(): Promise<void> {
    console.log('\nExample 2: Price Increase');
    
    const event: TrustScoreTypes.UpdateEvent = {
      entityId: 'nft456',
      entityType: 'nft',
      eventType: 'price_update',
      timestamp: Date.now(),
      data: {
        collectionName: 'CryptoPunks',
        marketplace: 'OpenSea',
        currency: 'ETH',
        inUserPortfolio: false
      }
    };
    
    const previousPrice = 10.5;
    const currentPrice = 15.75;
    
    // Process the event for both users
    const result = await this.notificationSystem.processUpdateEvent(
      event, ['user123', 'user456'], previousPrice, currentPrice
    );
    
    console.log(`Notifications generated: ${result}`);
  }
  
  /**
   * Example 3: Fraud detection
   */
  private async exampleFraudDetection(): Promise<void> {
    console.log('\nExample 3: Fraud Detection');
    
    const event: TrustScoreTypes.UpdateEvent = {
      entityId: 'nft789',
      entityType: 'nft',
      eventType: 'fraud_wash_trading',
      timestamp: Date.now(),
      data: {
        collectionName: 'Azuki',
        fraudType: 'Wash Trading',
        confidenceLevel: 92,
        involvedAddresses: ['0x123...', '0x456...', '0x789...'],
        inUserPortfolio: false
      }
    };
    
    // Fraud detection doesn't need previous/current values
    const result = await this.notificationSystem.processUpdateEvent(
      event, ['user123', 'user456']
    );
    
    console.log(`Notifications generated: ${result}`);
  }
  
  /**
   * Example 4: Minor change (not significant)
   */
  private async exampleMinorChange(): Promise<void> {
    console.log('\nExample 4: Minor Change (Not Significant)');
    
    const event: TrustScoreTypes.UpdateEvent = {
      entityId: 'nft101',
      entityType: 'nft',
      eventType: 'trust_score_update',
      timestamp: Date.now(),
      data: {
        collectionName: 'Doodles',
        inUserPortfolio: false
      }
    };
    
    const previousScore = 78;
    const currentScore = 77; // Only 1 point decrease, likely not significant
    
    // Process the event for both users
    const result = await this.notificationSystem.processUpdateEvent(
      event, ['user123', 'user456'], previousScore, currentScore
    );
    
    console.log(`Notifications generated: ${result}`);
  }
  
  /**
   * Example 5: Floor price change with batch delivery
   */
  private async exampleFloorPriceChange(): Promise<void> {
    console.log('\nExample 5: Floor Price Change (Batched)');
    
    const event: TrustScoreTypes.UpdateEvent = {
      entityId: 'collection123',
      entityType: 'collection',
      eventType: 'market_floor_price_change',
      timestamp: Date.now(),
      data: {
        collectionName: 'Cool Cats',
        percentageChange: -15.5,
        previousPrice: 2.0,
        currentPrice: 1.69,
        currency: 'ETH',
        direction: 'decreased'
      }
    };
    
    // Process the event for both users
    const result = await this.notificationSystem.processUpdateEvent(
      event, ['user123', 'user456'], 2.0, 1.69
    );
    
    console.log(`Notifications generated: ${result}`);
    console.log('Note: For user456, this notification will be delivered immediately.');
    console.log('For user123, it will be batched with other non-critical notifications.');
  }
  
  /**
   * Demonstrate how to use the individual components directly
   */
  private demonstrateDirectComponentUsage(
    event: TrustScoreTypes.UpdateEvent,
    previousValue: number,
    currentValue: number
  ): void {
    console.log('\nDirect Component Usage Example:');
    
    // 1. Using the Change Significance Detector directly
    const significanceDetector = this.notificationSystem.getSignificanceDetector();
    const significanceResult = significanceDetector.detectSignificance(
      event, 'user123', previousValue, currentValue
    );
    
    console.log('Significance Detection Result:');
    console.log(`- Is Significant: ${significanceResult.isSignificant}`);
    console.log(`- Significance Score: ${significanceResult.significanceScore.toFixed(2)}`);
    console.log(`- Factors: ${significanceResult.significanceFactors.join(', ')}`);
    console.log(`- Recommended Priority: ${significanceResult.recommendedPriority}`);
    
    // 2. Using the Notification Content Generator directly
    const contentGenerator = this.notificationSystem.getContentGenerator();
    const content = contentGenerator.generateContent(event, previousValue, currentValue);
    
    console.log('\nGenerated Content:');
    console.log(`- Title: ${content.title}`);
    console.log(`- Message: ${content.message}`);
    console.log(`- Severity: ${content.severity}`);
    
    if (content.actionRecommendations) {
      console.log('- Action Recommendations:');
      content.actionRecommendations.forEach(rec => console.log(`  * ${rec}`));
    }
    
    // 3. Using the Delivery Channel Manager directly
    // (This would normally deliver the notification, but we'll just log it here)
    console.log('\nDelivery would be handled by the Delivery Channel Manager');
    console.log('Channels would be determined based on priority and user preferences');
  }
}

// Example usage:
// const example = new NotificationSystemExample();
// example.runExamples().catch(console.error);
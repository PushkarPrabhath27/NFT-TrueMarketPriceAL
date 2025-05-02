# Notification Generation System

This directory implements the Notification Generation System for the NFT TrustScore platform. The system is responsible for detecting significant changes in trust scores, prices, and risk levels, generating appropriate notifications, and delivering them to interested users through multiple channels.

## System Components

The Notification Generation System consists of three main components:

### 1. Change Significance Detection (`ChangeSignificanceDetector.ts`)

Responsible for determining when changes are significant enough to warrant a notification. It implements:

- **Absolute threshold violations**: Detecting when values cross predefined thresholds (e.g., trust score drops below 50)
- **Relative change magnitude**: Identifying percentage changes that exceed thresholds (e.g., price increases by 20%)
- **Trend reversals**: Detecting when an upward trend becomes downward or vice versa
- **Anomalous changes**: Identifying statistically significant deviations from normal patterns
- **Personalization**: Adjusting significance based on user interests, portfolio relevance, and notification frequency

### 2. Notification Content Generation (`NotificationContentGenerator.ts`)

Creates personalized, context-aware notification content with appropriate messaging. Features include:

- **Content templates**: Pre-defined templates for different notification types
- **Dynamic content creation**: Generating severity-appropriate messaging based on event data
- **Personalized context**: Including relevant context for the user
- **Action recommendations**: Suggesting next steps based on the notification type
- **Evidence inclusion**: Providing supporting data for the notification

### 3. Delivery Channel Management (`DeliveryChannelManager.ts`)

Manages the delivery of notifications through multiple channels with optimization features:

- **Multi-channel delivery**: Supporting in-app, email, push, SMS, and webhook notifications
- **Delivery optimization**: Respecting user preferences for channels and timing
- **Notification batching**: Grouping similar notifications into digests
- **Quiet hours**: Respecting user-defined quiet periods for non-critical notifications
- **Escalation**: Automatically escalating unread critical notifications
- **Delivery tracking**: Monitoring notification delivery and read status

### Integration (`NotificationSystem.ts`)

Integrates all three components into a unified system that can be easily used by other parts of the application.

## Usage Examples

The `NotificationSystemExample.ts` file provides comprehensive examples of how to use the Notification Generation System. Here's a basic usage example:

```typescript
// Initialize the notification system
const notificationSystem = new NotificationSystem();

// Set user preferences
notificationSystem.setUserInterest('user123', 'nft', 0.8); // High interest in NFTs
notificationSystem.setUserDeliveryPreferences('user123', {
  channelPreferences: {
    'default': ['inApp', 'push']
  }
});

// Process an update event
const event: TrustScoreTypes.UpdateEvent = {
  entityId: 'nft123',
  entityType: 'nft',
  eventType: 'trust_score_update',
  timestamp: Date.now(),
  data: { /* event data */ }
};

// Generate and deliver notifications if the change is significant
const result = await notificationSystem.processUpdateEvent(
  event, ['user123'], previousValue, currentValue
);
```

## Configuration

Each component can be configured independently, and the integrated `NotificationSystem` provides a unified configuration interface:

```typescript
const notificationSystem = new NotificationSystem({
  enabled: true,
  significanceDetection: {
    enabled: true,
    minimumSignificanceScore: 3.0
  },
  contentGeneration: {
    enableNaturalLanguage: true,
    includeTechnicalDetails: true
  },
  delivery: {
    enableMultiChannel: true,
    respectQuietHours: true,
    batchNotifications: true
  }
});
```

## Integration with Real-Time Update Engine

The Notification Generation System is designed to integrate with the existing Real-Time Update Engine. When the update engine detects changes in trust scores, prices, or risk assessments, it can pass those events to the Notification System for processing.

```typescript
// In the Real-Time Update Engine
import { NotificationSystem } from '../notifications';

class RealTimeUpdateEngine {
  private notificationSystem: NotificationSystem;
  
  constructor() {
    this.notificationSystem = new NotificationSystem();
  }
  
  // When a change is detected
  private async handleChange(event, previousValue, currentValue, affectedUsers) {
    // Process other update logic...
    
    // Generate notifications if needed
    await this.notificationSystem.processUpdateEvent(
      event, affectedUsers, previousValue, currentValue
    );
  }
}
```

## Testing

To test the Notification Generation System, you can run the examples in `NotificationSystemExample.ts`:

```typescript
const example = new NotificationSystemExample();
example.runExamples().catch(console.error);
```

This will demonstrate various notification scenarios and how the system handles them.
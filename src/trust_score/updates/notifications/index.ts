/**
 * index.ts
 * 
 * Exports all components of the Notification Generation System for easy importing
 * throughout the application.
 */

// Export Change Significance Detection components
export { 
  ChangeSignificanceDetector,
  ChangeSignificanceConfig,
  SignificanceResult
} from './ChangeSignificanceDetector';

// Export Notification Content Generation components
export {
  NotificationContentGenerator,
  NotificationContentConfig,
  NotificationTemplate,
  NotificationContent
} from './NotificationContentGenerator';

// Export Delivery Channel Management components
export {
  DeliveryChannelManager,
  DeliveryChannelConfig,
  UserDeliveryPreferences,
  DeliveryStatus
} from './DeliveryChannelManager';

// Export the integrated Notification System
export {
  NotificationSystem,
  NotificationSystemConfig
} from './NotificationSystem';

// Export the Notification type from NotificationGenerator
export { Notification } from './NotificationGenerator';

// Export the example for reference
export { NotificationSystemExample } from './NotificationSystemExample';
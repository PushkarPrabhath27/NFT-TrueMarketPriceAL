/**
 * index.ts
 * 
 * Exports all components of the Real-Time Update System for easy importing.
 */

// Main engine
export { RealTimeUpdateEngine } from './RealTimeUpdateEngine';

// Update managers
export { TrustScoreUpdateManager } from './TrustScoreUpdateManager';
export { IncrementalUpdateManager } from './IncrementalUpdateManager';

// Event sources
export { BlockchainEventSource } from './event_sources/BlockchainEventSource';
export { FraudDetectionEventSource } from './event_sources/FraudDetectionEventSource';
export { SocialMediaEventSource } from './event_sources/SocialMediaEventSource';
export { MarketConditionEventSource } from './event_sources/MarketConditionEventSource';

// Event processing
export { EventPrioritizer } from './event_processing/EventPrioritizer';
export { EventRouter } from './event_processing/EventRouter';

// Notifications
export { NotificationGenerator } from './notifications/NotificationGenerator';
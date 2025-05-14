/**
 * RealTimeUpdateEngine.ts
 * 
 * Main entry point for the Real-Time Update System that keeps trust scores, price predictions,
 * and risk assessments continuously updated based on new information.
 * 
 * This system integrates multiple event sources, processes events, triggers appropriate updates,
 * and notifies users of significant changes.
 */

import { EventEmitter } from 'events';
import { TrustScoreUpdateManager } from './TrustScoreUpdateManager';
import { IncrementalUpdateManager } from './IncrementalUpdateManager';
import { BlockchainEventSource } from './event_sources/BlockchainEventSource';
import { FraudDetectionEventSource } from './event_sources/FraudDetectionEventSource';
import { SocialMediaEventSource } from './event_sources/SocialMediaEventSource';
import { MarketConditionEventSource } from './event_sources/MarketConditionEventSource';
import { HathorEventSource } from './event_sources/HathorEventSource';
import { EventPrioritizer } from './event_processing/EventPrioritizer';
import { EventRouter } from './event_processing/EventRouter';
import { NotificationGenerator } from './notifications/NotificationGenerator';
import { TrustScoreTypes } from '../types';

/**
 * Configuration for the Real-Time Update Engine
 */
export interface RealTimeUpdateEngineConfig {
  // Event source configurations
  blockchainEventSourceConfig?: any;
  fraudDetectionEventSourceConfig?: any;
  socialMediaEventSourceConfig?: any;
  marketConditionEventSourceConfig?: any;
  hathorEventSourceConfig?: any;
  
  // Event processing configurations
  eventPrioritizerConfig?: any;
  eventRouterConfig?: any;
  
  // Notification configurations
  notificationGeneratorConfig?: any;
  
  // General configurations
  enabledEventSources: {
    blockchain: boolean;
    fraudDetection: boolean;
    socialMedia: boolean;
    marketCondition: boolean;
    hathor: boolean;
  };
  maxConcurrentUpdates: number;
  updateQueueSize: number;
}

/**
 * Main class for the Real-Time Update Engine
 */
export class RealTimeUpdateEngine extends EventEmitter {
  private trustScoreUpdateManager: TrustScoreUpdateManager;
  private incrementalUpdateManager: IncrementalUpdateManager;
  
  // Event sources
  private blockchainEventSource?: BlockchainEventSource;
  private fraudDetectionEventSource?: FraudDetectionEventSource;
  private socialMediaEventSource?: SocialMediaEventSource;
  private marketConditionEventSource?: MarketConditionEventSource;
  private hathorEventSource?: HathorEventSource;
  
  // Event processing
  private eventPrioritizer: EventPrioritizer;
  private eventRouter: EventRouter;
  
  // Notification generation
  private notificationGenerator: NotificationGenerator;
  
  // State tracking
  private isRunning: boolean = false;
  private updateQueue: TrustScoreTypes.UpdateEvent[] = [];
  private activeUpdates: Set<string> = new Set();
  private config: RealTimeUpdateEngineConfig;
  
  /**
   * Initialize the Real-Time Update Engine
   * 
   * @param trustScoreUpdateManager Reference to the trust score update manager
   * @param incrementalUpdateManager Reference to the incremental update manager
   * @param config Configuration for the real-time update engine
   */
  constructor(
    trustScoreUpdateManager: TrustScoreUpdateManager,
    incrementalUpdateManager: IncrementalUpdateManager,
    config: RealTimeUpdateEngineConfig
  ) {
    super();
    this.trustScoreUpdateManager = trustScoreUpdateManager;
    this.incrementalUpdateManager = incrementalUpdateManager;
    this.config = this.getDefaultConfig(config);
    
    // Initialize event processing components
    this.eventPrioritizer = new EventPrioritizer(this.config.eventPrioritizerConfig);
    this.eventRouter = new EventRouter(this.config.eventRouterConfig);
    
    // Initialize notification generator
    this.notificationGenerator = new NotificationGenerator(this.config.notificationGeneratorConfig);
    
    // Initialize event sources
    this.initializeEventSources();
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<RealTimeUpdateEngineConfig>): RealTimeUpdateEngineConfig {
    return {
      enabledEventSources: {
        blockchain: true,
        fraudDetection: true,
        socialMedia: true,
        marketCondition: true,
        hathor: true,
        ...config.enabledEventSources
      },
      maxConcurrentUpdates: 10,
      updateQueueSize: 1000,
      ...config
    };
  }
  
  /**
   * Initialize all enabled event sources
   */
  private initializeEventSources(): void {
    if (this.config.enabledEventSources.blockchain) {
      this.blockchainEventSource = new BlockchainEventSource(this.config.blockchainEventSourceConfig);
      this.setupEventSourceListeners(this.blockchainEventSource, 'blockchain');
    }
    
    if (this.config.enabledEventSources.fraudDetection) {
      this.fraudDetectionEventSource = new FraudDetectionEventSource(this.config.fraudDetectionEventSourceConfig);
      this.setupEventSourceListeners(this.fraudDetectionEventSource, 'fraudDetection');
    }
    
    if (this.config.enabledEventSources.socialMedia) {
      this.socialMediaEventSource = new SocialMediaEventSource(this.config.socialMediaEventSourceConfig);
      this.setupEventSourceListeners(this.socialMediaEventSource, 'socialMedia');
    }
    
    if (this.config.enabledEventSources.marketCondition) {
      this.marketConditionEventSource = new MarketConditionEventSource(this.config.marketConditionEventSourceConfig);
      this.setupEventSourceListeners(this.marketConditionEventSource, 'marketCondition');
    }
    
    if (this.config.enabledEventSources.hathor) {
      this.hathorEventSource = new HathorEventSource(this.config.hathorEventSourceConfig);
      this.setupEventSourceListeners(this.hathorEventSource, 'hathor');
    }
  }
  
  /**
   * Set up event listeners for an event source
   * 
   * @param eventSource The event source to set up listeners for
   * @param sourceName The name of the event source
   */
  private setupEventSourceListeners(eventSource: EventEmitter, sourceName: string): void {
    eventSource.on('event', (event: TrustScoreTypes.UpdateEvent) => {
      this.handleEvent(event, sourceName);
    });
    
    eventSource.on('error', (error: Error) => {
      console.error(`Error in ${sourceName} event source:`, error);
      this.emit('error', { source: sourceName, error });
    });
  }
  
  /**
   * Handle an incoming event from any source
   * 
   * @param event The event to handle
   * @param sourceName The name of the source that generated the event
   */
  private handleEvent(event: TrustScoreTypes.UpdateEvent, sourceName: string): void {
    // Add source information to the event
    const enrichedEvent = {
      ...event,
      source: sourceName,
      receivedAt: Date.now()
    };
    
    // Prioritize the event
    const prioritizedEvent = this.eventPrioritizer.prioritize(enrichedEvent);
    
    // Add to update queue
    this.addToUpdateQueue(prioritizedEvent);
    
    // Process the queue if we're running
    if (this.isRunning) {
      this.processUpdateQueue();
    }
  }
  
  /**
   * Add an event to the update queue
   * 
   * @param event The event to add to the queue
   */
  private addToUpdateQueue(event: TrustScoreTypes.UpdateEvent): void {
    // Check for duplicates
    const isDuplicate = this.updateQueue.some(queuedEvent => 
      queuedEvent.entityId === event.entityId && 
      queuedEvent.eventType === event.eventType
    );
    
    if (!isDuplicate) {
      // Add to queue, respecting max size
      if (this.updateQueue.length >= this.config.updateQueueSize) {
        // Remove lowest priority event if queue is full
        this.updateQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.updateQueue.pop();
      }
      
      this.updateQueue.push(event);
      this.emit('queueUpdated', { queueSize: this.updateQueue.length });
    }
  }
  
  /**
   * Process events in the update queue
   */
  private processUpdateQueue(): void {
    // Sort by priority (highest first)
    this.updateQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Process up to maxConcurrentUpdates
    const availableSlots = this.config.maxConcurrentUpdates - this.activeUpdates.size;
    
    if (availableSlots <= 0 || this.updateQueue.length === 0) {
      return;
    }
    
    // Take events that can be processed now
    const eventsToProcess = this.updateQueue.slice(0, availableSlots);
    this.updateQueue = this.updateQueue.slice(availableSlots);
    
    // Process each event
    eventsToProcess.forEach(event => {
      this.processEvent(event);
    });
  }
  
  /**
   * Process a single event
   * 
   * @param event The event to process
   */
  private async processEvent(event: TrustScoreTypes.UpdateEvent): Promise<void> {
    // Mark as active
    const eventId = `${event.entityId}-${event.eventType}-${event.receivedAt}`;
    this.activeUpdates.add(eventId);
    
    try {
      // Route the event to the appropriate handler
      const routingResult = this.eventRouter.route(event);
      
      // Process the event based on routing
      if (routingResult.shouldUpdate) {
        // Trigger the update
        await this.trustScoreUpdateManager.processUpdateEvent(event);
        
        // Check if notification should be generated
        if (routingResult.shouldNotify) {
          const notification = this.notificationGenerator.generateNotification(event);
          this.emit('notification', notification);
        }
      }
      
      // Emit completion event
      this.emit('eventProcessed', { eventId, success: true });
    } catch (error) {
      console.error('Error processing event:', error);
      this.emit('eventProcessed', { eventId, success: false, error });
    } finally {
      // Remove from active set
      this.activeUpdates.delete(eventId);
      
      // Continue processing queue
      this.processUpdateQueue();
    }
  }
  
  /**
   * Start the real-time update engine
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // Start all event sources
    if (this.blockchainEventSource) {
      this.blockchainEventSource.start();
    }
    
    if (this.fraudDetectionEventSource) {
      this.fraudDetectionEventSource.start();
    }
    
    if (this.socialMediaEventSource) {
      this.socialMediaEventSource.start();
    }
    
    if (this.marketConditionEventSource) {
      this.marketConditionEventSource.start();
    }
    
    if (this.hathorEventSource) {
      this.hathorEventSource.start();
    }
    
    // Start processing the queue
    this.processUpdateQueue();
    
    this.emit('started');
  }
  
  /**
   * Stop the real-time update engine
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Stop all event sources
    if (this.blockchainEventSource) {
      this.blockchainEventSource.stop();
    }
    
    if (this.fraudDetectionEventSource) {
      this.fraudDetectionEventSource.stop();
    }
    
    if (this.socialMediaEventSource) {
      this.socialMediaEventSource.stop();
    }
    
    if (this.marketConditionEventSource) {
      this.marketConditionEventSource.stop();
    }
    
    if (this.hathorEventSource) {
      this.hathorEventSource.stop();
    }
    
    this.emit('stopped');
  }
  
  /**
   * Get the current status of the real-time update engine
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      queueSize: this.updateQueue.length,
      activeUpdates: this.activeUpdates.size,
      eventSources: {
        blockchain: this.blockchainEventSource?.getStatus(),
        fraudDetection: this.fraudDetectionEventSource?.getStatus(),
        socialMedia: this.socialMediaEventSource?.getStatus(),
        marketCondition: this.marketConditionEventSource?.getStatus(),
        hathor: this.hathorEventSource?.getStatus()
      }
    };
  }
}
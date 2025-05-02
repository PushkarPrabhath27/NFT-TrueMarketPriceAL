/**
 * index.ts
 * 
 * Exports all components of the Event Processing and Routing system.
 * This module implements the event classification, prioritization, queue management,
 * and dispatch mechanisms for the Real-Time Update System.
 */

// Export event classifier
export { EventClassifier, ClassificationResult } from './EventClassifier';

// Export event prioritizer
export { EventPrioritizer } from './EventPrioritizer';

// Export processing queue manager
export { ProcessingQueueManager, QueueStats, EventBatch } from './ProcessingQueueManager';

// Export event router
export { EventRouter, RoutingResult } from './EventRouter';

// Export event dispatcher
export { EventDispatcher, HandlerRegistration, EventHandlerFunction, DispatchResult } from './EventDispatcher';

/**
 * EventProcessingSystem - Main class that integrates all event processing components
 * 
 * This class provides a unified interface for the event processing system, combining
 * classification, prioritization, queue management, routing, and dispatch.
 */

import { EventEmitter } from 'events';
import { TrustScoreTypes } from '../../types';
import { EventClassifier } from './EventClassifier';
import { EventPrioritizer } from './EventPrioritizer';
import { ProcessingQueueManager } from './ProcessingQueueManager';
import { EventRouter } from './EventRouter';
import { EventDispatcher, EventHandlerFunction } from './EventDispatcher';

/**
 * Configuration for the event processing system
 */
export interface EventProcessingSystemConfig {
  // Component configurations
  classifierConfig?: any;
  prioritizerConfig?: any;
  queueManagerConfig?: any;
  routerConfig?: any;
  dispatcherConfig?: any;
}

/**
 * Integrated event processing system that combines all components
 */
export class EventProcessingSystem extends EventEmitter {
  // Component instances
  private classifier: EventClassifier;
  private prioritizer: EventPrioritizer;
  private queueManager: ProcessingQueueManager;
  private router: EventRouter;
  private dispatcher: EventDispatcher;
  
  /**
   * Initialize the Event Processing System
   * 
   * @param config Configuration for the event processing system
   */
  constructor(config: EventProcessingSystemConfig = {}) {
    super();
    
    // Initialize components
    this.classifier = new EventClassifier(config.classifierConfig);
    this.prioritizer = new EventPrioritizer(config.prioritizerConfig);
    this.queueManager = new ProcessingQueueManager(config.queueManagerConfig);
    this.router = new EventRouter(config.routerConfig);
    this.dispatcher = new EventDispatcher(config.dispatcherConfig);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners between components
   */
  private setupEventListeners(): void {
    // Forward relevant events from components
    this.queueManager.on('event_processed', (data) => this.emit('event_processed', data));
    this.queueManager.on('event_enqueued', (data) => this.emit('event_enqueued', data));
    this.queueManager.on('batch_processing_complete', (data) => this.emit('batch_processing_complete', data));
    this.queueManager.on('event_processing_failure', (data) => this.emit('event_processing_failure', data));
    
    this.dispatcher.on('event_dispatched', (data) => this.emit('event_dispatched', data));
    this.dispatcher.on('event_processed', (data) => this.emit('event_processed', data));
    this.dispatcher.on('dispatch_error', (data) => this.emit('dispatch_error', data));
  }
  
  /**
   * Process an event through the entire pipeline
   * 
   * @param event The event to process
   * @returns Promise that resolves when the event has been processed
   */
  public async processEvent(event: TrustScoreTypes.UpdateEvent): Promise<void> {
    try {
      // Step 1: Classify the event
      const classification = this.classifier.classify(event);
      
      // Step 2: Prioritize the event
      const priority = this.prioritizer.getPriority(event);
      event.priority = priority;
      
      // Step 3: Determine routing
      const routingResult = this.router.determineRouting(event);
      
      // Step 4: If event should be updated, enqueue it
      if (routingResult.shouldUpdate) {
        // Determine appropriate queue based on event source
        const queueTopic = event.source || 'default';
        
        // Enqueue the event
        this.queueManager.enqueue(event, queueTopic);
      }
      
      // Step 5: If event should generate notification, dispatch it
      if (routingResult.shouldNotify) {
        // Create notification event
        const notificationEvent: TrustScoreTypes.UpdateEvent = {
          ...event,
          id: `notification-${event.id}`,
          eventType: `notification_${event.eventType}`,
          priority: routingResult.notificationPriority || event.priority
        };
        
        // Dispatch notification event
        await this.dispatcher.dispatch(notificationEvent, classification);
      }
      
      // Emit event processed event
      this.emit('event_pipeline_complete', { event, classification, routingResult });
    } catch (error) {
      // Emit error event
      this.emit('event_pipeline_error', { event, error });
      
      // Re-throw error
      throw error;
    }
  }
  
  /**
   * Register an event handler
   * 
   * @param name Handler name
   * @param eventTypes Event types the handler can process
   * @param entityTypes Entity types the handler can process
   * @param handler Handler function
   * @param options Additional options
   * @returns Handler ID
   */
  public registerHandler(
    name: string,
    eventTypes: string[],
    entityTypes: string[],
    handler: EventHandlerFunction,
    options: { requiresSync?: boolean, priority?: number } = {}
  ): string {
    const registration = this.dispatcher.registerHandler({
      name,
      eventTypes,
      entityTypes,
      handler,
      requiresSync: options.requiresSync || false,
      priority: options.priority || 5
    });
    
    // Return handler ID
    return registration ? name : '';
  }
  
  /**
   * Get the event classifier instance
   * 
   * @returns Event classifier instance
   */
  public getClassifier(): EventClassifier {
    return this.classifier;
  }
  
  /**
   * Get the event prioritizer instance
   * 
   * @returns Event prioritizer instance
   */
  public getPrioritizer(): EventPrioritizer {
    return this.prioritizer;
  }
  
  /**
   * Get the processing queue manager instance
   * 
   * @returns Processing queue manager instance
   */
  public getQueueManager(): ProcessingQueueManager {
    return this.queueManager;
  }
  
  /**
   * Get the event router instance
   * 
   * @returns Event router instance
   */
  public getRouter(): EventRouter {
    return this.router;
  }
  
  /**
   * Get the event dispatcher instance
   * 
   * @returns Event dispatcher instance
   */
  public getDispatcher(): EventDispatcher {
    return this.dispatcher;
  }
}
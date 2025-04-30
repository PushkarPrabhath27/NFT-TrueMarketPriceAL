/**
 * EventProcessor.ts
 * 
 * Implements the event-driven architecture for processing trust score updates.
 * This component supports the technical considerations for scalable processing
 * pipelines and asynchronous processing for intensive operations.
 */

import { TrustScoreTypes } from '../types';
import { TrustScoreUpdateManager } from '../updates/TrustScoreUpdateManager';

/**
 * Configuration options for the event processor
 */
export interface EventProcessorConfig {
  // Maximum number of events to process in parallel
  maxConcurrentProcessing: number;
  // Maximum number of events to queue before throttling
  maxQueueSize: number;
  // Retry configuration for failed events
  retryConfig: {
    maxRetries: number;
    initialDelayMs: number;
    backoffMultiplier: number;
  };
  // Whether to prioritize certain event types
  enablePrioritization: boolean;
  // Priority levels for different event types (higher number = higher priority)
  eventPriorities: Map<string, number>;
}

/**
 * Event processing statistics for monitoring
 */
export interface EventProcessingStats {
  totalEventsReceived: number;
  totalEventsProcessed: number;
  totalEventsFailed: number;
  totalEventsRetried: number;
  averageProcessingTimeMs: number;
  queueSize: number;
  activeProcessingCount: number;
  eventTypeBreakdown: Map<string, number>;
  lastProcessedTimestamp?: string;
}

/**
 * Event processor for handling trust score update events
 */
export class EventProcessor {
  private config: EventProcessorConfig;
  private updateManager: TrustScoreUpdateManager;
  private eventQueue: TrustScoreTypes.UpdateEvent[];
  private processingEvents: Set<string>; // Set of event IDs currently being processed
  private stats: EventProcessingStats;
  private isProcessing: boolean;
  
  /**
   * Initialize the event processor with configuration
   * 
   * @param updateManager The trust score update manager
   * @param config Configuration options for the event processor
   */
  constructor(updateManager: TrustScoreUpdateManager, config?: Partial<EventProcessorConfig>) {
    this.updateManager = updateManager;
    this.eventQueue = [];
    this.processingEvents = new Set<string>();
    this.isProcessing = false;
    
    // Initialize statistics
    this.stats = {
      totalEventsReceived: 0,
      totalEventsProcessed: 0,
      totalEventsFailed: 0,
      totalEventsRetried: 0,
      averageProcessingTimeMs: 0,
      queueSize: 0,
      activeProcessingCount: 0,
      eventTypeBreakdown: new Map<string, number>()
    };
    
    // Default configuration
    this.config = {
      maxConcurrentProcessing: 10,
      maxQueueSize: 1000,
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2
      },
      enablePrioritization: true,
      eventPriorities: new Map<string, number>([
        ['fraud_detection', 10], // Highest priority
        ['sale', 8],
        ['transfer', 7],
        ['marketplace_verification', 6],
        ['metadata_update', 5],
        ['social_signal', 3],
        ['default', 1] // Default priority
      ]),
      ...config
    };
  }
  
  /**
   * Process a new update event
   * 
   * @param event The update event to process
   */
  public async processEvent(event: TrustScoreTypes.UpdateEvent): Promise<void> {
    // Update statistics
    this.stats.totalEventsReceived++;
    this.updateEventTypeStats(event.eventType);
    
    // Check if queue is full
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn(`Event queue is full (${this.eventQueue.length} events). Throttling new events.`);
      // In a real implementation, this might trigger alerts or scaling
      return;
    }
    
    // Add event to queue
    this.eventQueue.push(event);
    this.stats.queueSize = this.eventQueue.length;
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processEventQueue();
    }
  }
  
  /**
   * Process events from the queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.eventQueue.length > 0 && this.processingEvents.size < this.config.maxConcurrentProcessing) {
        // Get next event based on priority if enabled
        const event = this.getNextEvent();
        if (!event) {
          break;
        }
        
        // Generate a unique ID for the event
        const eventId = `${event.entityType}:${event.entityId}:${event.eventType}:${event.timestamp}`;
        
        // Mark as processing
        this.processingEvents.add(eventId);
        this.stats.activeProcessingCount = this.processingEvents.size;
        
        // Process event asynchronously
        this.processEventAsync(event, eventId, 0);
      }
    } finally {
      // If there are more events and capacity, continue processing
      if (this.eventQueue.length > 0 && this.processingEvents.size < this.config.maxConcurrentProcessing) {
        setTimeout(() => this.processEventQueue(), 0);
      } else {
        this.isProcessing = false;
      }
    }
  }
  
  /**
   * Process an event asynchronously with retry logic
   * 
   * @param event The event to process
   * @param eventId Unique identifier for the event
   * @param retryCount Current retry count
   */
  private async processEventAsync(event: TrustScoreTypes.UpdateEvent, eventId: string, retryCount: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Forward to update manager
      await this.updateManager.handleUpdateEvent(event);
      
      // Update statistics
      this.stats.totalEventsProcessed++;
      this.updateProcessingTime(Date.now() - startTime);
      this.stats.lastProcessedTimestamp = new Date().toISOString();
    } catch (error) {
      console.error(`Error processing event ${eventId}:`, error);
      
      // Update statistics
      this.stats.totalEventsFailed++;
      
      // Retry if not exceeded max retries
      if (retryCount < this.config.retryConfig.maxRetries) {
        this.stats.totalEventsRetried++;
        
        // Calculate delay with exponential backoff
        const delay = this.config.retryConfig.initialDelayMs * 
          Math.pow(this.config.retryConfig.backoffMultiplier, retryCount);
        
        console.log(`Retrying event ${eventId} in ${delay}ms (retry ${retryCount + 1}/${this.config.retryConfig.maxRetries})`);
        
        // Schedule retry
        setTimeout(() => {
          this.processEventAsync(event, eventId, retryCount + 1);
        }, delay);
        
        return;
      }
    } finally {
      // Mark as done processing
      this.processingEvents.delete(eventId);
      this.stats.activeProcessingCount = this.processingEvents.size;
      
      // Continue processing queue if there are more events
      if (this.eventQueue.length > 0 && !this.isProcessing) {
        this.processEventQueue();
      }
    }
  }
  
  /**
   * Get the next event from the queue based on priority
   * 
   * @returns The next event to process or undefined if queue is empty
   */
  private getNextEvent(): TrustScoreTypes.UpdateEvent | undefined {
    if (this.eventQueue.length === 0) {
      return undefined;
    }
    
    if (!this.config.enablePrioritization) {
      // Simple FIFO if prioritization is disabled
      return this.eventQueue.shift();
    }
    
    // Find highest priority event
    let highestPriorityIndex = 0;
    let highestPriority = this.getEventPriority(this.eventQueue[0]);
    
    for (let i = 1; i < this.eventQueue.length; i++) {
      const priority = this.getEventPriority(this.eventQueue[i]);
      if (priority > highestPriority) {
        highestPriority = priority;
        highestPriorityIndex = i;
      }
    }
    
    // Remove and return the highest priority event
    const event = this.eventQueue[highestPriorityIndex];
    this.eventQueue.splice(highestPriorityIndex, 1);
    this.stats.queueSize = this.eventQueue.length;
    
    return event;
  }
  
  /**
   * Get the priority level for an event
   * 
   * @param event The event to get priority for
   * @returns The priority level
   */
  private getEventPriority(event: TrustScoreTypes.UpdateEvent): number {
    return this.config.eventPriorities.get(event.eventType) || 
           this.config.eventPriorities.get('default') || 
           1;
  }
  
  /**
   * Update the event type statistics
   * 
   * @param eventType The type of event
   */
  private updateEventTypeStats(eventType: string): void {
    const count = this.stats.eventTypeBreakdown.get(eventType) || 0;
    this.stats.eventTypeBreakdown.set(eventType, count + 1);
  }
  
  /**
   * Update the average processing time
   * 
   * @param processingTimeMs The processing time in milliseconds
   */
  private updateProcessingTime(processingTimeMs: number): void {
    // Calculate new average
    const totalProcessed = this.stats.totalEventsProcessed;
    const currentAverage = this.stats.averageProcessingTimeMs;
    
    this.stats.averageProcessingTimeMs = 
      (currentAverage * (totalProcessed - 1) + processingTimeMs) / totalProcessed;
  }
  
  /**
   * Get current event processing statistics
   * 
   * @returns Current statistics
   */
  public getStats(): EventProcessingStats {
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalEventsReceived: 0,
      totalEventsProcessed: 0,
      totalEventsFailed: 0,
      totalEventsRetried: 0,
      averageProcessingTimeMs: 0,
      queueSize: this.eventQueue.length,
      activeProcessingCount: this.processingEvents.size,
      eventTypeBreakdown: new Map<string, number>()
    };
  }
}
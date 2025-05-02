/**
 * ProcessingQueueManager.ts
 * 
 * Implements the event queue management component of the Real-Time Update System.
 * Responsible for managing distributed queues, optimizing event processing,
 * and ensuring reliable delivery of events to appropriate handlers.
 */

import { EventEmitter } from 'events';
import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the processing queue manager
 */
export interface ProcessingQueueManagerConfig {
  // Maximum number of events in each queue
  maxQueueSize: number;
  // Maximum number of retry attempts for failed events
  maxRetryAttempts: number;
  // Base delay for retry backoff (in milliseconds)
  retryBaseDelayMs: number;
  // Whether to enable batching of similar events
  enableBatching: boolean;
  // Whether to enable deduplication of redundant events
  enableDeduplication: boolean;
  // Whether to enable conflation of rapidly changing entities
  enableConflation: boolean;
  // Maximum batch size for processing
  maxBatchSize: number;
  // Number of partitions for parallel processing
  partitionCount: number;
}

/**
 * Queue statistics for monitoring
 */
export interface QueueStats {
  // Current number of events in the queue
  queueDepth: number;
  // Average processing time (in milliseconds)
  avgProcessingTimeMs: number;
  // Number of events processed per second
  throughputPerSecond: number;
  // Number of failed events
  failedCount: number;
  // Number of retried events
  retriedCount: number;
  // Number of dead-lettered events
  deadLetteredCount: number;
}

/**
 * Event batch for processing
 */
export interface EventBatch {
  // Topic of the batch
  topic: string;
  // Events in the batch
  events: TrustScoreTypes.UpdateEvent[];
  // Batch ID
  batchId: string;
  // Creation timestamp
  createdAt: number;
}

/**
 * Manages event queues for reliable and efficient processing
 */
export class ProcessingQueueManager extends EventEmitter {
  private config: ProcessingQueueManagerConfig;
  private queues: Map<string, TrustScoreTypes.UpdateEvent[]> = new Map();
  private processingStats: Map<string, QueueStats> = new Map();
  private failedEvents: Map<string, { event: TrustScoreTypes.UpdateEvent, attempts: number }> = new Map();
  private entityLastEventMap: Map<string, TrustScoreTypes.UpdateEvent> = new Map();
  private isProcessing: Map<string, boolean> = new Map();
  
  /**
   * Initialize the Processing Queue Manager
   * 
   * @param config Configuration for the processing queue manager
   */
  constructor(config: Partial<ProcessingQueueManagerConfig> = {}) {
    super();
    this.config = this.getDefaultConfig(config);
    this.initializeQueues();
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<ProcessingQueueManagerConfig>): ProcessingQueueManagerConfig {
    return {
      maxQueueSize: 10000,
      maxRetryAttempts: 3,
      retryBaseDelayMs: 1000,
      enableBatching: true,
      enableDeduplication: true,
      enableConflation: true,
      maxBatchSize: 100,
      partitionCount: 4,
      ...config
    };
  }
  
  /**
   * Initialize queue structures
   */
  private initializeQueues(): void {
    // Create default topics
    const defaultTopics = [
      'blockchain',
      'fraud_detection',
      'social_media',
      'market_condition',
      'high_priority',
      'dead_letter'
    ];
    
    // Initialize queues and stats for each topic
    defaultTopics.forEach(topic => {
      this.queues.set(topic, []);
      this.processingStats.set(topic, this.createDefaultStats());
      this.isProcessing.set(topic, false);
    });
  }
  
  /**
   * Create default queue statistics
   */
  private createDefaultStats(): QueueStats {
    return {
      queueDepth: 0,
      avgProcessingTimeMs: 0,
      throughputPerSecond: 0,
      failedCount: 0,
      retriedCount: 0,
      deadLetteredCount: 0
    };
  }
  
  /**
   * Enqueue an event for processing
   * 
   * @param event The event to enqueue
   * @param topic The topic to enqueue the event to
   * @returns True if the event was successfully enqueued, false otherwise
   */
  public enqueue(event: TrustScoreTypes.UpdateEvent, topic: string): boolean {
    // Ensure the topic exists
    if (!this.queues.has(topic)) {
      this.queues.set(topic, []);
      this.processingStats.set(topic, this.createDefaultStats());
      this.isProcessing.set(topic, false);
    }
    
    const queue = this.queues.get(topic)!;
    
    // Check if queue is full
    if (queue.length >= this.config.maxQueueSize) {
      this.emit('queue_full', { topic, event });
      return false;
    }
    
    // Apply deduplication if enabled
    if (this.config.enableDeduplication && this.isDuplicate(event, topic)) {
      this.emit('event_deduplicated', { topic, event });
      return true;
    }
    
    // Apply conflation if enabled
    if (this.config.enableConflation && this.conflateEvent(event, topic)) {
      this.emit('event_conflated', { topic, event });
      return true;
    }
    
    // Add event to queue
    queue.push(event);
    
    // Update queue stats
    const stats = this.processingStats.get(topic)!;
    stats.queueDepth = queue.length;
    
    // Emit event enqueued event
    this.emit('event_enqueued', { topic, event });
    
    // Start processing if not already processing
    if (!this.isProcessing.get(topic)) {
      this.processQueue(topic);
    }
    
    return true;
  }
  
  /**
   * Check if an event is a duplicate of an existing event in the queue
   * 
   * @param event The event to check
   * @param topic The topic to check in
   * @returns True if the event is a duplicate, false otherwise
   */
  private isDuplicate(event: TrustScoreTypes.UpdateEvent, topic: string): boolean {
    const queue = this.queues.get(topic)!;
    
    // Check for exact duplicates (same event ID)
    return queue.some(queuedEvent => queuedEvent.id === event.id);
  }
  
  /**
   * Conflate an event with existing events for the same entity
   * 
   * @param event The event to conflate
   * @param topic The topic to check in
   * @returns True if the event was conflated, false otherwise
   */
  private conflateEvent(event: TrustScoreTypes.UpdateEvent, topic: string): boolean {
    // Only conflate events for the same entity and same type
    if (!event.entityId || !event.entityType || !event.eventType) {
      return false;
    }
    
    const entityKey = `${event.entityType}:${event.entityId}:${event.eventType}`;
    const queue = this.queues.get(topic)!;
    
    // Find existing events for the same entity
    const existingIndex = queue.findIndex(queuedEvent => 
      queuedEvent.entityId === event.entityId && 
      queuedEvent.entityType === event.entityType &&
      queuedEvent.eventType === event.eventType
    );
    
    if (existingIndex >= 0) {
      // Replace the existing event with the new one
      queue[existingIndex] = event;
      this.entityLastEventMap.set(entityKey, event);
      return true;
    }
    
    // No existing event found for conflation
    this.entityLastEventMap.set(entityKey, event);
    return false;
  }
  
  /**
   * Process events in a queue
   * 
   * @param topic The topic to process
   */
  private async processQueue(topic: string): Promise<void> {
    // Mark queue as processing
    this.isProcessing.set(topic, true);
    
    try {
      const queue = this.queues.get(topic)!;
      
      // Process until queue is empty
      while (queue.length > 0) {
        // Get batch of events to process
        const batch = this.createBatch(topic);
        
        if (batch.events.length === 0) {
          break;
        }
        
        // Emit batch processing start event
        this.emit('batch_processing_start', { topic, batchId: batch.batchId, eventCount: batch.events.length });
        
        try {
          // Process the batch
          const startTime = Date.now();
          await this.processBatch(batch);
          const processingTime = Date.now() - startTime;
          
          // Update processing stats
          this.updateProcessingStats(topic, batch.events.length, processingTime);
          
          // Emit batch processing complete event
          this.emit('batch_processing_complete', { 
            topic, 
            batchId: batch.batchId, 
            eventCount: batch.events.length,
            processingTimeMs: processingTime
          });
        } catch (error) {
          // Handle batch processing failure
          this.handleBatchFailure(batch, error);
        }
      }
    } finally {
      // Mark queue as not processing
      this.isProcessing.set(topic, false);
      
      // If new events were added during processing, start processing again
      const queue = this.queues.get(topic)!;
      if (queue.length > 0) {
        this.processQueue(topic);
      }
    }
  }
  
  /**
   * Create a batch of events for processing
   * 
   * @param topic The topic to create a batch from
   * @returns A batch of events
   */
  private createBatch(topic: string): EventBatch {
    const queue = this.queues.get(topic)!;
    const batchSize = Math.min(this.config.maxBatchSize, queue.length);
    const events = queue.splice(0, batchSize);
    
    return {
      topic,
      events,
      batchId: `batch-${topic}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
  }
  
  /**
   * Process a batch of events
   * 
   * @param batch The batch to process
   */
  private async processBatch(batch: EventBatch): Promise<void> {
    // In a real implementation, this would dispatch to appropriate handlers
    // For now, we'll just emit an event for each processed event
    
    for (const event of batch.events) {
      try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Emit event processed event
        this.emit('event_processed', { topic: batch.topic, event });
      } catch (error) {
        // Handle individual event processing failure
        this.handleEventFailure(event, error);
      }
    }
  }
  
  /**
   * Handle batch processing failure
   * 
   * @param batch The batch that failed
   * @param error The error that occurred
   */
  private handleBatchFailure(batch: EventBatch, error: any): void {
    // Emit batch processing failure event
    this.emit('batch_processing_failure', { 
      topic: batch.topic, 
      batchId: batch.batchId, 
      eventCount: batch.events.length,
      error
    });
    
    // Requeue individual events for retry
    for (const event of batch.events) {
      this.handleEventFailure(event, error);
    }
  }
  
  /**
   * Handle individual event processing failure
   * 
   * @param event The event that failed
   * @param error The error that occurred
   */
  private handleEventFailure(event: TrustScoreTypes.UpdateEvent, error: any): void {
    // Get current retry count
    const failedEvent = this.failedEvents.get(event.id);
    const attempts = failedEvent ? failedEvent.attempts + 1 : 1;
    
    // Update failed event tracking
    this.failedEvents.set(event.id, { event, attempts });
    
    // Emit event processing failure event
    this.emit('event_processing_failure', { event, error, attempts });
    
    // Update stats
    const stats = this.processingStats.get(event.source || 'blockchain')!;
    stats.failedCount++;
    
    // Check if max retry attempts reached
    if (attempts > this.config.maxRetryAttempts) {
      // Move to dead letter queue
      this.moveToDeadLetterQueue(event, error);
    } else {
      // Schedule retry with exponential backoff
      const delay = this.calculateRetryDelay(attempts);
      setTimeout(() => this.retryEvent(event), delay);
      
      // Update stats
      stats.retriedCount++;
    }
  }
  
  /**
   * Calculate retry delay with exponential backoff
   * 
   * @param attempts The number of retry attempts
   * @returns The delay in milliseconds
   */
  private calculateRetryDelay(attempts: number): number {
    return this.config.retryBaseDelayMs * Math.pow(2, attempts - 1);
  }
  
  /**
   * Retry processing an event
   * 
   * @param event The event to retry
   */
  private retryEvent(event: TrustScoreTypes.UpdateEvent): void {
    // Determine appropriate topic
    const topic = event.source || 'blockchain';
    
    // Enqueue for retry
    this.enqueue(event, topic);
    
    // Emit event retry event
    this.emit('event_retry', { topic, event });
  }
  
  /**
   * Move an event to the dead letter queue
   * 
   * @param event The event to move
   * @param error The error that occurred
   */
  private moveToDeadLetterQueue(event: TrustScoreTypes.UpdateEvent, error: any): void {
    // Add to dead letter queue
    this.enqueue(event, 'dead_letter');
    
    // Update stats
    const stats = this.processingStats.get('dead_letter')!;
    stats.deadLetteredCount++;
    
    // Emit dead letter event
    this.emit('event_dead_lettered', { event, error });
  }
  
  /**
   * Update processing statistics
   * 
   * @param topic The topic to update stats for
   * @param processedCount The number of events processed
   * @param processingTimeMs The time taken to process the events
   */
  private updateProcessingStats(topic: string, processedCount: number, processingTimeMs: number): void {
    const stats = this.processingStats.get(topic)!;
    const queue = this.queues.get(topic)!;
    
    // Update queue depth
    stats.queueDepth = queue.length;
    
    // Update average processing time (weighted average)
    const alpha = 0.3; // Weighting factor for new value
    stats.avgProcessingTimeMs = (1 - alpha) * stats.avgProcessingTimeMs + alpha * (processingTimeMs / processedCount);
    
    // Update throughput (events per second)
    const throughput = processedCount / (processingTimeMs / 1000);
    stats.throughputPerSecond = (1 - alpha) * stats.throughputPerSecond + alpha * throughput;
  }
  
  /**
   * Get statistics for all queues
   * 
   * @returns Map of queue statistics by topic
   */
  public getQueueStats(): Map<string, QueueStats> {
    return new Map(this.processingStats);
  }
  
  /**
   * Get statistics for a specific queue
   * 
   * @param topic The topic to get stats for
   * @returns Queue statistics or undefined if topic doesn't exist
   */
  public getQueueStatsByTopic(topic: string): QueueStats | undefined {
    return this.processingStats.get(topic);
  }
  
  /**
   * Get the current queue depth for a specific topic
   * 
   * @param topic The topic to get queue depth for
   * @returns The queue depth or 0 if topic doesn't exist
   */
  public getQueueDepth(topic: string): number {
    const queue = this.queues.get(topic);
    return queue ? queue.length : 0;
  }
  
  /**
   * Get the total number of events across all queues
   * 
   * @returns The total number of events
   */
  public getTotalQueuedEvents(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }
  
  /**
   * Clear all queues
   */
  public clearAllQueues(): void {
    for (const topic of this.queues.keys()) {
      this.clearQueue(topic);
    }
  }
  
  /**
   * Clear a specific queue
   * 
   * @param topic The topic to clear
   */
  public clearQueue(topic: string): void {
    const queue = this.queues.get(topic);
    if (queue) {
      queue.length = 0;
      const stats = this.processingStats.get(topic);
      if (stats) {
        stats.queueDepth = 0;
      }
      this.emit('queue_cleared', { topic });
    }
  }
}
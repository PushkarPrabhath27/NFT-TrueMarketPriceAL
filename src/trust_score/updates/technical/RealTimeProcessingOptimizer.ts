/**
 * RealTimeProcessingOptimizer.ts
 * 
 * This file implements the Real-time Processing Optimization component of the NFT TrustScore
 * real-time update system, handling memory-efficient data structures, optimized algorithms,
 * data locality, batching strategies, and adaptive processing based on system load.
 */

import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { ConfigManager } from '../config/ConfigManager';
import { BaseEvent } from './EventSourcingProcessor';

/**
 * Memory-efficient circular buffer for event processing
 */
export class CircularEventBuffer<T extends BaseEvent> {
  private buffer: (T | null)[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  private readonly capacity: number;
  
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T | null>(capacity).fill(null);
  }
  
  /**
   * Adds an event to the buffer, overwriting oldest if full
   */
  enqueue(event: T): void {
    this.buffer[this.tail] = event;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      // Buffer is full, move head to overwrite oldest item
      this.head = (this.head + 1) % this.capacity;
    }
  }
  
  /**
   * Removes and returns the oldest event from the buffer
   */
  dequeue(): T | null {
    if (this.size === 0) {
      return null;
    }
    
    const event = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    
    return event;
  }
  
  /**
   * Returns the current number of events in the buffer
   */
  getSize(): number {
    return this.size;
  }
  
  /**
   * Returns the maximum capacity of the buffer
   */
  getCapacity(): number {
    return this.capacity;
  }
  
  /**
   * Returns all events in the buffer without removing them
   */
  getAll(): T[] {
    const result: T[] = [];
    let current = this.head;
    
    for (let i = 0; i < this.size; i++) {
      if (this.buffer[current] !== null) {
        result.push(this.buffer[current] as T);
      }
      current = (current + 1) % this.capacity;
    }
    
    return result;
  }
}

/**
 * Batch processing configuration
 */
export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTimeMs: number;
  minBatchSize: number;
}

/**
 * Batch processor for efficient I/O operations
 */
export class BatchProcessor<T extends BaseEvent> {
  private buffer: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly config: BatchConfig;
  private readonly processor: (batch: T[]) => Promise<void>;
  private logger: Logger;
  private metrics: MetricsCollector;
  private processing: boolean = false;
  
  constructor(
    config: BatchConfig,
    processor: (batch: T[]) => Promise<void>,
    logger: Logger,
    metrics: MetricsCollector
  ) {
    this.config = config;
    this.processor = processor;
    this.logger = logger;
    this.metrics = metrics;
  }
  
  /**
   * Adds an event to the batch, triggering processing if conditions are met
   */
  async add(event: T): Promise<void> {
    this.buffer.push(event);
    this.metrics.recordGauge('batch_buffer_size', this.buffer.length);
    
    // Start timer if this is the first item and we don't have a timer yet
    if (this.buffer.length === 1 && !this.timer) {
      this.startTimer();
    }
    
    // Process immediately if we've reached max batch size
    if (this.buffer.length >= this.config.maxBatchSize) {
      await this.processBatch();
    }
  }
  
  /**
   * Starts the batch timer for delayed processing
   */
  private startTimer(): void {
    this.timer = setTimeout(async () => {
      if (this.buffer.length >= this.config.minBatchSize) {
        await this.processBatch();
      } else if (this.buffer.length > 0) {
        // Reset timer if we don't have enough items yet
        this.startTimer();
      }
    }, this.config.maxWaitTimeMs);
  }
  
  /**
   * Processes the current batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.buffer.length === 0) {
      return;
    }
    
    // Clear timer if it exists
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    this.processing = true;
    const batchToProcess = [...this.buffer];
    this.buffer = [];
    
    try {
      const startTime = Date.now();
      this.logger.debug(`Processing batch of ${batchToProcess.length} events`);
      this.metrics.incrementCounter('batches_processed');
      this.metrics.recordHistogram('batch_size', batchToProcess.length);
      
      await this.processor(batchToProcess);
      
      const duration = Date.now() - startTime;
      this.metrics.recordHistogram('batch_processing_time', duration);
      this.logger.debug(`Batch processed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error processing batch', error);
      // In a production system, we might implement retry logic or dead-letter queue here
    } finally {
      this.processing = false;
      
      // Check if new items arrived while processing
      if (this.buffer.length > 0) {
        if (this.buffer.length >= this.config.maxBatchSize) {
          await this.processBatch();
        } else {
          this.startTimer();
        }
      }
    }
  }
  
  /**
   * Flushes any remaining events in the buffer
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.buffer.length > 0) {
      await this.processBatch();
    }
  }
}

/**
 * Adaptive processing configuration based on system load
 */
export interface AdaptiveConfig {
  lowLoadThreshold: number;  // CPU usage percentage
  highLoadThreshold: number; // CPU usage percentage
  samplingIntervalMs: number;
  defaultConcurrency: number;
  minConcurrency: number;
  maxConcurrency: number;
}

/**
 * AdaptiveProcessor adjusts processing parameters based on system load
 */
export class AdaptiveProcessor {
  private config: AdaptiveConfig;
  private currentConcurrency: number;
  private cpuUsage: number = 0;
  private samplingTimer: NodeJS.Timeout | null = null;
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(
    config: AdaptiveConfig,
    logger: Logger,
    metrics: MetricsCollector
  ) {
    this.config = config;
    this.currentConcurrency = config.defaultConcurrency;
    this.logger = logger;
    this.metrics = metrics;
    this.startSampling();
  }
  
  /**
   * Starts periodic sampling of system load
   */
  private startSampling(): void {
    this.samplingTimer = setInterval(() => {
      this.sampleSystemLoad();
      this.adjustConcurrency();
    }, this.config.samplingIntervalMs);
  }
  
  /**
   * Samples current system CPU usage
   */
  private sampleSystemLoad(): void {
    // In a real implementation, this would use OS-specific APIs
    // For demonstration, we'll use a simple approach
    try {
      const os = require('os');
      const cpus = os.cpus();
      
      // Calculate CPU usage across all cores
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      }
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - (idle / total * 100);
      
      this.cpuUsage = usage;
      this.metrics.recordGauge('cpu_usage', usage);
    } catch (error) {
      this.logger.error('Error sampling system load', error);
    }
  }
  
  /**
   * Adjusts concurrency based on current system load
   */
  private adjustConcurrency(): void {
    const previousConcurrency = this.currentConcurrency;
    
    if (this.cpuUsage > this.config.highLoadThreshold) {
      // System is under high load, reduce concurrency
      this.currentConcurrency = Math.max(
        this.config.minConcurrency,
        this.currentConcurrency - 1
      );
    } else if (this.cpuUsage < this.config.lowLoadThreshold) {
      // System has capacity, increase concurrency
      this.currentConcurrency = Math.min(
        this.config.maxConcurrency,
        this.currentConcurrency + 1
      );
    }
    
    if (previousConcurrency !== this.currentConcurrency) {
      this.logger.info(
        `Adjusted concurrency from ${previousConcurrency} to ${this.currentConcurrency} ` +
        `based on CPU usage of ${this.cpuUsage.toFixed(2)}%`
      );
      this.metrics.recordGauge('processing_concurrency', this.currentConcurrency);
    }
  }
  
  /**
   * Gets the current recommended concurrency level
   */
  getConcurrency(): number {
    return this.currentConcurrency;
  }
  
  /**
   * Gets the current CPU usage percentage
   */
  getCpuUsage(): number {
    return this.cpuUsage;
  }
  
  /**
   * Stops the adaptive processor
   */
  stop(): void {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
    }
  }
}

/**
 * Data locality optimization for processing efficiency
 */
export class LocalityOptimizer<T extends BaseEvent> {
  private partitionedData: Map<string, T[]> = new Map();
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  /**
   * Adds an event to the appropriate partition
   */
  addEvent(event: T, partitionKey: string): void {
    if (!this.partitionedData.has(partitionKey)) {
      this.partitionedData.set(partitionKey, []);
    }
    
    this.partitionedData.get(partitionKey)!.push(event);
  }
  
  /**
   * Gets all events for a specific partition
   */
  getPartitionEvents(partitionKey: string): T[] {
    return this.partitionedData.get(partitionKey) || [];
  }
  
  /**
   * Processes events by partition for improved locality
   */
  async processWithLocality(
    processor: (events: T[], partitionKey: string) => Promise<void>
  ): Promise<void> {
    const partitions = Array.from(this.partitionedData.keys());
    this.logger.debug(`Processing ${partitions.length} partitions with data locality optimization`);
    
    for (const partition of partitions) {
      const events = this.partitionedData.get(partition) || [];
      if (events.length > 0) {
        await processor(events, partition);
        // Clear processed events
        this.partitionedData.set(partition, []);
      }
    }
  }
  
  /**
   * Gets all partition keys
   */
  getPartitions(): string[] {
    return Array.from(this.partitionedData.keys());
  }
  
  /**
   * Clears all partitioned data
   */
  clear(): void {
    this.partitionedData.clear();
  }
}

/**
 * Main class that orchestrates real-time processing optimizations
 */
export class RealTimeProcessingOptimizer {
  private logger: Logger;
  private metrics: MetricsCollector;
  private config: ConfigManager;
  private adaptiveProcessor: AdaptiveProcessor;
  
  constructor(
    logger: Logger,
    metrics: MetricsCollector,
    config: ConfigManager
  ) {
    this.logger = logger;
    this.metrics = metrics;
    this.config = config;
    
    // Initialize adaptive processor with default configuration
    this.adaptiveProcessor = new AdaptiveProcessor(
      {
        lowLoadThreshold: this.config.get('adaptive.lowLoadThreshold', 30),
        highLoadThreshold: this.config.get('adaptive.highLoadThreshold', 70),
        samplingIntervalMs: this.config.get('adaptive.samplingIntervalMs', 5000),
        defaultConcurrency: this.config.get('adaptive.defaultConcurrency', 4),
        minConcurrency: this.config.get('adaptive.minConcurrency', 1),
        maxConcurrency: this.config.get('adaptive.maxConcurrency', 16)
      },
      logger,
      metrics
    );
    
    this.logger.info('RealTimeProcessingOptimizer initialized');
  }
  
  /**
   * Creates a new batch processor with the specified configuration
   */
  createBatchProcessor<T extends BaseEvent>(
    processor: (batch: T[]) => Promise<void>,
    configOverrides?: Partial<BatchConfig>
  ): BatchProcessor<T> {
    const defaultConfig: BatchConfig = {
      maxBatchSize: this.config.get('batch.maxBatchSize', 100),
      maxWaitTimeMs: this.config.get('batch.maxWaitTimeMs', 1000),
      minBatchSize: this.config.get('batch.minBatchSize', 10)
    };
    
    const finalConfig: BatchConfig = {
      ...defaultConfig,
      ...configOverrides
    };
    
    return new BatchProcessor<T>(
      finalConfig,
      processor,
      this.logger,
      this.metrics
    );
  }
  
  /**
   * Creates a new circular buffer with the specified capacity
   */
  createCircularBuffer<T extends BaseEvent>(capacity?: number): CircularEventBuffer<T> {
    const bufferSize = capacity || this.config.get('buffer.defaultCapacity', 1000);
    return new CircularEventBuffer<T>(bufferSize);
  }
  
  /**
   * Creates a new locality optimizer
   */
  createLocalityOptimizer<T extends BaseEvent>(): LocalityOptimizer<T> {
    return new LocalityOptimizer<T>(this.logger);
  }
  
  /**
   * Gets the adaptive processor for concurrency management
   */
  getAdaptiveProcessor(): AdaptiveProcessor {
    return this.adaptiveProcessor;
  }
  
  /**
   * Stops all background processes
   */
  shutdown(): void {
    this.adaptiveProcessor.stop();
    this.logger.info('RealTimeProcessingOptimizer shutdown complete');
  }
}
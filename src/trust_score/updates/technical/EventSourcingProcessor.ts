/**
 * EventSourcingProcessor.ts
 * 
 * This file implements the Event Sourcing and Processing component of the NFT TrustScore
 * real-time update system, handling event streaming, schema management, idempotent processing,
 * event persistence, and transformation.
 */

import { KafkaClient, Producer, Consumer, Message } from 'kafka-node';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { ConfigManager } from '../config/ConfigManager';

// Event types supported by the system
export enum EventType {
  NFT_TRANSFER = 'nft_transfer',
  NFT_SALE = 'nft_sale',
  NFT_MINT = 'nft_mint',
  COLLECTION_UPDATE = 'collection_update',
  CREATOR_ACTIVITY = 'creator_activity',
  FRAUD_DETECTION = 'fraud_detection',
  SOCIAL_SIGNAL = 'social_signal',
  MARKET_CONDITION = 'market_condition'
}

// Base event interface
export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: number;
  version: number;
  source: string;
  producerId: string;
}

// Event processor interface
export interface EventProcessor<T extends BaseEvent> {
  process(event: T): Promise<void>;
  canProcess(eventType: EventType): boolean;
}

/**
 * EventSchemaManager handles schema registration, validation, and evolution
 * using Apache Avro and Schema Registry
 */
export class EventSchemaManager {
  private registry: SchemaRegistry;
  private schemaVersions: Map<EventType, number> = new Map();
  private logger: Logger;

  constructor(registryUrl: string, logger: Logger) {
    this.registry = new SchemaRegistry({ host: registryUrl });
    this.logger = logger;
  }

  /**
   * Registers a new schema version for an event type
   */
  async registerSchema(eventType: EventType, schema: object): Promise<number> {
    try {
      const { id } = await this.registry.register({
        type: 'AVRO',
        schema: JSON.stringify(schema)
      });
      this.schemaVersions.set(eventType, id);
      this.logger.info(`Registered schema for ${eventType} with ID ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to register schema for ${eventType}`, error);
      throw error;
    }
  }

  /**
   * Encodes an event using its registered schema
   */
  async encode<T extends BaseEvent>(event: T): Promise<Buffer> {
    const schemaId = this.schemaVersions.get(event.type);
    if (!schemaId) {
      throw new Error(`No schema registered for event type ${event.type}`);
    }

    try {
      return await this.registry.encode(schemaId, event);
    } catch (error) {
      this.logger.error(`Failed to encode event ${event.id}`, error);
      throw error;
    }
  }

  /**
   * Decodes an event using its embedded schema ID
   */
  async decode(buffer: Buffer): Promise<BaseEvent> {
    try {
      const result = await this.registry.decode(buffer);
      return result as BaseEvent;
    } catch (error) {
      this.logger.error('Failed to decode event', error);
      throw error;
    }
  }
}

/**
 * IdempotentProcessor ensures events are processed exactly once
 * by tracking processed event IDs
 */
export class IdempotentProcessor {
  private processedEvents: Set<string> = new Set();
  private readonly MAX_CACHE_SIZE = 10000; // Limit memory usage
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Checks if an event has already been processed
   */
  isProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Marks an event as processed
   */
  markAsProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
    
    // Simple cache eviction strategy - could be improved with LRU
    if (this.processedEvents.size > this.MAX_CACHE_SIZE) {
      const iterator = this.processedEvents.values();
      this.processedEvents.delete(iterator.next().value);
    }
  }

  /**
   * Processes an event exactly once using the provided processor function
   */
  async processOnce<T extends BaseEvent>(
    event: T, 
    processor: (event: T) => Promise<void>
  ): Promise<boolean> {
    if (this.isProcessed(event.id)) {
      this.logger.debug(`Skipping already processed event ${event.id}`);
      return false;
    }

    try {
      await processor(event);
      this.markAsProcessed(event.id);
      return true;
    } catch (error) {
      this.logger.error(`Failed to process event ${event.id}`, error);
      throw error;
    }
  }
}

/**
 * EventTransformer handles enrichment and normalization of events
 */
export class EventTransformer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Enriches an event with additional context
   */
  async enrich<T extends BaseEvent>(event: T): Promise<T> {
    // This would typically involve fetching additional data from other services
    // For example, adding collection details to an NFT event
    this.logger.debug(`Enriching event ${event.id}`);
    return event;
  }

  /**
   * Normalizes an event to a standardized internal format
   */
  normalize<T extends BaseEvent>(event: T): T {
    // Convert external event formats to our internal representation
    this.logger.debug(`Normalizing event ${event.id}`);
    return event;
  }

  /**
   * Transforms an event for a specific domain/consumer
   */
  transformForDomain<T extends BaseEvent, R>(event: T, domainTransformer: (event: T) => R): R {
    this.logger.debug(`Transforming event ${event.id} for domain consumption`);
    return domainTransformer(event);
  }
}

/**
 * EventPersistence handles storing and retrieving events
 */
export class EventPersistence {
  private kafkaClient: KafkaClient;
  private producer: Producer;
  private logger: Logger;
  private schemaManager: EventSchemaManager;
  private metrics: MetricsCollector;

  constructor(
    kafkaBrokers: string[], 
    schemaManager: EventSchemaManager,
    logger: Logger,
    metrics: MetricsCollector
  ) {
    this.kafkaClient = new KafkaClient({ kafkaHost: kafkaBrokers.join(',') });
    this.producer = new Producer(this.kafkaClient);
    this.schemaManager = schemaManager;
    this.logger = logger;
    this.metrics = metrics;

    // Set up producer error handling
    this.producer.on('error', (err) => {
      this.logger.error('Kafka producer error', err);
      this.metrics.incrementCounter('kafka_producer_errors');
    });
  }

  /**
   * Stores an event in the appropriate Kafka topic
   */
  async storeEvent<T extends BaseEvent>(event: T, topic: string): Promise<void> {
    try {
      const encodedEvent = await this.schemaManager.encode(event);
      
      const message: Message = {
        topic,
        messages: encodedEvent,
        key: event.id, // Use event ID as the key for partitioning
        attributes: 1, // Use compression
      };

      return new Promise((resolve, reject) => {
        this.producer.send([message], (err, result) => {
          if (err) {
            this.logger.error(`Failed to store event ${event.id}`, err);
            this.metrics.incrementCounter('event_storage_failures');
            reject(err);
            return;
          }
          
          this.logger.debug(`Stored event ${event.id} in topic ${topic}`);
          this.metrics.incrementCounter('events_stored');
          this.metrics.recordHistogram('event_size', encodedEvent.length);
          resolve();
        });
      });
    } catch (error) {
      this.logger.error(`Error preparing event ${event.id} for storage`, error);
      throw error;
    }
  }

  /**
   * Creates a consumer for retrieving events from a topic
   */
  createConsumer(topics: string[], groupId: string): Consumer {
    const consumer = new Consumer(
      this.kafkaClient,
      topics.map(topic => ({ topic })),
      {
        groupId,
        autoCommit: true,
        fetchMaxWaitMs: 1000,
        fetchMaxBytes: 1024 * 1024,
      }
    );

    consumer.on('error', (err) => {
      this.logger.error(`Kafka consumer error for group ${groupId}`, err);
      this.metrics.incrementCounter('kafka_consumer_errors');
    });

    consumer.on('message', (message) => {
      this.metrics.incrementCounter('events_consumed');
    });

    return consumer;
  }
}

/**
 * EventSourcingProcessor is the main class that orchestrates the event sourcing system
 */
export class EventSourcingProcessor {
  private schemaManager: EventSchemaManager;
  private idempotentProcessor: IdempotentProcessor;
  private eventTransformer: EventTransformer;
  private eventPersistence: EventPersistence;
  private processors: Map<EventType, EventProcessor<BaseEvent>> = new Map();
  private logger: Logger;
  private metrics: MetricsCollector;
  private config: ConfigManager;

  constructor(
    kafkaBrokers: string[],
    schemaRegistryUrl: string,
    logger: Logger,
    metrics: MetricsCollector,
    config: ConfigManager
  ) {
    this.logger = logger;
    this.metrics = metrics;
    this.config = config;
    
    // Initialize components
    this.schemaManager = new EventSchemaManager(schemaRegistryUrl, logger);
    this.idempotentProcessor = new IdempotentProcessor(logger);
    this.eventTransformer = new EventTransformer(logger);
    this.eventPersistence = new EventPersistence(
      kafkaBrokers, 
      this.schemaManager,
      logger,
      metrics
    );

    this.logger.info('EventSourcingProcessor initialized');
  }

  /**
   * Registers an event processor for a specific event type
   */
  registerProcessor(processor: EventProcessor<BaseEvent>): void {
    for (const eventType of Object.values(EventType)) {
      if (processor.canProcess(eventType as EventType)) {
        this.processors.set(eventType as EventType, processor);
        this.logger.info(`Registered processor for event type ${eventType}`);
      }
    }
  }

  /**
   * Processes an incoming event through the pipeline
   */
  async processEvent<T extends BaseEvent>(event: T): Promise<void> {
    const startTime = Date.now();
    this.logger.debug(`Processing event ${event.id} of type ${event.type}`);
    
    try {
      // Step 1: Normalize and enrich the event
      const normalizedEvent = this.eventTransformer.normalize(event);
      const enrichedEvent = await this.eventTransformer.enrich(normalizedEvent);
      
      // Step 2: Store the event for durability
      const topic = `events.${event.type}`;
      await this.eventPersistence.storeEvent(enrichedEvent, topic);
      
      // Step 3: Process the event exactly once
      const processor = this.processors.get(event.type);
      if (!processor) {
        this.logger.warn(`No processor registered for event type ${event.type}`);
        return;
      }
      
      await this.idempotentProcessor.processOnce(enrichedEvent, async (e) => {
        await processor.process(e);
      });
      
      // Record metrics
      const processingTime = Date.now() - startTime;
      this.metrics.recordHistogram('event_processing_time', processingTime);
      this.logger.info(`Successfully processed event ${event.id} in ${processingTime}ms`);
    } catch (error) {
      this.metrics.incrementCounter('event_processing_failures');
      this.logger.error(`Failed to process event ${event.id}`, error);
      throw error;
    }
  }

  /**
   * Creates a new event with proper ID and metadata
   */
  createEvent<T extends Omit<BaseEvent, 'id' | 'timestamp' | 'producerId'>>(eventData: T): BaseEvent {
    const event: BaseEvent = {
      ...eventData,
      id: uuidv4(),
      timestamp: Date.now(),
      producerId: this.config.get('service.id', 'event-sourcing-processor')
    };
    
    return event;
  }

  /**
   * Starts consuming events from the specified topics
   */
  startConsuming(topics: string[], groupId: string): void {
    const consumer = this.eventPersistence.createConsumer(topics, groupId);
    
    consumer.on('message', async (message) => {
      try {
        const event = await this.schemaManager.decode(message.value);
        await this.processEvent(event);
      } catch (error) {
        this.logger.error(`Error processing consumed message`, error);
        this.metrics.incrementCounter('message_processing_errors');
      }
    });
    
    this.logger.info(`Started consuming from topics: ${topics.join(', ')}`);
  }
}
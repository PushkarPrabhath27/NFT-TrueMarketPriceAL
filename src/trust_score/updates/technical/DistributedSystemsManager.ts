/**
 * DistributedSystemsManager.ts
 * 
 * This file implements the Distributed Systems Design component of the NFT TrustScore
 * real-time update system, handling consistency models, partition tolerance, scalability,
 * and distributed tracing.
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Vector clock for tracking causality across distributed components
 */
export class VectorClock {
  private clock: Map<string, number> = new Map();
  
  constructor(initialState?: Record<string, number>) {
    if (initialState) {
      this.clock = new Map(Object.entries(initialState));
    }
  }
  
  /**
   * Increments the counter for a specific node
   */
  increment(nodeId: string): void {
    const current = this.clock.get(nodeId) || 0;
    this.clock.set(nodeId, current + 1);
  }
  
  /**
   * Merges with another vector clock, taking the maximum values
   */
  merge(other: VectorClock): void {
    for (const [nodeId, count] of other.clock.entries()) {
      const currentCount = this.clock.get(nodeId) || 0;
      if (count > currentCount) {
        this.clock.set(nodeId, count);
      }
    }
  }
  
  /**
   * Compares this vector clock with another to determine causality
   * Returns: -1 if this happens before other
   *           0 if concurrent
   *           1 if this happens after other
   */
  compare(other: VectorClock): -1 | 0 | 1 {
    let lessThan = false;
    let greaterThan = false;
    
    // Check all keys in this clock
    for (const [nodeId, count] of this.clock.entries()) {
      const otherCount = other.clock.get(nodeId) || 0;
      if (count < otherCount) lessThan = true;
      if (count > otherCount) greaterThan = true;
    }
    
    // Check keys in other clock that aren't in this clock
    for (const [nodeId, count] of other.clock.entries()) {
      if (!this.clock.has(nodeId) && count > 0) {
        lessThan = true;
      }
    }
    
    if (lessThan && !greaterThan) return -1;
    if (greaterThan && !lessThan) return 1;
    return 0;
  }
  
  /**
   * Serializes the vector clock for transmission
   */
  serialize(): Record<string, number> {
    return Object.fromEntries(this.clock.entries());
  }
}

/**
 * Consistency model types supported by the system
 */
export enum ConsistencyModel {
  EVENTUAL = 'eventual',
  STRONG = 'strong',
  CAUSAL = 'causal'
}

/**
 * Entity state with versioning information
 */
export interface VersionedState<T> {
  data: T;
  version: number;
  vectorClock: Record<string, number>;
  lastModified: number;
}

/**
 * ConsistencyManager handles different consistency models for entity updates
 */
export class ConsistencyManager {
  private nodeId: string;
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(nodeId: string, logger: Logger, metrics: MetricsCollector) {
    this.nodeId = nodeId;
    this.logger = logger;
    this.metrics = metrics;
  }
  
  /**
   * Applies an update using the appropriate consistency model
   */
  async applyUpdate<T>(
    entityId: string,
    currentState: VersionedState<T> | null,
    newData: Partial<T>,
    model: ConsistencyModel
  ): Promise<VersionedState<T>> {
    this.metrics.incrementCounter(`consistency_updates_${model}`);
    const startTime = Date.now();
    
    try {
      switch (model) {
        case ConsistencyModel.STRONG:
          return await this.applyStrongConsistency(entityId, currentState, newData);
        case ConsistencyModel.EVENTUAL:
          return this.applyEventualConsistency(entityId, currentState, newData);
        case ConsistencyModel.CAUSAL:
          return this.applyCausalConsistency(entityId, currentState, newData);
        default:
          throw new Error(`Unsupported consistency model: ${model}`);
      }
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.recordHistogram(`consistency_update_time_${model}`, duration);
    }
  }
  
  /**
   * Applies strong consistency using a two-phase commit approach
   */
  private async applyStrongConsistency<T>(
    entityId: string,
    currentState: VersionedState<T> | null,
    newData: Partial<T>
  ): Promise<VersionedState<T>> {
    // In a real implementation, this would coordinate with other nodes
    // For now, we'll simulate the process
    this.logger.debug(`Applying strong consistency update to entity ${entityId}`);
    
    // Phase 1: Prepare - would check if all nodes can apply the update
    const canCommit = true; // Simplified for this implementation
    
    if (!canCommit) {
      throw new Error(`Cannot apply strong consistency update to entity ${entityId}`);
    }
    
    // Phase 2: Commit - apply the update
    const baseState = currentState?.data || {} as T;
    const newState: VersionedState<T> = {
      data: { ...baseState, ...newData } as T,
      version: (currentState?.version || 0) + 1,
      vectorClock: this.updateVectorClock(currentState?.vectorClock).serialize(),
      lastModified: Date.now()
    };
    
    return newState;
  }
  
  /**
   * Applies eventual consistency with conflict resolution
   */
  private applyEventualConsistency<T>(
    entityId: string,
    currentState: VersionedState<T> | null,
    newData: Partial<T>
  ): VersionedState<T> {
    this.logger.debug(`Applying eventual consistency update to entity ${entityId}`);
    
    const baseState = currentState?.data || {} as T;
    const newState: VersionedState<T> = {
      data: { ...baseState, ...newData } as T,
      version: (currentState?.version || 0) + 1,
      vectorClock: this.updateVectorClock(currentState?.vectorClock).serialize(),
      lastModified: Date.now()
    };
    
    return newState;
  }
  
  /**
   * Applies causal consistency using vector clocks
   */
  private applyCausalConsistency<T>(
    entityId: string,
    currentState: VersionedState<T> | null,
    newData: Partial<T>
  ): VersionedState<T> {
    this.logger.debug(`Applying causal consistency update to entity ${entityId}`);
    
    const baseState = currentState?.data || {} as T;
    const newState: VersionedState<T> = {
      data: { ...baseState, ...newData } as T,
      version: (currentState?.version || 0) + 1,
      vectorClock: this.updateVectorClock(currentState?.vectorClock).serialize(),
      lastModified: Date.now()
    };
    
    return newState;
  }
  
  /**
   * Updates the vector clock for a state change
   */
  private updateVectorClock(currentClock?: Record<string, number>): VectorClock {
    const clock = new VectorClock(currentClock);
    clock.increment(this.nodeId);
    return clock;
  }
  
  /**
   * Resolves conflicts between concurrent updates
   */
  resolveConflict<T>(
    entityId: string,
    states: VersionedState<T>[]
  ): VersionedState<T> {
    if (states.length === 0) {
      throw new Error(`No states provided for conflict resolution for entity ${entityId}`);
    }
    
    if (states.length === 1) {
      return states[0];
    }
    
    this.logger.info(`Resolving conflict for entity ${entityId} with ${states.length} versions`);
    this.metrics.incrementCounter('conflict_resolutions');
    
    // Sort by vector clock and then by timestamp as a tiebreaker
    const sortedStates = [...states].sort((a, b) => {
      const clockA = new VectorClock(a.vectorClock);
      const clockB = new VectorClock(b.vectorClock);
      const comparison = clockB.compare(clockA);
      
      if (comparison !== 0) return comparison;
      return b.lastModified - a.lastModified;
    });
    
    // Take the first (latest) state as the base
    const baseState = sortedStates[0];
    
    // For a more sophisticated merge, we would implement a custom merge function
    // that combines the changes from all concurrent updates
    return baseState;
  }
}

/**
 * Partition strategy for distributing entities across nodes
 */
export class PartitionManager {
  private readonly PARTITION_COUNT = 1024; // Number of virtual partitions
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(logger: Logger, metrics: MetricsCollector) {
    this.logger = logger;
    this.metrics = metrics;
  }
  
  /**
   * Determines the partition for an entity using consistent hashing
   */
  getPartition(entityId: string): number {
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < entityId.length; i++) {
      hash = ((hash << 5) - hash) + entityId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Ensure positive value and map to partition range
    const partition = Math.abs(hash) % this.PARTITION_COUNT;
    this.logger.debug(`Entity ${entityId} mapped to partition ${partition}`);
    return partition;
  }
  
  /**
   * Maps a partition to a node using the ring
   */
  getNodeForPartition(partition: number, nodeRing: string[]): string {
    if (nodeRing.length === 0) {
      throw new Error('No nodes available in the ring');
    }
    
    // Simple mapping for demonstration
    const nodeIndex = partition % nodeRing.length;
    return nodeRing[nodeIndex];
  }
  
  /**
   * Gets the node responsible for an entity
   */
  getNodeForEntity(entityId: string, nodeRing: string[]): string {
    const partition = this.getPartition(entityId);
    return this.getNodeForPartition(partition, nodeRing);
  }
  
  /**
   * Calculates partition assignments after a node joins or leaves
   */
  rebalancePartitions(currentRing: string[], newRing: string[]): Map<number, string> {
    const assignments = new Map<number, string>();
    let reassignmentCount = 0;
    
    for (let partition = 0; partition < this.PARTITION_COUNT; partition++) {
      const oldNode = this.getNodeForPartition(partition, currentRing);
      const newNode = this.getNodeForPartition(partition, newRing);
      
      assignments.set(partition, newNode);
      
      if (oldNode !== newNode) {
        reassignmentCount++;
        this.logger.debug(`Partition ${partition} reassigned from ${oldNode} to ${newNode}`);
      }
    }
    
    const reassignmentPercentage = (reassignmentCount / this.PARTITION_COUNT) * 100;
    this.logger.info(`Rebalance: ${reassignmentCount} partitions reassigned (${reassignmentPercentage.toFixed(2)}%)`);
    this.metrics.recordGauge('partition_reassignments', reassignmentCount);
    
    return assignments;
  }
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxCalls: number;
  private halfOpenSuccesses: number = 0;
  private halfOpenFailures: number = 0;
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(
    failureThreshold: number = 5,
    resetTimeout: number = 30000, // 30 seconds
    halfOpenMaxCalls: number = 3,
    logger: Logger,
    metrics: MetricsCollector
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.halfOpenMaxCalls = halfOpenMaxCalls;
    this.logger = logger;
    this.metrics = metrics;
  }
  
  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      this.metrics.incrementCounter('circuit_breaker_short_circuits');
      if (fallback) {
        this.logger.debug('Circuit open, using fallback');
        return fallback();
      }
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      if (fallback) {
        this.logger.debug('Operation failed, using fallback');
        return fallback();
      }
      throw error;
    }
  }
  
  /**
   * Checks if the circuit is open (preventing calls)
   */
  isOpen(): boolean {
    if (this.state === 'HALF_OPEN') {
      return this.halfOpenSuccesses + this.halfOpenFailures >= this.halfOpenMaxCalls;
    }
    
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.logger.info('Circuit transitioning from OPEN to HALF_OPEN');
        this.metrics.incrementCounter('circuit_breaker_half_open_transitions');
        this.state = 'HALF_OPEN';
        this.halfOpenSuccesses = 0;
        this.halfOpenFailures = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Records a successful operation
   */
  private recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      
      if (this.halfOpenSuccesses >= this.halfOpenMaxCalls) {
        this.logger.info('Circuit transitioning from HALF_OPEN to CLOSED');
        this.metrics.incrementCounter('circuit_breaker_close_transitions');
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    }
  }
  
  /**
   * Records a failed operation
   */
  private recordFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.halfOpenFailures++;
      this.logger.info('Failure in HALF_OPEN state, circuit transitioning back to OPEN');
      this.metrics.incrementCounter('circuit_breaker_reopen_transitions');
      this.state = 'OPEN';
      return;
    }
    
    if (this.state === 'CLOSED') {
      this.failureCount++;
      
      if (this.failureCount >= this.failureThreshold) {
        this.logger.info(`Failure threshold reached (${this.failureCount}), circuit transitioning to OPEN`);
        this.metrics.incrementCounter('circuit_breaker_open_transitions');
        this.state = 'OPEN';
      }
    }
  }
  
  /**
   * Gets the current state of the circuit breaker
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
}

/**
 * Distributed tracing for request tracking across services
 */
export class DistributedTracer {
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(logger: Logger, metrics: MetricsCollector) {
    this.logger = logger;
    this.metrics = metrics;
  }
  
  /**
   * Creates a new trace context
   */
  createTraceContext(): TraceContext {
    return {
      traceId: uuidv4(),
      spanId: uuidv4(),
      parentSpanId: null,
      startTime: Date.now(),
      sampled: Math.random() < 0.1 // Sample 10% of traces
    };
  }
  
  /**
   * Creates a child span from a parent context
   */
  createChildSpan(parentContext: TraceContext, operationName: string): Span {
    const spanId = uuidv4();
    const context: TraceContext = {
      traceId: parentContext.traceId,
      spanId,
      parentSpanId: parentContext.spanId,
      startTime: Date.now(),
      sampled: parentContext.sampled
    };
    
    return new Span(context, operationName, this.logger, this.metrics);
  }
  
  /**
   * Extracts trace context from carrier (e.g., HTTP headers)
   */
  extractContext(carrier: Record<string, string>): TraceContext | null {
    if (!carrier['x-trace-id']) {
      return null;
    }
    
    return {
      traceId: carrier['x-trace-id'],
      spanId: carrier['x-span-id'],
      parentSpanId: carrier['x-parent-span-id'] || null,
      startTime: parseInt(carrier['x-trace-start-time'] || Date.now().toString(), 10),
      sampled: carrier['x-trace-sampled'] === 'true'
    };
  }
  
  /**
   * Injects trace context into carrier (e.g., HTTP headers)
   */
  injectContext(context: TraceContext, carrier: Record<string, string>): void {
    carrier['x-trace-id'] = context.traceId;
    carrier['x-span-id'] = context.spanId;
    if (context.parentSpanId) {
      carrier['x-parent-span-id'] = context.parentSpanId;
    }
    carrier['x-trace-start-time'] = context.startTime.toString();
    carrier['x-trace-sampled'] = context.sampled.toString();
  }
}

/**
 * Trace context for distributed tracing
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  startTime: number;
  sampled: boolean;
}

/**
 * Span representing a single operation in a trace
 */
export class Span {
  private context: TraceContext;
  private operationName: string;
  private tags: Record<string, string> = {};
  private logs: Array<{timestamp: number, fields: Record<string, any>}> = [];
  private endTime: number | null = null;
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(
    context: TraceContext,
    operationName: string,
    logger: Logger,
    metrics: MetricsCollector
  ) {
    this.context = context;
    this.operationName = operationName;
    this.logger = logger;
    this.metrics = metrics;
    
    if (context.sampled) {
      this.logger.debug(`Starting span ${operationName} (${context.spanId}) in trace ${context.traceId}`);
    }
  }
  
  /**
   * Sets a tag on the span
   */
  setTag(key: string, value: string): this {
    this.tags[key] = value;
    return this;
  }
  
  /**
   * Logs an event with the span
   */
  log(fields: Record<string, any>): this {
    this.logs.push({
      timestamp: Date.now(),
      fields
    });
    return this;
  }
  
  /**
   * Finishes the span and records its duration
   */
  finish(): void {
    this.endTime = Date.now();
    const duration = this.endTime - this.context.startTime;
    
    if (this.context.sampled) {
      this.logger.debug(`Finishing span ${this.operationName} (${this.context.spanId}) in ${duration}ms`);
      this.metrics.recordHistogram(`span_duration_${this.operationName}`, duration);
      
      // In a real implementation, this would send the span to a tracing system
      // like Jaeger or Zipkin
    }
  }
  
  /**
   * Gets the trace context for this span
   */
  getContext(): TraceContext {
    return this.context;
  }
}

/**
 * Main class that orchestrates distributed systems capabilities
 */
export class DistributedSystemsManager {
  private nodeId: string;
  private consistencyManager: ConsistencyManager;
  private partitionManager: PartitionManager;
  private tracer: DistributedTracer;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private logger: Logger;
  private metrics: MetricsCollector;
  private config: ConfigManager;
  
  constructor(
    nodeId: string,
    logger: Logger,
    metrics: MetricsCollector,
    config: ConfigManager
  ) {
    this.nodeId = nodeId;
    this.logger = logger;
    this.metrics = metrics;
    this.config = config;
    
    // Initialize components
    this.consistencyManager = new ConsistencyManager(nodeId, logger, metrics);
    this.partitionManager = new PartitionManager(logger, metrics);
    this.tracer = new DistributedTracer(logger, metrics);
    
    this.logger.info(`DistributedSystemsManager initialized with node ID ${nodeId}`);
  }
  
  /**
   * Gets the consistency manager
   */
  getConsistencyManager(): ConsistencyManager {
    return this.consistencyManager;
  }
  
  /**
   * Gets the partition manager
   */
  getPartitionManager(): PartitionManager {
    return this.partitionManager;
  }
  
  /**
   * Gets the distributed tracer
   */
  getTracer(): DistributedTracer {
    return this.tracer;
  }
  
  /**
   * Gets or creates a circuit breaker for a specific service
   */
  getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const failureThreshold = this.config.get(
        `circuitBreaker.${serviceName}.failureThreshold`,
        5
      );
      const resetTimeout = this.config.get(
        `circuitBreaker.${serviceName}.resetTimeout`,
        30000
      );
      const halfOpenMaxCalls = this.config.get(
        `circuitBreaker.${serviceName}.halfOpenMaxCalls`,
        3
      );
      
      const breaker = new CircuitBreaker(
        failureThreshold,
        resetTimeout,
        halfOpenMaxCalls,
        this.logger,
        this.metrics
      );
      
      this.circuitBreakers.set(serviceName, breaker);
    }
    
    return this.circuitBreakers.get(serviceName)!;
  }
  
  /**
   * Creates a new trace for an operation
   */
  startTrace(operationName: string): Span {
    const context = this.tracer.createTraceContext();
    return new Span(context, operationName, this.logger, this.metrics);
  }
  
  /**
   * Executes an operation with distributed systems protections
   */
  async executeOperation<T>(
    serviceName: string,
    operationName: string,
    operation: (span: Span) => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const span = this.startTrace(operationName);
    span.setTag('service', serviceName);
    span.setTag('node_id', this.nodeId);
    
    try {
      const circuitBreaker = this.getCircuitBreaker(serviceName);
      
      return await circuitBreaker.execute(
        async () => {
          try {
            const result = await operation(span);
            span.setTag('status', 'success');
            return result;
          } catch (error) {
            span.setTag('status', 'error');
            span.setTag('error', 'true');
            span.log({
              event: 'error',
              'error.message': error instanceof Error ? error.message : String(error)
            });
            throw error;
          }
        },
        fallback
      );
    } finally {
      span.finish();
    }
  }
}
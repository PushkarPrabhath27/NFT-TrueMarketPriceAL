/**
 * EventDispatcher.ts
 * 
 * Implements the event dispatch component of the Real-Time Update System.
 * Responsible for routing events to appropriate handlers and managing
 * different dispatch mechanisms (sync, async, scheduled, etc.).
 */

import { EventEmitter } from 'events';
import { TrustScoreTypes } from '../../types';
import { ClassificationResult } from './EventClassifier';

/**
 * Configuration for the event dispatcher
 */
export interface EventDispatcherConfig {
  // Whether to enable rule-based routing
  enableRuleBasedRouting: boolean;
  // Whether to enable dynamic handler discovery
  enableDynamicHandlerDiscovery: boolean;
  // Whether to enable load balancing
  enableLoadBalancing: boolean;
  // Whether to enable affinity routing
  enableAffinityRouting: boolean;
  // Whether to enable fallback routing
  enableFallbackRouting: boolean;
  // Maximum number of concurrent synchronous operations
  maxConcurrentSyncOperations: number;
  // Maximum number of concurrent asynchronous operations
  maxConcurrentAsyncOperations: number;
  // Maximum number of retry attempts for failed dispatches
  maxRetryAttempts: number;
}

/**
 * Handler registration information
 */
export interface HandlerRegistration {
  // Handler ID
  id: string;
  // Handler name
  name: string;
  // Event types the handler can process
  eventTypes: string[];
  // Entity types the handler can process
  entityTypes: string[];
  // Whether the handler requires synchronous processing
  requiresSync: boolean;
  // Handler priority (0-10, where 10 is highest)
  priority: number;
  // Handler function
  handler: EventHandlerFunction;
  // Current load (number of active operations)
  currentLoad: number;
  // Maximum load capacity
  maxCapacity: number;
}

/**
 * Event handler function type
 */
export type EventHandlerFunction = (event: TrustScoreTypes.UpdateEvent) => Promise<void>;

/**
 * Dispatch result
 */
export interface DispatchResult {
  // Whether the dispatch was successful
  success: boolean;
  // The handler that processed the event
  handlerId?: string;
  // Error message if dispatch failed
  error?: string;
  // Whether the event was queued for later processing
  queued?: boolean;
  // Whether the event was processed synchronously
  synchronous?: boolean;
}

/**
 * Manages event dispatching to appropriate handlers
 */
export class EventDispatcher extends EventEmitter {
  private config: EventDispatcherConfig;
  private handlers: Map<string, HandlerRegistration> = new Map();
  private activeSync: number = 0;
  private activeAsync: number = 0;
  private entityAffinityMap: Map<string, string> = new Map();
  private scheduledEvents: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Initialize the Event Dispatcher
   * 
   * @param config Configuration for the event dispatcher
   */
  constructor(config: Partial<EventDispatcherConfig> = {}) {
    super();
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<EventDispatcherConfig>): EventDispatcherConfig {
    return {
      enableRuleBasedRouting: true,
      enableDynamicHandlerDiscovery: true,
      enableLoadBalancing: true,
      enableAffinityRouting: true,
      enableFallbackRouting: true,
      maxConcurrentSyncOperations: 5,
      maxConcurrentAsyncOperations: 20,
      maxRetryAttempts: 3,
      ...config
    };
  }
  
  /**
   * Register a handler for event processing
   * 
   * @param registration Handler registration information
   * @returns True if registration was successful, false otherwise
   */
  public registerHandler(registration: Partial<HandlerRegistration> & { name: string, handler: EventHandlerFunction }): boolean {
    const id = `handler-${registration.name}-${Date.now()}`;
    
    const fullRegistration: HandlerRegistration = {
      id,
      name: registration.name,
      eventTypes: registration.eventTypes || [],
      entityTypes: registration.entityTypes || [],
      requiresSync: registration.requiresSync || false,
      priority: registration.priority || 5,
      handler: registration.handler,
      currentLoad: 0,
      maxCapacity: registration.maxCapacity || 100
    };
    
    this.handlers.set(id, fullRegistration);
    this.emit('handler_registered', { id, name: registration.name });
    
    return true;
  }
  
  /**
   * Unregister a handler
   * 
   * @param handlerId Handler ID to unregister
   * @returns True if unregistration was successful, false otherwise
   */
  public unregisterHandler(handlerId: string): boolean {
    const handler = this.handlers.get(handlerId);
    if (!handler) {
      return false;
    }
    
    this.handlers.delete(handlerId);
    this.emit('handler_unregistered', { id: handlerId, name: handler.name });
    
    return true;
  }
  
  /**
   * Dispatch an event to appropriate handlers
   * 
   * @param event The event to dispatch
   * @param classification The event classification result
   * @returns Dispatch result
   */
  public async dispatch(event: TrustScoreTypes.UpdateEvent, classification: ClassificationResult): Promise<DispatchResult> {
    try {
      // Find appropriate handlers
      const handlers = this.findHandlers(event, classification);
      
      if (handlers.length === 0) {
        // No handlers found
        if (this.config.enableFallbackRouting) {
          // Use fallback routing
          return this.dispatchToFallbackHandler(event, classification);
        } else {
          return { success: false, error: 'No handlers found for event' };
        }
      }
      
      // Determine dispatch mechanism
      const dispatchMechanism = this.determineDispatchMechanism(event, classification, handlers);
      
      // Dispatch based on mechanism
      switch (dispatchMechanism) {
        case 'sync':
          return this.dispatchSync(event, handlers[0]);
        case 'async':
          return this.dispatchAsync(event, handlers[0]);
        case 'scheduled':
          return this.dispatchScheduled(event, handlers[0], 5000); // 5 second delay
        case 'triggered':
          return this.dispatchTriggered(event, handlers[0], classification.dependencies);
        case 'conditional':
          return this.dispatchConditional(event, handlers[0], classification);
        default:
          return this.dispatchAsync(event, handlers[0]); // Default to async
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  
  /**
   * Find appropriate handlers for an event
   * 
   * @param event The event to find handlers for
   * @param classification The event classification result
   * @returns Array of handler registrations
   */
  private findHandlers(event: TrustScoreTypes.UpdateEvent, classification: ClassificationResult): HandlerRegistration[] {
    // Get all handlers
    const allHandlers = Array.from(this.handlers.values());
    
    // Filter handlers based on event type and entity type
    let matchingHandlers = allHandlers.filter(handler => {
      // Check if handler can process this event type
      const eventTypeMatch = handler.eventTypes.length === 0 || 
                            handler.eventTypes.includes(event.eventType || '') ||
                            handler.eventTypes.includes(classification.eventCategory);
      
      // Check if handler can process this entity type
      const entityTypeMatch = handler.entityTypes.length === 0 ||
                             (event.entityType && handler.entityTypes.includes(event.entityType)) ||
                             classification.entityAssociations.some(type => handler.entityTypes.includes(type));
      
      return eventTypeMatch && entityTypeMatch;
    });
    
    // If affinity routing is enabled, prioritize handlers with affinity
    if (this.config.enableAffinityRouting && event.entityId && event.entityType) {
      const affinityKey = `${event.entityType}:${event.entityId}`;
      const affinityHandlerId = this.entityAffinityMap.get(affinityKey);
      
      if (affinityHandlerId) {
        // Move affinity handler to front of list
        const affinityHandlerIndex = matchingHandlers.findIndex(h => h.id === affinityHandlerId);
        if (affinityHandlerIndex >= 0) {
          const affinityHandler = matchingHandlers[affinityHandlerIndex];
          matchingHandlers.splice(affinityHandlerIndex, 1);
          matchingHandlers.unshift(affinityHandler);
        }
      }
    }
    
    // If load balancing is enabled, consider handler load
    if (this.config.enableLoadBalancing) {
      // Sort by load ratio (current load / max capacity) and priority
      matchingHandlers.sort((a, b) => {
        const aLoadRatio = a.currentLoad / a.maxCapacity;
        const bLoadRatio = b.currentLoad / b.maxCapacity;
        
        // First sort by priority (higher priority first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        
        // Then sort by load ratio (lower load ratio first)
        return aLoadRatio - bLoadRatio;
      });
    } else {
      // Sort by priority only
      matchingHandlers.sort((a, b) => b.priority - a.priority);
    }
    
    return matchingHandlers;
  }
  
  /**
   * Determine the appropriate dispatch mechanism for an event
   * 
   * @param event The event to dispatch
   * @param classification The event classification result
   * @param handlers The handlers that can process the event
   * @returns Dispatch mechanism
   */
  private determineDispatchMechanism(event: TrustScoreTypes.UpdateEvent, classification: ClassificationResult, handlers: HandlerRegistration[]): string {
    // Check if any handler requires synchronous processing
    if (handlers.some(h => h.requiresSync)) {
      return 'sync';
    }
    
    // Check urgency level
    if (classification.urgencyLevel === 'high') {
      return 'sync';
    }
    
    // Check if event has dependencies
    if (classification.dependencies.length > 0) {
      return 'triggered';
    }
    
    // Check if event is part of a batch
    if (event.batchId) {
      return 'scheduled';
    }
    
    // Check if event has conditions
    if (event.conditions) {
      return 'conditional';
    }
    
    // Default to asynchronous processing
    return 'async';
  }
  
  /**
   * Dispatch an event synchronously
   * 
   * @param event The event to dispatch
   * @param handler The handler to dispatch to
   * @returns Dispatch result
   */
  private async dispatchSync(event: TrustScoreTypes.UpdateEvent, handler: HandlerRegistration): Promise<DispatchResult> {
    // Check if we can process synchronously
    if (this.activeSync >= this.config.maxConcurrentSyncOperations) {
      // Too many active sync operations, queue for later
      this.emit('sync_queue_full', { event, handlerId: handler.id });
      return { success: true, handlerId: handler.id, queued: true };
    }
    
    try {
      // Increment active sync count
      this.activeSync++;
      handler.currentLoad++;
      
      // Set entity affinity
      if (this.config.enableAffinityRouting && event.entityId && event.entityType) {
        const affinityKey = `${event.entityType}:${event.entityId}`;
        this.entityAffinityMap.set(affinityKey, handler.id);
      }
      
      // Emit dispatch event
      this.emit('event_dispatched', { event, handlerId: handler.id, synchronous: true });
      
      // Process event
      await handler.handler(event);
      
      // Emit processed event
      this.emit('event_processed', { event, handlerId: handler.id, synchronous: true });
      
      return { success: true, handlerId: handler.id, synchronous: true };
    } catch (error) {
      // Emit error event
      this.emit('dispatch_error', { event, handlerId: handler.id, error });
      
      return { success: false, handlerId: handler.id, error: error instanceof Error ? error.message : String(error) };
    } finally {
      // Decrement active sync count
      this.activeSync--;
      handler.currentLoad--;
    }
  }
  
  /**
   * Dispatch an event asynchronously
   * 
   * @param event The event to dispatch
   * @param handler The handler to dispatch to
   * @returns Dispatch result
   */
  private async dispatchAsync(event: TrustScoreTypes.UpdateEvent, handler: HandlerRegistration): Promise<DispatchResult> {
    // Check if we can process asynchronously
    if (this.activeAsync >= this.config.maxConcurrentAsyncOperations) {
      // Too many active async operations, queue for later
      this.emit('async_queue_full', { event, handlerId: handler.id });
      return { success: true, handlerId: handler.id, queued: true };
    }
    
    // Increment active async count
    this.activeAsync++;
    handler.currentLoad++;
    
    // Set entity affinity
    if (this.config.enableAffinityRouting && event.entityId && event.entityType) {
      const affinityKey = `${event.entityType}:${event.entityId}`;
      this.entityAffinityMap.set(affinityKey, handler.id);
    }
    
    // Emit dispatch event
    this.emit('event_dispatched', { event, handlerId: handler.id, synchronous: false });
    
    // Process event asynchronously
    handler.handler(event)
      .then(() => {
        // Emit processed event
        this.emit('event_processed', { event, handlerId: handler.id, synchronous: false });
      })
      .catch(error => {
        // Emit error event
        this.emit('dispatch_error', { event, handlerId: handler.id, error });
      })
      .finally(() => {
        // Decrement active async count
        this.activeAsync--;
        handler.currentLoad--;
      });
    
    return { success: true, handlerId: handler.id, synchronous: false };
  }
  
  /**
   * Dispatch an event on a schedule
   * 
   * @param event The event to dispatch
   * @param handler The handler to dispatch to
   * @param delayMs The delay in milliseconds
   * @returns Dispatch result
   */
  private dispatchScheduled(event: TrustScoreTypes.UpdateEvent, handler: HandlerRegistration, delayMs: number): DispatchResult {
    // Create a unique ID for the scheduled event
    const scheduledId = `scheduled-${event.id}-${Date.now()}`;
    
    // Schedule the event
    const timeout = setTimeout(() => {
      // Remove from scheduled events
      this.scheduledEvents.delete(scheduledId);
      
      // Dispatch asynchronously
      this.dispatchAsync(event, handler);
    }, delayMs);
    
    // Store the timeout
    this.scheduledEvents.set(scheduledId, timeout);
    
    // Emit scheduled event
    this.emit('event_scheduled', { event, handlerId: handler.id, delayMs, scheduledId });
    
    return { success: true, handlerId: handler.id, queued: true };
  }
  
  /**
   * Dispatch an event when triggered by dependencies
   * 
   * @param event The event to dispatch
   * @param handler The handler to dispatch to
   * @param dependencies The event dependencies
   * @returns Dispatch result
   */
  private dispatchTriggered(event: TrustScoreTypes.UpdateEvent, handler: HandlerRegistration, dependencies: string[]): DispatchResult {
    // In a real implementation, this would register the event to be triggered when dependencies are processed
    // For now, we'll just dispatch asynchronously
    
    // Emit triggered event
    this.emit('event_triggered', { event, handlerId: handler.id, dependencies });
    
    return this.dispatchAsync(event, handler);
  }
  
  /**
   * Dispatch an event conditionally
   * 
   * @param event The event to dispatch
   * @param handler The handler to dispatch to
   * @param classification The event classification result
   * @returns Dispatch result
   */
  private dispatchConditional(event: TrustScoreTypes.UpdateEvent, handler: HandlerRegistration, classification: ClassificationResult): DispatchResult {
    // In a real implementation, this would check conditions before dispatching
    // For now, we'll just dispatch asynchronously
    
    // Emit conditional event
    this.emit('event_conditional', { event, handlerId: handler.id, classification });
    
    return this.dispatchAsync(event, handler);
  }
  
  /**
   * Dispatch an event to a fallback handler
   * 
   * @param event The event to dispatch
   * @param classification The event classification result
   * @returns Dispatch result
   */
  private dispatchToFallbackHandler(event: TrustScoreTypes.UpdateEvent, classification: ClassificationResult): DispatchResult {
    // In a real implementation, this would have a fallback handler for unknown event types
    // For now, we'll just log the event and return success
    
    // Emit fallback event
    this.emit('event_fallback', { event, classification });
    
    return { success: true, queued: true };
  }
  
  /**
   * Get all registered handlers
   * 
   * @returns Array of handler registrations
   */
  public getHandlers(): HandlerRegistration[] {
    return Array.from(this.handlers.values());
  }
  
  /**
   * Get a specific handler by ID
   * 
   * @param handlerId The handler ID
   * @returns Handler registration or undefined if not found
   */
  public getHandler(handlerId: string): HandlerRegistration | undefined {
    return this.handlers.get(handlerId);
  }
  
  /**
   * Get the current number of active synchronous operations
   * 
   * @returns Number of active synchronous operations
   */
  public getActiveSyncCount(): number {
    return this.activeSync;
  }
  
  /**
   * Get the current number of active asynchronous operations
   * 
   * @returns Number of active asynchronous operations
   */
  public getActiveAsyncCount(): number {
    return this.activeAsync;
  }
  
  /**
   * Get the current number of scheduled events
   * 
   * @returns Number of scheduled events
   */
  public getScheduledEventCount(): number {
    return this.scheduledEvents.size;
  }
  
  /**
   * Cancel a scheduled event
   * 
   * @param scheduledId The scheduled event ID
   * @returns True if cancellation was successful, false otherwise
   */
  public cancelScheduledEvent(scheduledId: string): boolean {
    const timeout = this.scheduledEvents.get(scheduledId);
    if (!timeout) {
      return false;
    }
    
    clearTimeout(timeout);
    this.scheduledEvents.delete(scheduledId);
    this.emit('scheduled_event_cancelled', { scheduledId });
    
    return true;
  }
  
  /**
   * Cancel all scheduled events
   */
  public cancelAllScheduledEvents(): void {
    for (const [scheduledId, timeout] of this.scheduledEvents.entries()) {
      clearTimeout(timeout);
      this.emit('scheduled_event_cancelled', { scheduledId });
    }
    
    this.scheduledEvents.clear();
  }
}
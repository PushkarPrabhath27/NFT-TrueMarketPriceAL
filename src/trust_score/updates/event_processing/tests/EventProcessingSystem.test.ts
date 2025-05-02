/**
 * EventProcessingSystem.test.ts
 * 
 * Unit tests for the Event Processing and Routing system.
 * These tests verify that all components work correctly individually and together.
 */

import { EventEmitter } from 'events';
import { TrustScoreTypes } from '../../../types';
import {
  EventProcessingSystem,
  EventClassifier,
  EventPrioritizer,
  ProcessingQueueManager,
  EventRouter,
  EventDispatcher
} from '../index';

// Mock event for testing
const createMockEvent = (overrides: Partial<TrustScoreTypes.UpdateEvent> = {}): TrustScoreTypes.UpdateEvent => {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    eventType: 'nft_sale',
    entityType: 'nft',
    entityId: 'nft123',
    source: 'blockchain',
    data: {
      price: 1.5,
      buyer: 'wallet456',
      seller: 'wallet789',
      marketplace: 'opensea'
    },
    ...overrides
  };
};

describe('EventClassifier', () => {
  let classifier: EventClassifier;

  beforeEach(() => {
    classifier = new EventClassifier();
  });

  test('should classify events correctly', () => {
    const event = createMockEvent();
    const result = classifier.classify(event);

    expect(result.eventCategory).toBe('market_activity');
    expect(result.entityAssociations).toContain('nft');
    expect(result.entityAssociations).toContain('collection');
    expect(result.entityAssociations).toContain('creator');
    expect(result.impactScore).toBeGreaterThan(0);
    expect(['high', 'medium', 'low']).toContain(result.urgencyLevel);
  });

  test('should identify dependencies correctly', () => {
    const event = createMockEvent({ eventType: 'fraud_wash_trading' });
    const result = classifier.classify(event);

    expect(result.dependencies).toContain('nft_sale');
  });
});

describe('EventPrioritizer', () => {
  let prioritizer: EventPrioritizer;

  beforeEach(() => {
    prioritizer = new EventPrioritizer();
  });

  test('should prioritize events correctly', () => {
    const event = createMockEvent();
    const priority = prioritizer.getPriority(event);

    expect(priority).toBeGreaterThanOrEqual(0);
    expect(priority).toBeLessThanOrEqual(10);
  });

  test('should prioritize critical events higher', () => {
    const regularEvent = createMockEvent();
    const criticalEvent = createMockEvent({
      eventType: 'fraud_wash_trading',
      data: {
        confidence: 0.9,
        severity: 'high'
      }
    });

    const regularPriority = prioritizer.getPriority(regularEvent);
    const criticalPriority = prioritizer.getPriority(criticalEvent);

    expect(criticalPriority).toBeGreaterThan(regularPriority);
  });
});

describe('ProcessingQueueManager', () => {
  let queueManager: ProcessingQueueManager;

  beforeEach(() => {
    queueManager = new ProcessingQueueManager();
  });

  test('should enqueue events correctly', () => {
    const event = createMockEvent();
    const result = queueManager.enqueue(event, 'blockchain');

    expect(result).toBe(true);
    expect(queueManager.getQueueDepth('blockchain')).toBe(1);
  });

  test('should deduplicate redundant events', () => {
    const event = createMockEvent();
    queueManager.enqueue(event, 'blockchain');
    queueManager.enqueue({...event}, 'blockchain'); // Same event ID

    expect(queueManager.getQueueDepth('blockchain')).toBe(1);
  });

  test('should conflate rapidly changing entities', () => {
    const event1 = createMockEvent();
    const event2 = createMockEvent({
      id: `event-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`,
      data: { price: 1.6 } // Updated price
    });

    queueManager.enqueue(event1, 'blockchain');
    queueManager.enqueue(event2, 'blockchain');

    // Should conflate to just one event since they're for the same entity and type
    expect(queueManager.getQueueDepth('blockchain')).toBe(1);
  });
});

describe('EventRouter', () => {
  let router: EventRouter;

  beforeEach(() => {
    router = new EventRouter();
  });

  test('should determine routing correctly', () => {
    const event = createMockEvent();
    const result = router.determineRouting(event);

    expect(result).toHaveProperty('shouldUpdate');
    expect(result).toHaveProperty('shouldNotify');
  });

  test('should always update on critical events', () => {
    const event = createMockEvent({ eventType: 'nft_sale' });
    const result = router.determineRouting(event);

    expect(result.shouldUpdate).toBe(true);
  });
});

describe('EventDispatcher', () => {
  let dispatcher: EventDispatcher;
  let classifier: EventClassifier;

  beforeEach(() => {
    dispatcher = new EventDispatcher();
    classifier = new EventClassifier();
  });

  test('should register handlers correctly', () => {
    const result = dispatcher.registerHandler({
      name: 'test-handler',
      eventTypes: ['nft_sale'],
      entityTypes: ['nft'],
      handler: async () => {}
    });

    expect(result).toBe(true);
    expect(dispatcher.getHandlers().length).toBe(1);
  });

  test('should dispatch events to appropriate handlers', async () => {
    const handlerFn = jest.fn().mockResolvedValue(undefined);
    
    dispatcher.registerHandler({
      name: 'test-handler',
      eventTypes: ['nft_sale'],
      entityTypes: ['nft'],
      handler: handlerFn
    });

    const event = createMockEvent();
    const classification = classifier.classify(event);
    const result = await dispatcher.dispatch(event, classification);

    expect(result.success).toBe(true);
    expect(handlerFn).toHaveBeenCalledWith(event);
  });
});

describe('EventProcessingSystem', () => {
  let eventProcessingSystem: EventProcessingSystem;

  beforeEach(() => {
    eventProcessingSystem = new EventProcessingSystem();
  });

  test('should process events through the entire pipeline', async () => {
    // Mock handler function
    const handlerFn = jest.fn().mockResolvedValue(undefined);
    
    // Register handler
    eventProcessingSystem.registerHandler(
      'test-handler',
      ['nft_sale'],
      ['nft'],
      handlerFn
    );

    // Create test event
    const event = createMockEvent();
    
    // Process event
    await eventProcessingSystem.processEvent(event);
    
    // Verify handler was called
    expect(handlerFn).toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    // Mock handler function that throws an error
    const handlerFn = jest.fn().mockRejectedValue(new Error('Test error'));
    
    // Register handler
    eventProcessingSystem.registerHandler(
      'error-handler',
      ['nft_sale'],
      ['nft'],
      handlerFn
    );

    // Create test event
    const event = createMockEvent();
    
    // Mock error event listener
    const errorListener = jest.fn();
    eventProcessingSystem.on('event_pipeline_error', errorListener);
    
    // Process event and expect it to throw
    await expect(eventProcessingSystem.processEvent(event)).rejects.toThrow();
    
    // Verify error event was emitted
    expect(errorListener).toHaveBeenCalled();
  });
});
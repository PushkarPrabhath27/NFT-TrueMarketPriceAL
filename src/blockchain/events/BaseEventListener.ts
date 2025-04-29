import { EventEmitter } from 'events';
import { Provider } from '@ethersproject/providers';

export interface EventConfig {
  provider: Provider;
  confirmations?: number;
  pollingInterval?: number;
  maxRetries?: number;
  backoffMultiplier?: number;
}

export interface EventData {
  eventType: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  data: any;
}

export class BaseEventListener extends EventEmitter {
  protected provider: Provider;
  protected confirmations: number;
  protected pollingInterval: number;
  protected maxRetries: number;
  protected backoffMultiplier: number;
  protected processedEvents: Set<string>;
  protected isListening: boolean;

  constructor(config: EventConfig) {
    super();
    this.provider = config.provider;
    this.confirmations = config.confirmations || 12;
    this.pollingInterval = config.pollingInterval || 1000;
    this.maxRetries = config.maxRetries || 3;
    this.backoffMultiplier = config.backoffMultiplier || 1.5;
    this.processedEvents = new Set();
    this.isListening = false;
  }

  protected generateEventId(eventData: EventData): string {
    return `${eventData.eventType}-${eventData.transactionHash}-${eventData.blockNumber}`;
  }

  protected async processEvent(eventData: EventData): Promise<void> {
    const eventId = this.generateEventId(eventData);
    
    if (this.processedEvents.has(eventId)) {
      return; // Skip duplicate events
    }

    try {
      // Wait for required confirmations
      const currentBlock = await this.provider.getBlockNumber();
      if (currentBlock - eventData.blockNumber < this.confirmations) {
        setTimeout(() => this.processEvent(eventData), this.pollingInterval);
        return;
      }

      // Process the event
      await this.handleEvent(eventData);
      this.processedEvents.add(eventId);
      this.emit('eventProcessed', eventData);
    } catch (error) {
      this.emit('error', { eventData, error });
      await this.handleError(error, eventData);
    }
  }

  protected async handleError(error: any, eventData: EventData): Promise<void> {
    let retries = 0;
    let delay = this.pollingInterval;

    while (retries < this.maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.handleEvent(eventData);
        return;
      } catch (retryError) {
        retries++;
        delay *= this.backoffMultiplier;
        this.emit('retryError', { eventData, error: retryError, retryCount: retries });
      }
    }

    this.emit('maxRetriesExceeded', { eventData, error });
  }

  protected async handleEvent(eventData: EventData): Promise<void> {
    // To be implemented by specific event listeners
    throw new Error('handleEvent must be implemented by child class');
  }

  public async start(): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;
    await this.startListening();
  }

  public async stop(): Promise<void> {
    if (!this.isListening) return;
    this.isListening = false;
    await this.stopListening();
  }

  protected async startListening(): Promise<void> {
    // To be implemented by specific event listeners
    throw new Error('startListening must be implemented by child class');
  }

  protected async stopListening(): Promise<void> {
    // To be implemented by specific event listeners
    throw new Error('stopListening must be implemented by child class');
  }

  public clearProcessedEvents(): void {
    this.processedEvents.clear();
  }
}
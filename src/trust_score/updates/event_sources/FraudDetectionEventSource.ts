/**
 * FraudDetectionEventSource.ts
 * 
 * Implements the Fraud Detection System Integration component of the Real-Time Update System.
 * Responsible for receiving and processing webhook updates from fraud detection systems
 * such as image analysis, similarity scores, wash trading detection, and metadata validation.
 */

import { EventEmitter } from 'events';
import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the fraud detection event source
 */
export interface FraudDetectionEventSourceConfig {
  // Webhook endpoint configuration
  webhookEndpoint: string;
  // Authentication token for webhook security
  authToken?: string;
  // Maximum number of items in the processing queue
  maxQueueSize: number;
  // Processing batch size
  batchSize: number;
  // Processing interval in milliseconds
  processingInterval: number;
  // Maximum number of retries for failed processing
  maxRetries: number;
  // Backoff multiplier for retry delays
  backoffMultiplier: number;
  // Enabled update types
  enabledUpdateTypes: {
    imageAnalysis: boolean;
    similarityScores: boolean;
    washTrading: boolean;
    metadataValidation: boolean;
  };
}

/**
 * Represents a webhook update from the fraud detection system
 */
interface WebhookUpdate {
  id: string;
  type: string;
  timestamp: number;
  data: any;
  attempts?: number;
  nextRetry?: number;
}

/**
 * Manages fraud detection system integration and emits events when relevant updates occur
 */
export class FraudDetectionEventSource extends EventEmitter {
  private config: FraudDetectionEventSourceConfig;
  private processingQueue: WebhookUpdate[] = [];
  private isRunning: boolean = false;
  private processingInterval?: NodeJS.Timeout;
  private processingInProgress: boolean = false;
  
  /**
   * Initialize the Fraud Detection Event Source
   * 
   * @param config Configuration for the fraud detection event source
   */
  constructor(config: FraudDetectionEventSourceConfig) {
    super();
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<FraudDetectionEventSourceConfig>): FraudDetectionEventSourceConfig {
    return {
      webhookEndpoint: '/api/webhooks/fraud-detection',
      maxQueueSize: 1000,
      batchSize: 10,
      processingInterval: 1000,
      maxRetries: 3,
      backoffMultiplier: 2,
      enabledUpdateTypes: {
        imageAnalysis: true,
        similarityScores: true,
        washTrading: true,
        metadataValidation: true,
        ...config.enabledUpdateTypes
      },
      ...config
    };
  }
  
  /**
   * Start receiving and processing fraud detection updates
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // Set up processing interval
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);
    
    // Set up webhook receiver
    this.setupWebhookReceiver();
    
    this.emit('started');
  }
  
  /**
   * Set up the webhook receiver
   */
  private setupWebhookReceiver(): void {
    // This would typically be implemented using a web framework like Express
    // For this implementation, we'll simulate webhook reception with a method
    console.log(`Fraud detection webhook receiver set up at ${this.config.webhookEndpoint}`);
  }
  
  /**
   * Receive a webhook update (called by the webhook handler)
   * 
   * @param update The webhook update to process
   */
  public receiveWebhookUpdate(update: WebhookUpdate): void {
    if (!this.isRunning) {
      return;
    }
    
    // Check if update type is enabled
    if (!this.isUpdateTypeEnabled(update.type)) {
      return;
    }
    
    // Check for duplicates
    const isDuplicate = this.processingQueue.some(item => item.id === update.id);
    
    if (!isDuplicate) {
      // Add to queue, respecting max size
      if (this.processingQueue.length >= this.config.maxQueueSize) {
        // Remove oldest item if queue is full
        this.processingQueue.shift();
      }
      
      this.processingQueue.push({
        ...update,
        attempts: 0
      });
      
      this.emit('updateReceived', { updateId: update.id, queueSize: this.processingQueue.length });
    }
  }
  
  /**
   * Check if an update type is enabled
   * 
   * @param type The update type to check
   */
  private isUpdateTypeEnabled(type: string): boolean {
    switch (type) {
      case 'image_analysis':
        return this.config.enabledUpdateTypes.imageAnalysis;
      case 'similarity_score':
        return this.config.enabledUpdateTypes.similarityScores;
      case 'wash_trading':
        return this.config.enabledUpdateTypes.washTrading;
      case 'metadata_validation':
        return this.config.enabledUpdateTypes.metadataValidation;
      default:
        return false;
    }
  }
  
  /**
   * Process updates in the queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.processingInProgress || this.processingQueue.length === 0) {
      return;
    }
    
    this.processingInProgress = true;
    
    try {
      // Get updates that are ready for processing
      const now = Date.now();
      const readyUpdates = this.processingQueue
        .filter(update => !update.nextRetry || update.nextRetry <= now)
        .slice(0, this.config.batchSize);
      
      if (readyUpdates.length === 0) {
        this.processingInProgress = false;
        return;
      }
      
      // Process each update
      const processingResults = await Promise.allSettled(
        readyUpdates.map(update => this.processUpdate(update))
      );
      
      // Handle results
      processingResults.forEach((result, index) => {
        const update = readyUpdates[index];
        
        if (result.status === 'fulfilled') {
          // Remove successfully processed update from queue
          this.processingQueue = this.processingQueue.filter(item => item.id !== update.id);
        } else {
          // Handle failed processing
          this.handleProcessingFailure(update, result.reason);
        }
      });
    } catch (error) {
      console.error('Error processing fraud detection updates:', error);
      this.emit('error', { source: 'processQueue', error });
    } finally {
      this.processingInProgress = false;
    }
  }
  
  /**
   * Process a single update
   * 
   * @param update The update to process
   */
  private async processUpdate(update: WebhookUpdate): Promise<void> {
    try {
      // Verify the update data
      this.verifyUpdateData(update);
      
      // Convert to trust score update event
      const updateEvent = this.convertToUpdateEvent(update);
      
      // Emit the event
      this.emit('event', updateEvent);
      
      // Emit processing success
      this.emit('updateProcessed', { updateId: update.id, success: true });
      
      // Send confirmation callback if needed
      this.sendProcessingConfirmation(update.id);
    } catch (error) {
      console.error(`Error processing update ${update.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Verify the data in an update
   * 
   * @param update The update to verify
   */
  private verifyUpdateData(update: WebhookUpdate): void {
    // Implement verification logic based on update type
    switch (update.type) {
      case 'image_analysis':
        if (!update.data.nftId || !update.data.analysisResults) {
          throw new Error('Invalid image analysis data');
        }
        break;
      case 'similarity_score':
        if (!update.data.nftId || !update.data.similarityScore) {
          throw new Error('Invalid similarity score data');
        }
        break;
      case 'wash_trading':
        if (!update.data.nftId || !update.data.detectionResults) {
          throw new Error('Invalid wash trading data');
        }
        break;
      case 'metadata_validation':
        if (!update.data.nftId || !update.data.validationResults) {
          throw new Error('Invalid metadata validation data');
        }
        break;
      default:
        throw new Error(`Unknown update type: ${update.type}`);
    }
  }
  
  /**
   * Convert a webhook update to a trust score update event
   * 
   * @param update The webhook update to convert
   */
  private convertToUpdateEvent(update: WebhookUpdate): TrustScoreTypes.UpdateEvent {
    // Base event properties
    const baseEvent: Partial<TrustScoreTypes.UpdateEvent> = {
      timestamp: update.timestamp,
      data: update.data
    };
    
    // Customize based on update type
    switch (update.type) {
      case 'image_analysis':
        return {
          ...baseEvent,
          eventType: 'fraud_image_analysis',
          entityId: update.data.nftId,
          entityType: 'nft',
          priority: 7, // Medium-high priority
          data: {
            nftId: update.data.nftId,
            analysisResults: update.data.analysisResults,
            confidence: update.data.confidence,
            flags: update.data.flags
          }
        } as TrustScoreTypes.UpdateEvent;
      
      case 'similarity_score':
        return {
          ...baseEvent,
          eventType: 'fraud_similarity_score',
          entityId: update.data.nftId,
          entityType: 'nft',
          priority: 6, // Medium priority
          data: {
            nftId: update.data.nftId,
            similarityScore: update.data.similarityScore,
            similarNfts: update.data.similarNfts,
            threshold: update.data.threshold
          }
        } as TrustScoreTypes.UpdateEvent;
      
      case 'wash_trading':
        return {
          ...baseEvent,
          eventType: 'fraud_wash_trading',
          entityId: update.data.nftId,
          entityType: 'nft',
          priority: 8, // High priority
          data: {
            nftId: update.data.nftId,
            detectionResults: update.data.detectionResults,
            confidence: update.data.confidence,
            involvedAddresses: update.data.involvedAddresses
          }
        } as TrustScoreTypes.UpdateEvent;
      
      case 'metadata_validation':
        return {
          ...baseEvent,
          eventType: 'fraud_metadata_validation',
          entityId: update.data.nftId,
          entityType: 'nft',
          priority: 5, // Medium-low priority
          data: {
            nftId: update.data.nftId,
            validationResults: update.data.validationResults,
            issues: update.data.issues
          }
        } as TrustScoreTypes.UpdateEvent;
      
      default:
        throw new Error(`Unknown update type: ${update.type}`);
    }
  }
  
  /**
   * Handle a processing failure
   * 
   * @param update The update that failed processing
   * @param error The error that occurred
   */
  private handleProcessingFailure(update: WebhookUpdate, error: Error): void {
    // Increment attempt count
    const attempts = (update.attempts || 0) + 1;
    
    if (attempts <= this.config.maxRetries) {
      // Calculate next retry time with exponential backoff
      const backoffDelay = Math.pow(this.config.backoffMultiplier, attempts) * 1000;
      const nextRetry = Date.now() + backoffDelay;
      
      // Update the item in the queue
      this.processingQueue = this.processingQueue.map(item => {
        if (item.id === update.id) {
          return { ...item, attempts, nextRetry };
        }
        return item;
      });
      
      this.emit('updateRetryScheduled', {
        updateId: update.id,
        attempts,
        nextRetry,
        error: error.message
      });
    } else {
      // Remove from queue after max retries
      this.processingQueue = this.processingQueue.filter(item => item.id !== update.id);
      
      this.emit('updateFailed', {
        updateId: update.id,
        attempts,
        error: error.message
      });
    }
  }
  
  /**
   * Send a confirmation that an update was processed
   * 
   * @param updateId The ID of the processed update
   */
  private sendProcessingConfirmation(updateId: string): void {
    // This would typically call back to the fraud detection system
    // to confirm that the update was processed
    console.log(`Sending processing confirmation for update ${updateId}`);
  }
  
  /**
   * Stop receiving and processing fraud detection updates
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Clear processing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    
    this.emit('stopped');
  }
  
  /**
   * Get the current status of the fraud detection event source
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      queueSize: this.processingQueue.length,
      processingInProgress: this.processingInProgress,
      enabledUpdateTypes: this.config.enabledUpdateTypes
    };
  }
}
import { IMetadataRetriever } from './IMetadataRetriever';

/**
 * Error class for metadata retrieval failures
 */
export class MetadataRetrievalError extends Error {
  constructor(
    message: string,
    public readonly uri: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MetadataRetrievalError';
  }
}

/**
 * Base class implementing common functionality for metadata retrievers
 */
export abstract class BaseMetadataRetriever implements IMetadataRetriever {
  protected rateLimits = {
    remaining: 1000,
    resetTime: new Date(),
    total: 1000,
  };

  protected retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  abstract canHandle(uri: string): boolean;
  abstract retrieveMetadata(uri: string): Promise<any>;

  get priority(): number {
    return 0; // Default priority, override in specific implementations
  }

  getRateLimitStatus() {
    return { ...this.rateLimits };
  }

  isAvailable(): boolean {
    return this.rateLimits.remaining > 0;
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.retryConfig.maxRetries) {
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(2, retryCount),
        this.retryConfig.maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(operation, retryCount + 1);
    }
  }

  protected updateRateLimits(remaining: number, total: number, resetTime: Date) {
    this.rateLimits = { remaining, total, resetTime };
  }

  protected validateUri(uri: string): void {
    if (!uri) {
      throw new MetadataRetrievalError('URI cannot be empty', uri);
    }
  }
}
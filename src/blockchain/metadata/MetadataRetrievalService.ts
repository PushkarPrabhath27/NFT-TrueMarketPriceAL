import { IMetadataRetriever } from './IMetadataRetriever';
import { MetadataRetrievalError } from './BaseMetadataRetriever';
import { IPFSMetadataRetriever } from './IPFSMetadataRetriever';
import { HTTPMetadataRetriever } from './HTTPMetadataRetriever';

/**
 * Service for orchestrating metadata retrieval from various sources
 */
export class MetadataRetrievalService {
  private retrievers: IMetadataRetriever[] = [];

  constructor() {
    // Initialize with default retrievers
    this.registerRetriever(new IPFSMetadataRetriever());
    this.registerRetriever(new HTTPMetadataRetriever());
  }

  /**
   * Registers a new metadata retriever
   * @param retriever The retriever to register
   */
  registerRetriever(retriever: IMetadataRetriever): void {
    this.retrievers.push(retriever);
    // Sort by priority in descending order
    this.retrievers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Retrieves metadata from the most appropriate source
   * @param uri The URI to fetch metadata from
   * @returns Promise resolving to the parsed metadata
   * @throws MetadataRetrievalError if no suitable retriever is found or all retrievers fail
   */
  async retrieveMetadata(uri: string): Promise<any> {
    const errors: Error[] = [];
    const suitableRetrievers = this.retrievers
      .filter(retriever => retriever.canHandle(uri))
      .filter(retriever => retriever.isAvailable());

    if (suitableRetrievers.length === 0) {
      throw new MetadataRetrievalError(
        'No suitable or available retriever found for URI',
        uri
      );
    }

    for (const retriever of suitableRetrievers) {
      try {
        return await retriever.retrieveMetadata(uri);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    throw new MetadataRetrievalError(
      'All suitable retrievers failed to fetch metadata',
      uri,
      new AggregateError(errors)
    );
  }

  /**
   * Gets the status of all registered retrievers
   * @returns Object containing status information for each retriever
   */
  getRetrieversStatus(): Record<string, {
    available: boolean;
    rateLimits: ReturnType<IMetadataRetriever['getRateLimitStatus']>;
  }> {
    return this.retrievers.reduce((status, retriever) => {
      status[retriever.constructor.name] = {
        available: retriever.isAvailable(),
        rateLimits: retriever.getRateLimitStatus(),
      };
      return status;
    }, {} as Record<string, any>);
  }

  /**
   * Gets all registered retrievers
   * @returns Array of registered retrievers
   */
  getRegisteredRetrievers(): IMetadataRetriever[] {
    return [...this.retrievers];
  }
}
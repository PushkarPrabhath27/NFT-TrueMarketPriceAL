/**
 * Interface defining the core functionality for NFT metadata retrieval
 */
export interface IMetadataRetriever {
  /**
   * Retrieves metadata from a given URI
   * @param uri The URI to fetch metadata from
   * @returns Promise resolving to the parsed metadata
   * @throws MetadataRetrievalError if fetching fails
   */
  retrieveMetadata(uri: string): Promise<any>;

  /**
   * Validates if the URI is supported by this retriever
   * @param uri The URI to validate
   * @returns boolean indicating if this retriever can handle the URI
   */
  canHandle(uri: string): boolean;

  /**
   * Gets the priority level for this retriever
   * Higher priority retrievers are tried first when multiple retrievers can handle a URI
   */
  get priority(): number;

  /**
   * Gets the current rate limit status
   * @returns Object containing rate limit information
   */
  getRateLimitStatus(): {
    remaining: number;
    resetTime: Date;
    total: number;
  };

  /**
   * Checks if the retriever is currently available
   * @returns boolean indicating if the retriever is ready to handle requests
   */
  isAvailable(): boolean;
}
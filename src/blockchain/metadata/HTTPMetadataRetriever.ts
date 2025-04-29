import { BaseMetadataRetriever, MetadataRetrievalError } from './BaseMetadataRetriever';

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * HTTP/HTTPS Metadata Retriever with caching and rate limiting
 */
export class HTTPMetadataRetriever extends BaseMetadataRetriever {
  private cache = new Map<string, CacheEntry>();
  private requestTimestamps: number[] = [];

  constructor(
    private readonly cacheDurationMs: number = 5 * 60 * 1000, // 5 minutes
    private readonly rateLimit: number = 100, // requests per minute
    private readonly timeoutMs: number = 10000
  ) {
    super();
    this.rateLimits.total = rateLimit;
    this.rateLimits.remaining = rateLimit;
    this.rateLimits.resetTime = new Date(Date.now() + 60000); // 1 minute from now
  }

  get priority(): number {
    return 50; // Medium priority for HTTP/HTTPS
  }

  canHandle(uri: string): boolean {
    return uri.startsWith('http://') || uri.startsWith('https://');
  }

  async retrieveMetadata(uri: string): Promise<any> {
    this.validateUri(uri);

    // Check cache first
    const cachedData = this.getCachedData(uri);
    if (cachedData) {
      return cachedData;
    }

    // Check rate limits
    this.updateRateLimitStatus();
    if (!this.isAvailable()) {
      throw new MetadataRetrievalError(
        'Rate limit exceeded',
        uri,
        new Error(`Reset time: ${this.rateLimits.resetTime.toISOString()}`)
      );
    }

    try {
      const data = await this.retryWithBackoff(() =>
        this.fetchWithTimeout(uri, this.timeoutMs)
      );
      this.cacheData(uri, data);
      return data;
    } catch (error) {
      throw new MetadataRetrievalError(
        'Failed to retrieve metadata from HTTP endpoint',
        uri,
        error as Error
      );
    }
  }

  private getCachedData(uri: string): any | null {
    const cached = this.cache.get(uri);
    if (
      cached &&
      Date.now() - cached.timestamp < this.cacheDurationMs
    ) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(uri);
    }
    return null;
  }

  private cacheData(uri: string, data: any): void {
    this.cache.set(uri, {
      data,
      timestamp: Date.now(),
    });
  }

  private updateRateLimitStatus(): void {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );

    if (this.requestTimestamps.length >= this.rateLimit) {
      // Update reset time to when the oldest request will expire
      this.rateLimits.resetTime = new Date(this.requestTimestamps[0] + 60000);
      this.rateLimits.remaining = 0;
    } else {
      this.requestTimestamps.push(now);
      this.rateLimits.remaining = this.rateLimit - this.requestTimestamps.length;
      this.rateLimits.resetTime = new Date(now + 60000);
    }
  }

  private async fetchWithTimeout(
    url: string,
    timeout: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NFT-TrustScore-Metadata-Retriever/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
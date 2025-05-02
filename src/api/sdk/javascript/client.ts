/**
 * NFT TrustScore API Client
 * 
 * Main client class for interacting with the NFT TrustScore API.
 * Handles authentication, request building, response parsing, and error handling.
 */

import { AuthOptions, ApiResponse, RequestOptions, RetryOptions } from './types';
import { handleApiError, buildQueryString, sleep } from './utils';
import { createAuthHeader } from './auth';

/**
 * NFT TrustScore API Client
 */
export class NFTTrustScoreClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private retryOptions: RetryOptions;
  
  /**
   * Create a new NFT TrustScore API client
   * 
   * @param apiKey API key for authentication
   * @param options Client options
   */
  constructor(apiKey: string, options?: {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    retry?: Partial<RetryOptions>;
  }) {
    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || 'https://api.nfttrustscoreplatform.com/api/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.defaultHeaders
    };
    
    // Default retry options
    this.retryOptions = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffFactor: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      ...options?.retry
    };
  }
  
  /**
   * Make an API request with automatic retries for transient errors
   * 
   * @param method HTTP method
   * @param path API endpoint path
   * @param options Request options
   * @returns API response
   */
  public async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options?.params);
    const headers = this.buildHeaders(options?.headers);
    
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries <= this.retryOptions.maxRetries) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          const error = handleApiError(data);
          
          // Check if we should retry based on status code
          if (this.retryOptions.retryableStatusCodes.includes(response.status) && 
              retries < this.retryOptions.maxRetries) {
            lastError = error;
            retries++;
            
            // Calculate backoff delay with exponential backoff and jitter
            const delay = Math.min(
              this.retryOptions.initialDelayMs * Math.pow(this.retryOptions.backoffFactor, retries - 1),
              this.retryOptions.maxDelayMs
            ) * (0.8 + Math.random() * 0.4); // Add jitter (±20%)
            
            await sleep(delay);
            continue;
          }
          
          throw error;
        }
        
        return {
          data: data.data as T,
          meta: data.meta,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        if (retries >= this.retryOptions.maxRetries) {
          throw lastError || error;
        }
        
        lastError = error as Error;
        retries++;
        
        // Calculate backoff delay
        const delay = Math.min(
          this.retryOptions.initialDelayMs * Math.pow(this.retryOptions.backoffFactor, retries - 1),
          this.retryOptions.maxDelayMs
        ) * (0.8 + Math.random() * 0.4); // Add jitter (±20%)
        
        await sleep(delay);
      }
    }
    
    // This should never happen due to the loop condition, but TypeScript needs it
    throw lastError || new Error('Maximum retries exceeded');
  }
  
  /**
   * Make a GET request
   * 
   * @param path API endpoint path
   * @param options Request options
   * @returns API response
   */
  public async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, options);
  }
  
  /**
   * Make a POST request
   * 
   * @param path API endpoint path
   * @param body Request body
   * @param options Request options
   * @returns API response
   */
  public async post<T>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, { ...options, body });
  }
  
  /**
   * Make a PUT request
   * 
   * @param path API endpoint path
   * @param body Request body
   * @param options Request options
   * @returns API response
   */
  public async put<T>(path: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, { ...options, body });
  }
  
  /**
   * Make a DELETE request
   * 
   * @param path API endpoint path
   * @param options Request options
   * @returns API response
   */
  public async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, options);
  }
  
  /**
   * Build the full URL for an API request
   * 
   * @param path API endpoint path
   * @param params Query parameters
   * @returns Full URL
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
    return params ? `${url}${buildQueryString(params)}` : url;
  }
  
  /**
   * Build headers for an API request
   * 
   * @param additionalHeaders Additional headers to include
   * @returns Headers object
   */
  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${this.apiKey}`,
      ...additionalHeaders
    };
  }
}
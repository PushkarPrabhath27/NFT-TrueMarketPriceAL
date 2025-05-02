/**
 * NFT TrustScore API Utilities
 * 
 * Utility functions for the NFT TrustScore API client.
 */

/**
 * Handle API error responses
 * 
 * @param errorResponse Error response from the API
 * @returns Error object
 */
export function handleApiError(errorResponse: any): Error {
  // Extract error details from the response
  const code = errorResponse.code || 'UNKNOWN_ERROR';
  const message = errorResponse.message || 'An unknown error occurred';
  const details = errorResponse.details || {};
  
  // Create a custom error object with additional properties
  const error = new Error(`API Error (${code}): ${message}`);
  (error as any).code = code;
  (error as any).details = details;
  (error as any).response = errorResponse;
  
  return error;
}

/**
 * Build a query string from parameters
 * 
 * @param params Query parameters
 * @returns Query string (including the leading ?)
 */
export function buildQueryString(params: Record<string, any>): string {
  const parts: string[] = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    
    if (Array.isArray(value)) {
      // Handle array parameters (e.g., ?ids[]=1&ids[]=2)
      for (const item of value) {
        parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`);
      }
    } else if (typeof value === 'object') {
      // Handle object parameters (e.g., ?filter[name]=value)
      for (const [subKey, subValue] of Object.entries(value)) {
        parts.push(`${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(String(subValue))}`);
      }
    } else {
      // Handle simple parameters
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/**
 * Sleep for a specified duration
 * 
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format a date for API requests
 * 
 * @param date Date to format
 * @returns Formatted date string (ISO 8601)
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parse a date from API responses
 * 
 * @param dateString Date string from API
 * @returns Parsed Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Log API requests and responses (for debugging)
 * 
 * @param level Log level
 * @param message Log message
 * @param data Additional data to log
 */
export function logApiCall(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  // This is a simple implementation that logs to console
  // In a real application, this would use a proper logging system
  const timestamp = new Date().toISOString();
  const logData = data ? ` ${JSON.stringify(data)}` : '';
  
  switch (level) {
    case 'info':
      console.info(`[${timestamp}] [INFO] ${message}${logData}`);
      break;
    case 'warn':
      console.warn(`[${timestamp}] [WARN] ${message}${logData}`);
      break;
    case 'error':
      console.error(`[${timestamp}] [ERROR] ${message}${logData}`);
      break;
  }
}
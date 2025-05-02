/**
 * API Error Codes and Standardized Error Handling
 * 
 * Defines standardized error codes and messages for the NFT TrustScore API.
 * This improves developer experience by providing consistent error responses.
 */

/**
 * Error category enum
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RESOURCE = 'resource',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  EXTERNAL = 'external'
}

/**
 * Error code interface
 */
export interface ErrorCode {
  code: string;
  httpStatus: number;
  message: string;
  category: ErrorCategory;
}

/**
 * Standardized error codes for the API
 */
export const ERROR_CODES: Record<string, ErrorCode> = {
  // Authentication errors (401)
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    httpStatus: 401,
    message: 'Authentication required',
    category: ErrorCategory.AUTHENTICATION
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    httpStatus: 401,
    message: 'Invalid authentication credentials',
    category: ErrorCategory.AUTHENTICATION
  },
  EXPIRED_TOKEN: {
    code: 'EXPIRED_TOKEN',
    httpStatus: 401,
    message: 'Authentication token has expired',
    category: ErrorCategory.AUTHENTICATION
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    httpStatus: 401,
    message: 'Invalid authentication token',
    category: ErrorCategory.AUTHENTICATION
  },
  
  // Authorization errors (403)
  FORBIDDEN: {
    code: 'FORBIDDEN',
    httpStatus: 403,
    message: 'You do not have permission to access this resource',
    category: ErrorCategory.AUTHORIZATION
  },
  INSUFFICIENT_SCOPE: {
    code: 'INSUFFICIENT_SCOPE',
    httpStatus: 403,
    message: 'Token does not have the required scopes',
    category: ErrorCategory.AUTHORIZATION
  },
  SUBSCRIPTION_REQUIRED: {
    code: 'SUBSCRIPTION_REQUIRED',
    httpStatus: 403,
    message: 'This endpoint requires a paid subscription',
    category: ErrorCategory.AUTHORIZATION
  },
  
  // Validation errors (400)
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    httpStatus: 400,
    message: 'Request validation failed',
    category: ErrorCategory.VALIDATION
  },
  INVALID_PARAMETER: {
    code: 'INVALID_PARAMETER',
    httpStatus: 400,
    message: 'Invalid parameter value',
    category: ErrorCategory.VALIDATION
  },
  MISSING_PARAMETER: {
    code: 'MISSING_PARAMETER',
    httpStatus: 400,
    message: 'Required parameter is missing',
    category: ErrorCategory.VALIDATION
  },
  INVALID_FORMAT: {
    code: 'INVALID_FORMAT',
    httpStatus: 400,
    message: 'Invalid data format',
    category: ErrorCategory.VALIDATION
  },
  
  // Resource errors (404)
  NOT_FOUND: {
    code: 'NOT_FOUND',
    httpStatus: 404,
    message: 'Resource not found',
    category: ErrorCategory.RESOURCE
  },
  TOKEN_NOT_FOUND: {
    code: 'TOKEN_NOT_FOUND',
    httpStatus: 404,
    message: 'NFT token not found',
    category: ErrorCategory.RESOURCE
  },
  COLLECTION_NOT_FOUND: {
    code: 'COLLECTION_NOT_FOUND',
    httpStatus: 404,
    message: 'NFT collection not found',
    category: ErrorCategory.RESOURCE
  },
  CREATOR_NOT_FOUND: {
    code: 'CREATOR_NOT_FOUND',
    httpStatus: 404,
    message: 'Creator not found',
    category: ErrorCategory.RESOURCE
  },
  
  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    httpStatus: 429,
    message: 'Rate limit exceeded',
    category: ErrorCategory.RATE_LIMIT
  },
  QUOTA_EXCEEDED: {
    code: 'QUOTA_EXCEEDED',
    httpStatus: 429,
    message: 'API quota exceeded for current billing period',
    category: ErrorCategory.RATE_LIMIT
  },
  
  // Server errors (500)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    httpStatus: 500,
    message: 'Internal server error',
    category: ErrorCategory.SERVER
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    httpStatus: 503,
    message: 'Service temporarily unavailable',
    category: ErrorCategory.SERVER
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    httpStatus: 500,
    message: 'Database error',
    category: ErrorCategory.SERVER
  },
  
  // External service errors
  BLOCKCHAIN_ERROR: {
    code: 'BLOCKCHAIN_ERROR',
    httpStatus: 502,
    message: 'Error communicating with blockchain',
    category: ErrorCategory.EXTERNAL
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    httpStatus: 502,
    message: 'Error communicating with external service',
    category: ErrorCategory.EXTERNAL
  }
};

/**
 * Get error details by code
 * 
 * @param code Error code
 * @returns Error details
 */
export const getErrorByCode = (code: string): ErrorCode => {
  return ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
};

/**
 * Generate error response object
 * 
 * @param code Error code
 * @param message Optional custom message
 * @param details Optional error details
 * @returns Formatted error response
 */
export const formatErrorResponse = (
  code: string,
  message?: string,
  details?: Record<string, any>
): Record<string, any> => {
  const errorCode = getErrorByCode(code);
  
  return {
    status: 'error',
    code: errorCode.code,
    message: message || errorCode.message,
    details: details || null
  };
};

/**
 * Generate developer-friendly error guidance
 * 
 * @param code Error code
 * @returns Developer guidance for the error
 */
export const getErrorGuidance = (code: string): string => {
  const errorCode = getErrorByCode(code);
  
  switch (errorCode.category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Check your authentication credentials and ensure they are correctly formatted. For API keys, use the format "Bearer YOUR_API_KEY" in the Authorization header.';
    
    case ErrorCategory.AUTHORIZATION:
      return 'Verify that your account has the necessary permissions and subscription level to access this resource.';
    
    case ErrorCategory.VALIDATION:
      return 'Review the request parameters and ensure they match the expected format and constraints as described in the API documentation.';
    
    case ErrorCategory.RESOURCE:
      return 'Confirm that the requested resource exists and that the identifier is correct.';
    
    case ErrorCategory.RATE_LIMIT:
      return 'You have exceeded the rate limit for this endpoint. Consider upgrading your subscription or implementing request throttling in your application.';
    
    case ErrorCategory.SERVER:
      return 'This is a server-side error. If the problem persists, please contact support with the request ID for assistance.';
    
    case ErrorCategory.EXTERNAL:
      return 'The API encountered an error when communicating with an external service. This is typically a temporary issue. Please retry your request after a short delay.';
    
    default:
      return 'Please refer to the API documentation for more information on this error.';
  }
};
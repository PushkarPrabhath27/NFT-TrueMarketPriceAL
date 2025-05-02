/**
 * NFT TrustScore API SDK Types
 * 
 * Type definitions for the JavaScript/TypeScript SDK.
 */

/**
 * Authentication options
 */
export interface AuthOptions {
  apiKey?: string;
  jwt?: string;
  oauth2Token?: string;
  refreshToken?: string;
}

/**
 * API response interface
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      total: number;
      page: number;
      perPage: number;
      pages: number;
    };
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
  status: number;
  headers: Headers;
}

/**
 * Request options
 */
export interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  auth?: AuthOptions;
}

/**
 * Retry options
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

/**
 * Trust Score interfaces
 */
export interface TrustScore {
  tokenId: string;
  score: number;
  confidence: number;
  factors: {
    authenticity: number;
    market: number;
    creator: number;
    technical: number;
  };
  timestamp: string;
}

/**
 * Price Intelligence interfaces
 */
export interface PricePrediction {
  tokenId: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  priceHistory: PricePoint[];
  priceForecast: PricePoint[];
  timestamp: string;
}

export interface PricePoint {
  price: number;
  timestamp: string;
}

/**
 * Risk Assessment interfaces
 */
export interface RiskAssessment {
  tokenId: string;
  overallRisk: number;
  riskFactors: {
    market: number;
    liquidity: number;
    volatility: number;
    authenticity: number;
  };
  recommendations: string[];
  timestamp: string;
}

/**
 * Blockchain Data interfaces
 */
export interface BlockchainData {
  tokenId: string;
  contractAddress: string;
  ownerAddress: string;
  creatorAddress: string;
  tokenStandard: string;
  blockchain: string;
  metadata: Record<string, any>;
  transactionHistory: Transaction[];
}

export interface Transaction {
  transactionHash: string;
  from: string;
  to: string;
  value: number;
  timestamp: string;
}

/**
 * Fraud Detection interfaces
 */
export interface FraudDetectionResult {
  tokenId: string;
  isSuspicious: boolean;
  suspiciousFactors: string[];
  riskScore: number;
  analysisTimestamp: string;
}
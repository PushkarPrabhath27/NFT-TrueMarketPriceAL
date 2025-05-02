/**
 * API Gateway Configuration
 * 
 * This module provides configuration settings for the NFT TrustScore API Gateway.
 */

export interface ApiConfig {
  // API version
  version: number;
  
  // Server configuration
  port: number;
  host: string;
  
  // CORS configuration
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    maxAge: number;
  };
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    // Tier-based rate limits
    tiers: {
      free: number;
      basic: number;
      premium: number;
      enterprise: number;
    };
  };
  
  // Authentication configuration
  auth: {
    apiKeyHeader: string;
    jwtSecret: string;
    tokenExpiration: string;
    // OAuth2 configuration
    oauth2: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  };
  
  // Caching configuration
  cache: {
    // TTL in seconds for different resource types
    ttl: {
      nftScores: number;
      collectionScores: number;
      creatorScores: number;
      riskProfiles: number;
      priceData: number;
      blockchainData: number;
    };
    // Maximum cache size
    maxSize: number;
  };
  
  // Circuit breaker configuration
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
  };
  
  // Service endpoints
  services: {
    trustScore: string;
    priceIntelligence: string;
    riskAssessment: string;
    blockchainData: string;
    fraudDetection: string;
  };
}

/**
 * Default configuration for the API Gateway
 */
export const config: ApiConfig = {
  version: 1,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  host: process.env.HOST || 'localhost',
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    maxAge: 86400 // 24 hours
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    tiers: {
      free: 50,
      basic: 500,
      premium: 2000,
      enterprise: 10000
    }
  },
  
  auth: {
    apiKeyHeader: 'Authorization',
    jwtSecret: process.env.JWT_SECRET || 'nft-trust-score-secret-key',
    tokenExpiration: '24h',
    oauth2: {
      clientId: process.env.OAUTH_CLIENT_ID || 'default-client-id',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || 'default-client-secret',
      callbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/auth/callback'
    }
  },
  
  cache: {
    ttl: {
      nftScores: 300, // 5 minutes
      collectionScores: 600, // 10 minutes
      creatorScores: 600, // 10 minutes
      riskProfiles: 300, // 5 minutes
      priceData: 180, // 3 minutes
      blockchainData: 60 // 1 minute
    },
    maxSize: 1000 // Maximum number of items in cache
  },
  
  circuitBreaker: {
    failureThreshold: 5, // Number of failures before circuit opens
    resetTimeout: 30000 // Time in ms before attempting to close circuit
  },
  
  services: {
    trustScore: process.env.TRUST_SCORE_SERVICE || 'http://localhost:3001',
    priceIntelligence: process.env.PRICE_INTELLIGENCE_SERVICE || 'http://localhost:3002',
    riskAssessment: process.env.RISK_ASSESSMENT_SERVICE || 'http://localhost:3003',
    blockchainData: process.env.BLOCKCHAIN_DATA_SERVICE || 'http://localhost:3004',
    fraudDetection: process.env.FRAUD_DETECTION_SERVICE || 'http://localhost:3005'
  }
};
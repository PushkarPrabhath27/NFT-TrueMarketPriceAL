/**
 * DataTransformer.ts
 * 
 * This file contains types and functions for transforming raw Hathor blockchain data
 * into structured formats that can be used by the NFT TrustScore application.
 */

// NFT Data structure used throughout the application
export interface NFTData {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  creator: string;
  creationDate: string;
  metadata: NFTMetadata;
  trustScore: number;
  confidence: number;
  factors: TrustFactor[];
  history: TrustScoreHistory[];
  collectionComparison: CollectionComparisonData[];
  strengths: string[];
  concerns: string[];
  priceData: PriceData[];
  pricePrediction: PricePrediction;
  comparativePricing: ComparativePricingData[];
  riskAssessment: RiskAssessment;
  fraudDetection?: FraudDetection;
}

// NFT Metadata structure
export interface NFTMetadata {
  image?: string;
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];
  collection?: {
    name: string;
    id: string;
  };
  external_url?: string;
  animation_url?: string;
}

// Trust Factor structure
export interface TrustFactor {
  name: string;
  score: number;
  weight: number;
  description?: string;
}

// Trust Score History structure
export interface TrustScoreHistory {
  date: string;
  score: number;
}

// Collection Comparison Data structure
export interface CollectionComparisonData {
  name: string;
  score: number;
  color?: string;
}

// Price Data structure
export interface PriceData {
  date: string;
  price: number;
}

// Price Prediction structure
export interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  timeframe: string;
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
}

// Comparative Pricing Data structure
export interface ComparativePricingData {
  name: string;
  currentPrice: number;
  priceChange: number;
  history: { date: string; price: number }[];
}

// Risk Assessment structure
export interface RiskAssessment {
  overallRisk: number;
  factors: RiskFactor[];
}

// Risk Factor structure
export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description?: string;
  impact?: string;
  mitigationSteps?: string[];
  historicalTrend?: 'improving' | 'worsening' | 'stable';
}

// Fraud Detection structure
export interface FraudDetection {
  fraudScore: number;
  confidence: number;
  warnings: {
    severity: 'high' | 'medium' | 'low';
    description: string;
    evidence: string;
  }[];
  safetyChecks: {
    name: string;
    passed: boolean;
    details?: string;
  }[];
}

/**
 * Transform raw Hathor blockchain NFT data into the application's NFT data structure
 * @param rawData Raw data from the Hathor blockchain
 * @returns Transformed NFT data
 */
export const transformHathorNFTData = (rawData: any): NFTData => {
  // This would contain the actual transformation logic
  // For now, we'll return a basic structure that matches our interface
  return {
    id: rawData.id || '',
    name: rawData.name || 'Unknown NFT',
    symbol: rawData.symbol || '',
    description: rawData.description || '',
    creator: rawData.creator || 'Unknown Creator',
    creationDate: rawData.creationDate || new Date().toISOString(),
    metadata: transformMetadata(rawData.metadata || {}),
    trustScore: rawData.trustScore || 0,
    confidence: rawData.confidence || 0,
    factors: rawData.factors || [],
    history: rawData.history || [],
    collectionComparison: rawData.collectionComparison || [],
    strengths: rawData.strengths || [],
    concerns: rawData.concerns || [],
    priceData: rawData.priceData || [],
    pricePrediction: rawData.pricePrediction || {
      predictedPrice: 0,
      confidence: 0,
      timeframe: '30d',
      factors: []
    },
    comparativePricing: rawData.comparativePricing || [],
    riskAssessment: rawData.riskAssessment || {
      overallRisk: 0,
      factors: []
    },
    fraudDetection: rawData.fraudDetection
  };
};

/**
 * Transform raw metadata into the application's metadata structure
 * @param rawMetadata Raw metadata from the Hathor blockchain
 * @returns Transformed metadata
 */
const transformMetadata = (rawMetadata: any): NFTMetadata => {
  return {
    image: rawMetadata.image || '',
    attributes: rawMetadata.attributes || [],
    collection: rawMetadata.collection || { name: 'Unknown Collection', id: '' },
    external_url: rawMetadata.external_url || '',
    animation_url: rawMetadata.animation_url || ''
  };
};
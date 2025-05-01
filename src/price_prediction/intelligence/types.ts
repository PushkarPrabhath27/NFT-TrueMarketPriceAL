/**
 * Types for Price Intelligence Features
 */
import { NFTAttributes } from '../types';

/**
 * Confidence level indicator for predictions
 */
export enum ConfidenceLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

/**
 * Time horizons for price predictions
 */
export enum TimeHorizon {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d'
}

/**
 * Valuation status of an NFT
 */
export enum ValuationStatus {
  UNDERVALUED = 'Undervalued',
  FAIR_VALUED = 'Fair Valued',
  OVERVALUED = 'Overvalued'
}

/**
 * Fair value estimation result
 */
export interface FairValueEstimation {
  tokenId: string;
  collectionId: string;
  estimatedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  listedPrice?: number;
  valueDifference?: number;
  valueDrivers: {
    driver: string;
    impact: number;
    description: string;
  }[];
  confidenceLevel: ConfidenceLevel;
  explanation: string;
  timestamp: number;
}

/**
 * Price trend prediction result
 */
export interface PriceTrendPrediction {
  tokenId: string;
  collectionId: string;
  forecasts: {
    timeHorizon: TimeHorizon;
    predictedPrice: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }[];
  trendStrength: number; // 0-1 scale
  trendDirection: 'up' | 'down' | 'stable';
  conditionalForecasts?: {
    scenario: string;
    prediction: number;
    probability: number;
  }[];
  milestones?: {
    targetPrice: number;
    estimatedTimeframe: string;
    probability: number;
  }[];
  visualizationData: {
    timestamps: number[];
    predictedValues: number[];
    upperBound: number[];
    lowerBound: number[];
  };
  confidenceLevel: ConfidenceLevel;
  timestamp: number;
}

/**
 * Valuation assessment result
 */
export interface ValuationAssessment {
  tokenId: string;
  collectionId: string;
  fairValue: number;
  currentPrice: number;
  percentageDifference: number;
  valuationStatus: ValuationStatus;
  comparisonMetrics: {
    metric: string;
    value: number;
    collectionAverage: number;
    percentDifference: number;
  }[];
  opportunityScore: number; // 0-100 scale
  valuationGapExplanation: string;
  confidenceLevel: ConfidenceLevel;
  timestamp: number;
}

/**
 * Price volatility metrics
 */
export interface PriceVolatilityMetrics {
  tokenId: string;
  collectionId: string;
  historicalVolatility: number;
  predictedVolatility: {
    timeHorizon: TimeHorizon;
    value: number;
  }[];
  relativeVolatility: {
    toCollection: number;
    toMarket: number;
  };
  riskAdjustedValuation: number;
  priceMovementBands: {
    timeHorizon: TimeHorizon;
    upperBand: number;
    lowerBand: number;
    probability: number;
  }[];
  timestamp: number;
}

/**
 * Confidence metrics for predictions
 */
export interface ConfidenceMetrics {
  modelUncertainty: number;
  predictionInterval: {
    lower: number;
    upper: number;
    confidencePercentage: number;
  };
  confidenceLevel: ConfidenceLevel;
  confidenceFactors: {
    factor: string;
    impact: number; // -1 to 1 scale
    description: string;
  }[];
  improvementSuggestions: string[];
  timestamp: number;
}
/**
 * Evaluation Framework for NFT Price Prediction Models
 * 
 * This module implements various error metrics, time-horizon specific evaluation,
 * categorical performance analysis, price range specific accuracy assessment,
 * and visualization of error distributions.
 */

import { PricePrediction, ActualPrice, NFTAttributes, CollectionMetadata } from '../types';

/**
 * Error metric types supported by the evaluation framework
 */
export enum ErrorMetricType {
  MAE = 'mean_absolute_error',
  RMSE = 'root_mean_squared_error',
  MAPE = 'mean_absolute_percentage_error'
}

/**
 * Time horizons for evaluation
 */
export enum TimeHorizon {
  DAY_1 = '1d',
  DAY_7 = '7d',
  DAY_30 = '30d',
  DAY_90 = '90d'
}

/**
 * Price range categories for stratified evaluation
 */
export enum PriceRange {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

/**
 * Interface for evaluation results
 */
export interface EvaluationResult {
  metricType: ErrorMetricType;
  value: number;
  timeHorizon?: TimeHorizon;
  category?: string;
  priceRange?: PriceRange;
  sampleSize: number;
}

/**
 * Interface for error distribution visualization data
 */
export interface ErrorDistribution {
  bins: number[];
  frequencies: number[];
  metricType: ErrorMetricType;
  timeHorizon?: TimeHorizon;
  category?: string;
  priceRange?: PriceRange;
}

/**
 * Calculates Mean Absolute Error between predicted and actual prices
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @returns MAE value
 */
export function calculateMAE(predictions: number[], actuals: number[]): number {
  if (predictions.length !== actuals.length || predictions.length === 0) {
    throw new Error('Predictions and actuals arrays must have the same non-zero length');
  }
  
  const sum = predictions.reduce((acc, pred, index) => {
    return acc + Math.abs(pred - actuals[index]);
  }, 0);
  
  return sum / predictions.length;
}

/**
 * Calculates Root Mean Squared Error between predicted and actual prices
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @returns RMSE value
 */
export function calculateRMSE(predictions: number[], actuals: number[]): number {
  if (predictions.length !== actuals.length || predictions.length === 0) {
    throw new Error('Predictions and actuals arrays must have the same non-zero length');
  }
  
  const sum = predictions.reduce((acc, pred, index) => {
    const diff = pred - actuals[index];
    return acc + (diff * diff);
  }, 0);
  
  return Math.sqrt(sum / predictions.length);
}

/**
 * Calculates Mean Absolute Percentage Error between predicted and actual prices
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @returns MAPE value
 */
export function calculateMAPE(predictions: number[], actuals: number[]): number {
  if (predictions.length !== actuals.length || predictions.length === 0) {
    throw new Error('Predictions and actuals arrays must have the same non-zero length');
  }
  
  // Filter out zero actual values to avoid division by zero
  const validPairs = predictions.map((pred, index) => ({
    prediction: pred,
    actual: actuals[index]
  })).filter(pair => pair.actual !== 0);
  
  if (validPairs.length === 0) {
    throw new Error('No valid pairs with non-zero actual values');
  }
  
  const sum = validPairs.reduce((acc, pair) => {
    return acc + (Math.abs(pair.prediction - pair.actual) / Math.abs(pair.actual));
  }, 0);
  
  return (sum / validPairs.length) * 100; // Return as percentage
}

/**
 * Calculates the specified error metric
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @param metricType Type of error metric to calculate
 * @returns Calculated error metric value
 */
export function calculateErrorMetric(
  predictions: number[],
  actuals: number[],
  metricType: ErrorMetricType
): number {
  switch (metricType) {
    case ErrorMetricType.MAE:
      return calculateMAE(predictions, actuals);
    case ErrorMetricType.RMSE:
      return calculateRMSE(predictions, actuals);
    case ErrorMetricType.MAPE:
      return calculateMAPE(predictions, actuals);
    default:
      throw new Error(`Unsupported error metric type: ${metricType}`);
  }
}

/**
 * Evaluates model performance for a specific time horizon
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @param timeHorizon Time horizon for evaluation
 * @param metricTypes Array of error metrics to calculate
 * @returns Array of evaluation results
 */
export function evaluateTimeHorizon(
  predictions: number[],
  actuals: number[],
  timeHorizon: TimeHorizon,
  metricTypes: ErrorMetricType[] = [ErrorMetricType.MAE, ErrorMetricType.RMSE, ErrorMetricType.MAPE]
): EvaluationResult[] {
  return metricTypes.map(metricType => ({
    metricType,
    value: calculateErrorMetric(predictions, actuals, metricType),
    timeHorizon,
    sampleSize: predictions.length
  }));
}

/**
 * Categorizes NFTs based on their attributes for categorical performance analysis
 * @param nftAttributes Array of NFT attributes
 * @param categoryAttribute The attribute to use for categorization
 * @returns Map of category to array of indices
 */
export function categorizeNFTs(
  nftAttributes: NFTAttributes[],
  categoryAttribute: string
): Map<string, number[]> {
  const categoryMap = new Map<string, number[]>();
  
  nftAttributes.forEach((attributes, index) => {
    const categoryValue = attributes[categoryAttribute]?.toString() || 'unknown';
    
    if (!categoryMap.has(categoryValue)) {
      categoryMap.set(categoryValue, []);
    }
    
    categoryMap.get(categoryValue)?.push(index);
  });
  
  return categoryMap;
}

/**
 * Performs categorical performance analysis
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @param nftAttributes Array of NFT attributes
 * @param categoryAttribute The attribute to use for categorization
 * @param metricType Error metric to calculate
 * @returns Array of evaluation results by category
 */
export function evaluateByCategory(
  predictions: number[],
  actuals: number[],
  nftAttributes: NFTAttributes[],
  categoryAttribute: string,
  metricType: ErrorMetricType = ErrorMetricType.MAE
): EvaluationResult[] {
  const categoryMap = categorizeNFTs(nftAttributes, categoryAttribute);
  const results: EvaluationResult[] = [];
  
  categoryMap.forEach((indices, category) => {
    if (indices.length > 0) {
      const categoryPredictions = indices.map(i => predictions[i]);
      const categoryActuals = indices.map(i => actuals[i]);
      
      results.push({
        metricType,
        value: calculateErrorMetric(categoryPredictions, categoryActuals, metricType),
        category,
        sampleSize: indices.length
      });
    }
  });
  
  return results;
}

/**
 * Determines price range category based on price value and collection metadata
 * @param price Price value
 * @param metadata Collection metadata with price statistics
 * @returns Price range category
 */
export function determinePriceRange(price: number, metadata: CollectionMetadata): PriceRange {
  const { floorPrice, averagePrice, maxPrice } = metadata;
  
  if (price < floorPrice) {
    return PriceRange.VERY_LOW;
  } else if (price < averagePrice * 0.5) {
    return PriceRange.LOW;
  } else if (price < averagePrice * 1.5) {
    return PriceRange.MEDIUM;
  } else if (price < maxPrice * 0.7) {
    return PriceRange.HIGH;
  } else {
    return PriceRange.VERY_HIGH;
  }
}

/**
 * Evaluates model performance across different price ranges
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @param metadata Collection metadata with price statistics
 * @param metricType Error metric to calculate
 * @returns Array of evaluation results by price range
 */
export function evaluateByPriceRange(
  predictions: number[],
  actuals: number[],
  metadata: CollectionMetadata,
  metricType: ErrorMetricType = ErrorMetricType.MAE
): EvaluationResult[] {
  // Group indices by price range
  const priceRangeMap = new Map<PriceRange, number[]>();
  
  actuals.forEach((price, index) => {
    const range = determinePriceRange(price, metadata);
    
    if (!priceRangeMap.has(range)) {
      priceRangeMap.set(range, []);
    }
    
    priceRangeMap.get(range)?.push(index);
  });
  
  const results: EvaluationResult[] = [];
  
  priceRangeMap.forEach((indices, priceRange) => {
    if (indices.length > 0) {
      const rangePredictions = indices.map(i => predictions[i]);
      const rangeActuals = indices.map(i => actuals[i]);
      
      results.push({
        metricType,
        value: calculateErrorMetric(rangePredictions, rangeActuals, metricType),
        priceRange,
        sampleSize: indices.length
      });
    }
  });
  
  return results;
}

/**
 * Generates data for error distribution visualization
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @param metricType Error metric type
 * @param numBins Number of bins for the histogram
 * @returns Error distribution data
 */
export function generateErrorDistribution(
  predictions: number[],
  actuals: number[],
  metricType: ErrorMetricType = ErrorMetricType.MAE,
  numBins: number = 10
): ErrorDistribution {
  // Calculate errors
  const errors = predictions.map((pred, index) => {
    const actual = actuals[index];
    switch (metricType) {
      case ErrorMetricType.MAE:
        return Math.abs(pred - actual);
      case ErrorMetricType.RMSE:
        return Math.pow(pred - actual, 2);
      case ErrorMetricType.MAPE:
        return actual !== 0 ? (Math.abs(pred - actual) / Math.abs(actual)) * 100 : null;
      default:
        return Math.abs(pred - actual);
    }
  }).filter((error): error is number => error !== null);
  
  // Find min and max errors
  const minError = Math.min(...errors);
  const maxError = Math.max(...errors);
  
  // Create bins
  const binWidth = (maxError - minError) / numBins;
  const bins = Array.from({ length: numBins }, (_, i) => minError + i * binWidth);
  
  // Initialize frequencies
  const frequencies = Array(numBins).fill(0);
  
  // Count frequencies
  errors.forEach(error => {
    // Handle edge case for maximum value
    if (error === maxError) {
      frequencies[numBins - 1]++;
      return;
    }
    
    const binIndex = Math.floor((error - minError) / binWidth);
    frequencies[binIndex]++;
  });
  
  return {
    bins,
    frequencies,
    metricType
  };
}

/**
 * Comprehensive evaluation of model performance
 * @param predictions Array of price predictions
 * @param actuals Array of actual prices
 * @param nftAttributes Array of NFT attributes
 * @param metadata Collection metadata
 * @param timeHorizon Optional time horizon for evaluation
 * @returns Object containing various evaluation results
 */
export function evaluateModelPerformance(
  predictions: number[],
  actuals: number[],
  nftAttributes: NFTAttributes[],
  metadata: CollectionMetadata,
  timeHorizon?: TimeHorizon
) {
  // Overall metrics
  const overallMetrics = [
    ErrorMetricType.MAE,
    ErrorMetricType.RMSE,
    ErrorMetricType.MAPE
  ].map(metricType => ({
    metricType,
    value: calculateErrorMetric(predictions, actuals, metricType),
    timeHorizon,
    sampleSize: predictions.length
  }));
  
  // Categorical analysis (using the first attribute as an example)
  const categoryAttribute = Object.keys(nftAttributes[0])[0];
  const categoryAnalysis = evaluateByCategory(
    predictions,
    actuals,
    nftAttributes,
    categoryAttribute
  );
  
  // Price range analysis
  const priceRangeAnalysis = evaluateByPriceRange(
    predictions,
    actuals,
    metadata
  );
  
  // Error distribution
  const errorDistribution = generateErrorDistribution(
    predictions,
    actuals
  );
  
  return {
    overallMetrics,
    categoryAnalysis,
    priceRangeAnalysis,
    errorDistribution,
    timeHorizon
  };
}
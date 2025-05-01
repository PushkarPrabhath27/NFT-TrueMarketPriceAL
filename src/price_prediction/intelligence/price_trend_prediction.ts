/**
 * Price Trend Prediction Module
 * 
 * Implements forecasting for multiple time horizons, trend strength and direction indicators,
 * conditional forecasts, milestone predictions, and visualization data generation.
 */

import { NFT, Collection, EnsemblePrediction, ModelPrediction } from '../types';
import { PriceTrendPrediction, TimeHorizon, ConfidenceLevel } from './types';
import { calculateConfidenceMetrics } from './fair_value_estimation';

/**
 * Generates price trend predictions for an NFT across multiple time horizons
 * 
 * @param nft The NFT to generate trend predictions for
 * @param collection The collection the NFT belongs to
 * @param currentPrediction The current ensemble prediction
 * @param historicalPredictions Optional array of historical predictions for trend analysis
 * @returns Comprehensive price trend prediction with visualization data
 */
export function generatePriceTrendPrediction(
  nft: NFT,
  collection: Collection,
  currentPrediction: EnsemblePrediction,
  historicalPredictions?: EnsemblePrediction[]
): PriceTrendPrediction {
  // Generate forecasts for different time horizons
  const forecasts = generateTimeHorizonForecasts(nft, collection, currentPrediction);
  
  // Calculate trend strength and direction
  const { trendStrength, trendDirection } = calculateTrendIndicators(forecasts, historicalPredictions);
  
  // Generate conditional forecasts based on market scenarios
  const conditionalForecasts = generateConditionalForecasts(nft, collection, currentPrediction);
  
  // Generate milestone predictions (time to reach price targets)
  const milestones = generateMilestonePredictions(nft, collection, forecasts, trendDirection);
  
  // Generate visualization data for trend projection
  const visualizationData = generateVisualizationData(forecasts, historicalPredictions);
  
  // Determine confidence level based on prediction stability and data quality
  const confidenceMetrics = calculateConfidenceMetrics(currentPrediction, nft, collection);
  const confidenceLevel = determineConfidenceLevel(confidenceMetrics.modelUncertainty, trendStrength);
  
  return {
    tokenId: nft.tokenId,
    collectionId: collection.id,
    forecasts,
    trendStrength,
    trendDirection,
    conditionalForecasts,
    milestones,
    visualizationData,
    confidenceLevel,
    timestamp: Date.now()
  };
}

/**
 * Generates forecasts for different time horizons
 * 
 * @param nft The NFT to forecast prices for
 * @param collection The collection the NFT belongs to
 * @param currentPrediction The current ensemble prediction
 * @returns Array of forecasts for different time horizons
 */
function generateTimeHorizonForecasts(
  nft: NFT,
  collection: Collection,
  currentPrediction: EnsemblePrediction
): PriceTrendPrediction['forecasts'] {
  const { predictedPrice, confidenceInterval } = currentPrediction;
  const currentConfidenceWidth = confidenceInterval.upper - confidenceInterval.lower;
  
  // Collection growth rate (simplified calculation)
  const collectionGrowthRate = calculateCollectionGrowthRate(collection);
  
  // Generate forecasts for each time horizon with widening confidence intervals
  return Object.values(TimeHorizon).map(timeHorizon => {
    // Apply different growth factors based on time horizon
    let growthFactor: number;
    let confidenceWidthMultiplier: number;
    
    switch (timeHorizon) {
      case TimeHorizon.SEVEN_DAYS:
        growthFactor = Math.pow(1 + collectionGrowthRate, 7/30); // 7 days growth
        confidenceWidthMultiplier = 1.5;
        break;
      case TimeHorizon.THIRTY_DAYS:
        growthFactor = Math.pow(1 + collectionGrowthRate, 1); // 30 days growth
        confidenceWidthMultiplier = 2;
        break;
      case TimeHorizon.NINETY_DAYS:
        growthFactor = Math.pow(1 + collectionGrowthRate, 3); // 90 days growth
        confidenceWidthMultiplier = 3;
        break;
      default:
        growthFactor = 1;
        confidenceWidthMultiplier = 1;
    }
    
    // Calculate predicted price and confidence interval for this horizon
    const horizonPredictedPrice = predictedPrice * growthFactor;
    const horizonConfidenceWidth = currentConfidenceWidth * confidenceWidthMultiplier;
    
    return {
      timeHorizon,
      predictedPrice: horizonPredictedPrice,
      confidenceInterval: {
        lower: Math.max(0, horizonPredictedPrice - horizonConfidenceWidth / 2),
        upper: horizonPredictedPrice + horizonConfidenceWidth / 2
      }
    };
  });
}

/**
 * Calculates collection growth rate based on historical data
 * 
 * @param collection The collection to calculate growth rate for
 * @returns Monthly growth rate as a decimal
 */
function calculateCollectionGrowthRate(collection: Collection): number {
  // In a real implementation, this would analyze historical floor prices
  // For this example, we'll use a simplified approach
  
  // Sort sales by timestamp
  const sortedSales = [...collection.sales].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // If we have limited data, return a conservative estimate
  if (sortedSales.length < 10) {
    return 0.01; // 1% monthly growth
  }
  
  // Calculate average monthly growth rate from sales data
  // This is a simplified calculation - real implementation would be more sophisticated
  const oldestSales = sortedSales.slice(0, Math.floor(sortedSales.length / 4));
  const newestSales = sortedSales.slice(-Math.floor(sortedSales.length / 4));
  
  const oldestAvgPrice = oldestSales.reduce((sum, sale) => sum + sale.price, 0) / oldestSales.length;
  const newestAvgPrice = newestSales.reduce((sum, sale) => sum + sale.price, 0) / newestSales.length;
  
  const oldestAvgTime = new Date(oldestSales.reduce((sum, sale) => sum + new Date(sale.timestamp).getTime(), 0) / oldestSales.length);
  const newestAvgTime = new Date(newestSales.reduce((sum, sale) => sum + new Date(sale.timestamp).getTime(), 0) / newestSales.length);
  
  const monthsDifference = (newestAvgTime.getTime() - oldestAvgTime.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsDifference <= 0) {
    return 0.01; // Fallback to default growth rate
  }
  
  // Calculate monthly growth rate
  const growthRate = Math.pow(newestAvgPrice / oldestAvgPrice, 1 / monthsDifference) - 1;
  
  // Clamp growth rate to reasonable bounds
  return Math.max(-0.2, Math.min(0.5, growthRate));
}

/**
 * Calculates trend indicators based on forecasts and historical data
 * 
 * @param forecasts The generated forecasts for different time horizons
 * @param historicalPredictions Optional array of historical predictions
 * @returns Trend strength (0-1) and direction (up/down/stable)
 */
function calculateTrendIndicators(
  forecasts: PriceTrendPrediction['forecasts'],
  historicalPredictions?: EnsemblePrediction[]
): { trendStrength: number; trendDirection: 'up' | 'down' | 'stable' } {
  // Find short and long term forecasts
  const shortTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.SEVEN_DAYS);
  const longTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.NINETY_DAYS);
  
  if (!shortTerm || !longTerm) {
    return { trendStrength: 0.5, trendDirection: 'stable' };
  }
  
  // Calculate percentage change from current to long term
  const currentToLongTermChange = (longTerm.predictedPrice - shortTerm.predictedPrice) / shortTerm.predictedPrice;
  
  // Determine direction based on change
  let trendDirection: 'up' | 'down' | 'stable';
  if (currentToLongTermChange > 0.05) {
    trendDirection = 'up';
  } else if (currentToLongTermChange < -0.05) {
    trendDirection = 'down';
  } else {
    trendDirection = 'stable';
  }
  
  // Calculate trend strength based on magnitude of change and confidence
  const trendStrength = Math.min(1, Math.abs(currentToLongTermChange) * 5);
  
  return { trendStrength, trendDirection };
}

/**
 * Generates conditional forecasts based on different market scenarios
 * 
 * @param nft The NFT to generate conditional forecasts for
 * @param collection The collection the NFT belongs to
 * @param currentPrediction The current ensemble prediction
 * @returns Array of conditional forecasts for different scenarios
 */
function generateConditionalForecasts(
  nft: NFT,
  collection: Collection,
  currentPrediction: EnsemblePrediction
): PriceTrendPrediction['conditionalForecasts'] {
  const { predictedPrice } = currentPrediction;
  
  return [
    {
      scenario: 'Bull Market',
      prediction: predictedPrice * 1.5,
      probability: 0.25
    },
    {
      scenario: 'Bear Market',
      prediction: predictedPrice * 0.7,
      probability: 0.25
    },
    {
      scenario: 'Stable Market',
      prediction: predictedPrice * 1.1,
      probability: 0.5
    }
  ];
}

/**
 * Generates milestone predictions for reaching specific price targets
 * 
 * @param nft The NFT to generate milestone predictions for
 * @param collection The collection the NFT belongs to
 * @param forecasts The generated forecasts for different time horizons
 * @param trendDirection The calculated trend direction
 * @returns Array of milestone predictions
 */
function generateMilestonePredictions(
  nft: NFT,
  collection: Collection,
  forecasts: PriceTrendPrediction['forecasts'],
  trendDirection: 'up' | 'down' | 'stable'
): PriceTrendPrediction['milestones'] {
  // If trend is stable or down, no meaningful milestones to predict
  if (trendDirection !== 'up') {
    return [];
  }
  
  const shortTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.SEVEN_DAYS);
  const mediumTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.THIRTY_DAYS);
  const longTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.NINETY_DAYS);
  
  if (!shortTerm || !mediumTerm || !longTerm) {
    return [];
  }
  
  // Calculate milestone targets based on current prediction and growth
  const currentPrice = shortTerm.predictedPrice;
  const targets = [
    { targetPrice: currentPrice * 1.25, label: '25% increase' },
    { targetPrice: currentPrice * 1.5, label: '50% increase' },
    { targetPrice: currentPrice * 2, label: '100% increase' }
  ];
  
  // Estimate timeframes based on forecasted growth rate
  return targets.map(target => {
    let estimatedTimeframe: string;
    let probability: number;
    
    if (target.targetPrice <= mediumTerm.predictedPrice) {
      // Target achievable within 30 days
      estimatedTimeframe = 'Within 30 days';
      probability = 0.7;
    } else if (target.targetPrice <= longTerm.predictedPrice) {
      // Target achievable within 90 days
      estimatedTimeframe = 'Within 90 days';
      probability = 0.5;
    } else {
      // Target beyond our forecast horizon
      estimatedTimeframe = 'Beyond 90 days';
      probability = 0.3;
    }
    
    return {
      targetPrice: target.targetPrice,
      estimatedTimeframe,
      probability
    };
  });
}

/**
 * Generates visualization data for trend projection
 * 
 * @param forecasts The generated forecasts for different time horizons
 * @param historicalPredictions Optional array of historical predictions
 * @returns Visualization data with timestamps and predicted values
 */
function generateVisualizationData(
  forecasts: PriceTrendPrediction['forecasts'],
  historicalPredictions?: EnsemblePrediction[]
): PriceTrendPrediction['visualizationData'] {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  // Generate timestamps for the next 90 days
  const timestamps = Array.from({ length: 91 }, (_, i) => now + i * dayInMs);
  
  // Initialize arrays for predicted values and bounds
  const predictedValues: number[] = [];
  const upperBound: number[] = [];
  const lowerBound: number[] = [];
  
  // Find forecast values for key points
  const shortTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.SEVEN_DAYS);
  const mediumTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.THIRTY_DAYS);
  const longTerm = forecasts.find(f => f.timeHorizon === TimeHorizon.NINETY_DAYS);
  
  if (!shortTerm || !mediumTerm || !longTerm) {
    // Fallback if forecasts are missing
    return {
      timestamps,
      predictedValues: Array(91).fill(0),
      upperBound: Array(91).fill(0),
      lowerBound: Array(91).fill(0)
    };
  }
  
  // Create interpolation points
  const points = [
    { day: 0, value: shortTerm.predictedPrice, upper: shortTerm.confidenceInterval.upper, lower: shortTerm.confidenceInterval.lower },
    { day: 7, value: shortTerm.predictedPrice, upper: shortTerm.confidenceInterval.upper, lower: shortTerm.confidenceInterval.lower },
    { day: 30, value: mediumTerm.predictedPrice, upper: mediumTerm.confidenceInterval.upper, lower: mediumTerm.confidenceInterval.lower },
    { day: 90, value: longTerm.predictedPrice, upper: longTerm.confidenceInterval.upper, lower: longTerm.confidenceInterval.lower }
  ];
  
  // Generate values for each day using linear interpolation between points
  for (let day = 0; day <= 90; day++) {
    // Find the two points to interpolate between
    let startPoint = points[0];
    let endPoint = points[points.length - 1];
    
    for (let i = 0; i < points.length - 1; i++) {
      if (day >= points[i].day && day <= points[i + 1].day) {
        startPoint = points[i];
        endPoint = points[i + 1];
        break;
      }
    }
    
    // Linear interpolation
    const ratio = (day - startPoint.day) / (endPoint.day - startPoint.day);
    const predictedValue = startPoint.value + ratio * (endPoint.value - startPoint.value);
    const upper = startPoint.upper + ratio * (endPoint.upper - startPoint.upper);
    const lower = startPoint.lower + ratio * (endPoint.lower - startPoint.lower);
    
    predictedValues.push(predictedValue);
    upperBound.push(upper);
    lowerBound.push(lower);
  }
  
  return {
    timestamps,
    predictedValues,
    upperBound,
    lowerBound
  };
}

/**
 * Determines confidence level for trend prediction
 * 
 * @param modelUncertainty The model uncertainty value
 * @param trendStrength The calculated trend strength
 * @returns The appropriate confidence level (HIGH, MEDIUM, LOW)
 */
function determineConfidenceLevel(modelUncertainty: number, trendStrength: number): ConfidenceLevel {
  // Strong trends with low uncertainty get higher confidence
  if (modelUncertainty < 0.2 && trendStrength > 0.7) {
    return ConfidenceLevel.HIGH;
  } else if (modelUncertainty < 0.4 && trendStrength > 0.4) {
    return ConfidenceLevel.MEDIUM;
  } else {
    return ConfidenceLevel.LOW;
  }
}
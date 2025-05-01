/**
 * Ensemble Integration for NFT Price Prediction
 * 
 * This module implements a system that stacks multiple model predictions,
 * creates dynamic weighting based on performance, specialized ensembles for different NFT categories,
 * builds fallback strategies, and generates explanations for ensemble decisions.
 */

import { NFT, Collection, ModelPrediction, EnsemblePrediction, NFTCategory } from '../types';
import { predictPriceWithRegressionModels } from './regression_models';
import { predictPriceWithTimeSeriesModels } from './time_series_models';
import { predictPriceWithComparableSales } from './comparable_sales';
import { predictPriceWithRarityModel } from './rarity_based_models';

// Performance tracking for dynamic weighting
interface ModelPerformance {
  modelType: string;
  recentMAPE: number; // Mean Absolute Percentage Error
  recentRMSE: number; // Root Mean Squared Error
  predictionCount: number;
  lastUpdated: Date;
}

// Store model performance data
let modelPerformanceCache: Record<string, ModelPerformance> = {};

/**
 * Updates model performance metrics based on prediction vs actual sale
 * @param modelType Type of model that made the prediction
 * @param predictedPrice The price that was predicted
 * @param actualPrice The actual sale price
 * @param collection The collection the NFT belongs to
 */
export function updateModelPerformance(
  modelType: string,
  predictedPrice: number,
  actualPrice: number,
  collection: string
): void {
  const key = `${collection}:${modelType}`;
  const performance = modelPerformanceCache[key] || {
    modelType,
    recentMAPE: 0,
    recentRMSE: 0,
    predictionCount: 0,
    lastUpdated: new Date()
  };
  
  // Calculate error metrics
  const absoluteError = Math.abs(predictedPrice - actualPrice);
  const squaredError = Math.pow(predictedPrice - actualPrice, 2);
  const absolutePercentageError = actualPrice > 0 ? (absoluteError / actualPrice) * 100 : 0;
  
  // Update running averages with exponential decay (more weight to recent performance)
  const alpha = 0.3; // Weight for new observation
  performance.recentMAPE = (1 - alpha) * performance.recentMAPE + alpha * absolutePercentageError;
  performance.recentRMSE = Math.sqrt((1 - alpha) * Math.pow(performance.recentRMSE, 2) + alpha * squaredError);
  performance.predictionCount += 1;
  performance.lastUpdated = new Date();
  
  // Update cache
  modelPerformanceCache[key] = performance;
}

/**
 * Gets model weights based on recent performance
 * @param collection Collection identifier
 * @returns Object mapping model types to weights
 */
function getModelWeights(collection: string): Record<string, number> {
  const modelTypes = ['regression', 'time-series', 'comparable-sales', 'rarity-based'];
  const weights: Record<string, number> = {};
  
  // Get performance data for each model type
  const performances = modelTypes.map(modelType => {
    const key = `${collection}:${modelType}`;
    return modelPerformanceCache[key] || {
      modelType,
      recentMAPE: 100, // High default error for models without performance data
      recentRMSE: 100,
      predictionCount: 0,
      lastUpdated: new Date(0) // Epoch time
    };
  });
  
  // Calculate weights inversely proportional to error (lower error = higher weight)
  // Use MAPE as the primary error metric
  const totalInverseError = performances.reduce((sum, p) => sum + (1 / (p.recentMAPE + 0.1)), 0);
  
  performances.forEach(p => {
    const inverseError = 1 / (p.recentMAPE + 0.1); // Add small constant to avoid division by zero
    weights[p.modelType] = totalInverseError > 0 ? inverseError / totalInverseError : 0.25;
  });
  
  return weights;
}

/**
 * Stacks multiple model predictions with dynamic weighting
 * @param nft The NFT to predict price for
 * @param collection The collection the NFT belongs to
 * @returns Ensemble prediction with confidence interval
 */
export function stackModelPredictions(
  nft: NFT,
  collection: Collection
): EnsemblePrediction {
  // Get predictions from individual models
  const regressionPrediction = predictPriceWithRegressionModels(nft, collection);
  const timeSeriesPrediction = predictPriceWithTimeSeriesModels(nft, collection);
  const comparableSalesPrediction = predictPriceWithComparableSales(nft, collection);
  const rarityPrediction = predictPriceWithRarityModel(nft, collection);
  
  // Collect all predictions
  const predictions = [
    { ...regressionPrediction, modelType: 'regression' },
    { ...timeSeriesPrediction, modelType: 'time-series' },
    { ...comparableSalesPrediction, modelType: 'comparable-sales' },
    { ...rarityPrediction, modelType: 'rarity-based' }
  ];
  
  // Get dynamic weights based on recent performance
  const weights = getModelWeights(collection.id);
  
  // Calculate weighted average prediction
  let weightedSum = 0;
  let totalWeight = 0;
  let minPrice = Infinity;
  let maxPrice = 0;
  
  predictions.forEach(prediction => {
    const weight = weights[prediction.modelType] || 0.25; // Default equal weight
    weightedSum += prediction.predictedPrice * weight;
    totalWeight += weight;
    
    // Track min/max for confidence interval
    minPrice = Math.min(minPrice, prediction.confidenceInterval.lower);
    maxPrice = Math.max(maxPrice, prediction.confidenceInterval.upper);
  });
  
  const ensemblePredictedPrice = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Calculate blended confidence score
  const confidenceScore = predictions.reduce(
    (sum, p) => sum + (p.confidenceScore * (weights[p.modelType] || 0.25)), 
    0
  ) / totalWeight;
  
  // Create ensemble prediction
  return {
    predictedPrice: ensemblePredictedPrice,
    confidenceInterval: {
      lower: minPrice,
      upper: maxPrice
    },
    confidenceScore,
    modelWeights: weights,
    individualPredictions: predictions,
    explanationFactors: generateExplanationFactors(predictions, weights)
  };
}

/**
 * Creates specialized ensemble for different NFT categories
 * @param nft The NFT to predict price for
 * @param collection The collection the NFT belongs to
 * @param category The NFT category
 * @returns Specialized ensemble prediction
 */
export function createSpecializedEnsemble(
  nft: NFT,
  collection: Collection,
  category: NFTCategory
): EnsemblePrediction {
  // Get base ensemble prediction
  const basePrediction = stackModelPredictions(nft, collection);
  
  // Adjust weights based on NFT category
  const specializedWeights = { ...basePrediction.modelWeights };
  
  // Apply category-specific adjustments
  switch (category) {
    case 'art':
      // For art NFTs, emphasize rarity and comparable sales
      specializedWeights['rarity-based'] = Math.min(1, specializedWeights['rarity-based'] * 1.5);
      specializedWeights['comparable-sales'] = Math.min(1, specializedWeights['comparable-sales'] * 1.3);
      break;
      
    case 'collectible':
      // For collectibles, emphasize rarity and regression models
      specializedWeights['rarity-based'] = Math.min(1, specializedWeights['rarity-based'] * 1.4);
      specializedWeights['regression'] = Math.min(1, specializedWeights['regression'] * 1.2);
      break;
      
    case 'gaming':
      // For gaming NFTs, emphasize time series and regression
      specializedWeights['time-series'] = Math.min(1, specializedWeights['time-series'] * 1.4);
      specializedWeights['regression'] = Math.min(1, specializedWeights['regression'] * 1.3);
      break;
      
    case 'metaverse':
      // For metaverse NFTs, balanced approach with slight emphasis on time series
      specializedWeights['time-series'] = Math.min(1, specializedWeights['time-series'] * 1.2);
      break;
      
    default:
      // Use default weights for other categories
      break;
  }
  
  // Normalize weights
  const totalWeight = Object.values(specializedWeights).reduce((sum, w) => sum + w, 0);
  Object.keys(specializedWeights).forEach(key => {
    specializedWeights[key] = specializedWeights[key] / totalWeight;
  });
  
  // Recalculate prediction with specialized weights
  let weightedSum = 0;
  basePrediction.individualPredictions.forEach(prediction => {
    const weight = specializedWeights[prediction.modelType] || 0;
    weightedSum += prediction.predictedPrice * weight;
  });
  
  // Update prediction with specialized weights
  return {
    ...basePrediction,
    predictedPrice: weightedSum,
    modelWeights: specializedWeights,
    explanationFactors: generateExplanationFactors(
      basePrediction.individualPredictions, 
      specializedWeights
    )
  };
}

/**
 * Implements fallback strategies for low-confidence predictions
 * @param prediction The initial ensemble prediction
 * @param nft The NFT to predict price for
 * @param collection The collection the NFT belongs to
 * @returns Potentially adjusted prediction with fallback applied
 */
export function applyFallbackStrategies(
  prediction: EnsemblePrediction,
  nft: NFT,
  collection: Collection
): EnsemblePrediction {
  // If confidence is acceptable, return original prediction
  if (prediction.confidenceScore >= 0.6) {
    return prediction;
  }
  
  // Apply fallback strategies for low confidence predictions
  let fallbackPrediction = { ...prediction };
  let fallbackApplied = false;
  let fallbackDescription = '';
  
  // Strategy 1: If comparable sales has highest confidence, increase its weight
  const comparableSalesPrediction = prediction.individualPredictions.find(
    p => p.modelType === 'comparable-sales'
  );
  
  if (comparableSalesPrediction && comparableSalesPrediction.confidenceScore > 0.7) {
    const newWeights = { ...prediction.modelWeights };
    newWeights['comparable-sales'] = 0.6; // Increase weight
    
    // Normalize other weights
    const remainingWeight = 0.4;
    const otherModels = Object.keys(newWeights).filter(k => k !== 'comparable-sales');
    otherModels.forEach(model => {
      newWeights[model] = remainingWeight / otherModels.length;
    });
    
    // Recalculate prediction
    let weightedSum = 0;
    prediction.individualPredictions.forEach(p => {
      weightedSum += p.predictedPrice * newWeights[p.modelType];
    });
    
    fallbackPrediction.predictedPrice = weightedSum;
    fallbackPrediction.modelWeights = newWeights;
    fallbackApplied = true;
    fallbackDescription = 'Increased weight of comparable sales due to higher confidence';
  }
  
  // Strategy 2: If collection has floor price, use it as a baseline
  if (!fallbackApplied && collection.floorPrice > 0) {
    // Use floor price as a baseline and adjust based on rarity
    const rarityPrediction = prediction.individualPredictions.find(
      p => p.modelType === 'rarity-based'
    );
    
    if (rarityPrediction) {
      const rarityAdjustment = rarityPrediction.predictedPrice / collection.floorPrice;
      const adjustedFloorPrice = collection.floorPrice * 
                               Math.min(3, Math.max(0.5, rarityAdjustment));
      
      // Blend with original prediction
      const blendFactor = 0.7; // Weight towards floor price
      fallbackPrediction.predictedPrice = 
        blendFactor * adjustedFloorPrice + (1 - blendFactor) * prediction.predictedPrice;
      
      fallbackApplied = true;
      fallbackDescription = 'Used collection floor price as baseline with rarity adjustment';
    }
  }
  
  // Strategy 3: Use collection average price if nothing else works
  if (!fallbackApplied && collection.sales.length > 0) {
    const recentSales = collection.sales
      .filter(sale => (Date.now() - new Date(sale.timestamp).getTime()) / (1000 * 60 * 60 * 24) <= 30)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (recentSales.length > 0) {
      const avgPrice = recentSales.reduce((sum, sale) => sum + sale.price, 0) / recentSales.length;
      
      // Blend with original prediction
      const blendFactor = 0.6; // Weight towards average price
      fallbackPrediction.predictedPrice = 
        blendFactor * avgPrice + (1 - blendFactor) * prediction.predictedPrice;
      
      fallbackApplied = true;
      fallbackDescription = 'Used collection average price from recent sales';
    }
  }
  
  // Update explanation if fallback was applied
  if (fallbackApplied) {
    fallbackPrediction.explanationFactors = [
      { factor: 'Fallback Strategy', description: fallbackDescription, impact: 'high' },
      ...prediction.explanationFactors.slice(0, 2) // Keep top 2 original factors
    ];
    
    // Adjust confidence interval to be wider
    fallbackPrediction.confidenceInterval = {
      lower: fallbackPrediction.predictedPrice * 0.7,
      upper: fallbackPrediction.predictedPrice * 1.3
    };
    
    // Set confidence score
    fallbackPrediction.confidenceScore = 0.5; // Moderate confidence for fallback
  }
  
  return fallbackPrediction;
}

/**
 * Generates explanation factors for ensemble decisions
 * @param predictions Individual model predictions
 * @param weights Model weights
 * @returns Array of explanation factors
 */
function generateExplanationFactors(
  predictions: ModelPrediction[],
  weights: Record<string, number>
): Array<{ factor: string; description: string; impact: 'low' | 'medium' | 'high' }> {
  const factors: Array<{ factor: string; description: string; impact: 'low' | 'medium' | 'high' }> = [];
  
  // Add factor for each model based on its weight
  predictions.forEach(prediction => {
    const weight = weights[prediction.modelType] || 0;
    let impact: 'low' | 'medium' | 'high' = 'low';
    
    if (weight >= 0.4) impact = 'high';
    else if (weight >= 0.2) impact = 'medium';
    
    let description = '';
    
    switch (prediction.modelType) {
      case 'regression':
        description = `Regression models analyzed ${prediction.comparables?.length || 'multiple'} data points to identify price patterns based on NFT attributes.`;
        break;
      case 'time-series':
        description = 'Time series analysis identified price trends and seasonality patterns in the collection.';
        break;
      case 'comparable-sales':
        description = `Analysis of ${prediction.comparables?.length || 'similar'} comparable NFTs with similar attributes.`;
        break;
      case 'rarity-based':
        description = 'Rarity analysis determined price premium based on trait scarcity within the collection.';
        break;
      default:
        description = `${prediction.modelType} model contributed to the price prediction.`;
    }
    
    factors.push({
      factor: `${prediction.modelType.charAt(0).toUpperCase() + prediction.modelType.slice(1)} Model`,
      description,
      impact
    });
  });
  
  // Sort by impact (high to low)
  return factors.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

/**
 * Main function to get ensemble price prediction for an NFT
 * @param nft The NFT to predict price for
 * @param collection The collection the NFT belongs to
 * @param category Optional NFT category for specialized ensemble
 * @returns Final price prediction with confidence and explanation
 */
export function getPricePrediction(
  nft: NFT,
  collection: Collection,
  category?: NFTCategory
): EnsemblePrediction {
  // Get base or specialized prediction
  const initialPrediction = category
    ? createSpecializedEnsemble(nft, collection, category)
    : stackModelPredictions(nft, collection);
  
  // Apply fallback strategies if needed
  const finalPrediction = applyFallbackStrategies(initialPrediction, nft, collection);
  
  return finalPrediction;
}
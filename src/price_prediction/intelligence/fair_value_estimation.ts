/**
 * Fair Value Estimation Module
 * 
 * Implements current fair value estimation for NFTs based on ensemble model predictions.
 * Provides confidence intervals, value driver identification, and natural language explanations.
 */

import { ModelPrediction, EnsemblePrediction, NFT, Collection } from '../types';
import { FairValueEstimation, ConfidenceLevel, ConfidenceMetrics } from './types';
import { calculateConfidenceMetrics } from './confidence_metrics';

/**
 * Calculates the fair value estimation for an NFT based on ensemble model predictions
 * 
 * @param nft The NFT to estimate fair value for
 * @param collection The collection the NFT belongs to
 * @param prediction The ensemble prediction result
 * @param listedPrice Optional current listed price for comparison
 * @returns A comprehensive fair value estimation with confidence metrics and explanations
 */
export function calculateFairValueEstimation(
  nft: NFT,
  collection: Collection,
  prediction: EnsemblePrediction,
  listedPrice?: number
): FairValueEstimation {
  // Extract the main prediction and confidence interval
  const { predictedPrice, confidenceInterval, modelWeights, individualPredictions, explanationFactors } = prediction;
  
  // Calculate value drivers based on model weights and explanation factors
  const valueDrivers = extractValueDrivers(prediction);
  
  // Determine confidence level based on interval width and data quality
  const confidenceMetrics = calculateConfidenceMetrics(prediction, nft, collection);
  const confidenceLevel = determineConfidenceLevel(confidenceMetrics);
  
  // Generate natural language explanation
  const explanation = generateValueExplanation(nft, prediction, valueDrivers, confidenceLevel);
  
  // Calculate value difference if listed price is available
  const valueDifference = listedPrice ? listedPrice - predictedPrice : undefined;
  
  return {
    tokenId: nft.tokenId,
    collectionId: collection.id,
    estimatedValue: predictedPrice,
    confidenceInterval,
    listedPrice,
    valueDifference,
    valueDrivers,
    confidenceLevel,
    explanation,
    timestamp: Date.now()
  };
}

/**
 * Extracts the main value drivers from the ensemble prediction
 * 
 * @param prediction The ensemble prediction with explanation factors
 * @returns Array of value drivers with impact scores and descriptions
 */
function extractValueDrivers(prediction: EnsemblePrediction): FairValueEstimation['valueDrivers'] {
  const { modelWeights, explanationFactors } = prediction;
  
  // Convert explanation factors to value drivers with quantified impact
  return explanationFactors.map(factor => {
    // Convert qualitative impact to numerical value
    const impactMap = { low: 0.2, medium: 0.5, high: 0.8 };
    const impact = impactMap[factor.impact];
    
    return {
      driver: factor.factor,
      impact,
      description: factor.description
    };
  });
}

/**
 * Determines the confidence level based on confidence metrics
 * 
 * @param metrics The calculated confidence metrics
 * @returns The appropriate confidence level (HIGH, MEDIUM, LOW)
 */
function determineConfidenceLevel(metrics: ConfidenceMetrics): ConfidenceLevel {
  const { modelUncertainty, predictionInterval } = metrics;
  
  // Calculate interval width as percentage of predicted value
  const intervalWidth = (predictionInterval.upper - predictionInterval.lower) / 
                        ((predictionInterval.upper + predictionInterval.lower) / 2);
  
  if (modelUncertainty < 0.2 && intervalWidth < 0.3) {
    return ConfidenceLevel.HIGH;
  } else if (modelUncertainty < 0.4 && intervalWidth < 0.5) {
    return ConfidenceLevel.MEDIUM;
  } else {
    return ConfidenceLevel.LOW;
  }
}

/**
 * Generates a natural language explanation for the fair value estimation
 * 
 * @param nft The NFT being valued
 * @param prediction The ensemble prediction
 * @param valueDrivers The extracted value drivers
 * @param confidenceLevel The determined confidence level
 * @returns A human-readable explanation of the valuation
 */
function generateValueExplanation(
  nft: NFT,
  prediction: EnsemblePrediction,
  valueDrivers: FairValueEstimation['valueDrivers'],
  confidenceLevel: ConfidenceLevel
): string {
  // Get the top 3 value drivers by impact
  const topDrivers = [...valueDrivers].sort((a, b) => b.impact - a.impact).slice(0, 3);
  
  // Create explanation based on drivers and confidence
  let explanation = `The estimated fair value of ${prediction.predictedPrice.toFixed(2)} ETH `;
  explanation += `is based primarily on ${topDrivers.map(d => d.driver).join(', ')}. `;
  
  // Add confidence level context
  if (confidenceLevel === ConfidenceLevel.HIGH) {
    explanation += 'This estimate has high confidence due to consistent model predictions and sufficient comparable data.';
  } else if (confidenceLevel === ConfidenceLevel.MEDIUM) {
    explanation += 'This estimate has medium confidence, with some variability between model predictions.';
  } else {
    explanation += 'This estimate has low confidence due to limited comparable data or high model uncertainty.';
  }
  
  return explanation;
}

/**
 * Calculates confidence metrics for the fair value estimation
 * 
 * @param prediction The ensemble prediction
 * @param nft The NFT being valued
 * @param collection The collection the NFT belongs to
 * @returns Detailed confidence metrics
 */
export function calculateConfidenceMetrics(
  prediction: EnsemblePrediction,
  nft: NFT,
  collection: Collection
): ConfidenceMetrics {
  const { confidenceInterval, confidenceScore, individualPredictions } = prediction;
  
  // Calculate model uncertainty based on variance between individual predictions
  const predictedValues = individualPredictions.map(p => p.predictedPrice);
  const meanPrediction = predictedValues.reduce((sum, val) => sum + val, 0) / predictedValues.length;
  const variance = predictedValues.reduce((sum, val) => sum + Math.pow(val - meanPrediction, 2), 0) / predictedValues.length;
  const modelUncertainty = Math.sqrt(variance) / meanPrediction; // Coefficient of variation
  
  // Determine confidence level based on uncertainty and confidence score
  let confidenceLevel: ConfidenceLevel;
  if (confidenceScore > 0.8 && modelUncertainty < 0.2) {
    confidenceLevel = ConfidenceLevel.HIGH;
  } else if (confidenceScore > 0.6 && modelUncertainty < 0.4) {
    confidenceLevel = ConfidenceLevel.MEDIUM;
  } else {
    confidenceLevel = ConfidenceLevel.LOW;
  }
  
  // Generate confidence factors
  const confidenceFactors = [
    {
      factor: 'Model Agreement',
      impact: 1 - modelUncertainty,
      description: `The prediction models ${modelUncertainty < 0.2 ? 'strongly agree' : modelUncertainty < 0.4 ? 'somewhat agree' : 'show significant disagreement'} on the valuation.`
    },
    {
      factor: 'Data Availability',
      impact: Math.min(collection.sales.length / 100, 1),
      description: `${collection.sales.length} historical sales provide ${collection.sales.length > 50 ? 'strong' : collection.sales.length > 20 ? 'moderate' : 'limited'} data for prediction.`
    },
    {
      factor: 'Attribute Coverage',
      impact: nft.traits.length > 0 ? 0.8 : 0.3,
      description: `The NFT has ${nft.traits.length} defined attributes, providing ${nft.traits.length > 0 ? 'good' : 'limited'} trait data for comparison.`
    }
  ];
  
  // Generate improvement suggestions
  const improvementSuggestions = [];
  if (modelUncertainty > 0.3) {
    improvementSuggestions.push('Wait for more market data to improve prediction consistency.');
  }
  if (collection.sales.length < 20) {
    improvementSuggestions.push('Consider using broader market comparables to supplement limited collection data.');
  }
  
  return {
    modelUncertainty,
    predictionInterval: {
      lower: confidenceInterval.lower,
      upper: confidenceInterval.upper,
      confidencePercentage: 0.95 // Assuming 95% confidence intervals
    },
    confidenceLevel,
    confidenceFactors,
    improvementSuggestions,
    timestamp: Date.now()
  };
}
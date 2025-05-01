/**
 * Confidence Metrics Module
 * 
 * Implements model uncertainty quantification, prediction interval calculation,
 * confidence level indicators, and explanation generation for confidence metrics.
 */

import { NFT, Collection, EnsemblePrediction } from '../types';
import { ConfidenceMetrics, ConfidenceLevel } from './types';

/**
 * Calculates confidence metrics for price predictions
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
  if (nft.traits.length === 0) {
    improvementSuggestions.push('Add more attribute metadata to improve trait-based comparisons.');
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

/**
 * Generates a natural language explanation for confidence metrics
 * 
 * @param metrics The calculated confidence metrics
 * @returns Human-readable explanation of confidence level and factors
 */
export function generateConfidenceExplanation(metrics: ConfidenceMetrics): string {
  const { confidenceLevel, confidenceFactors, modelUncertainty, improvementSuggestions } = metrics;
  
  // Get the top confidence factors (up to 2)
  const sortedFactors = [...confidenceFactors].sort((a, b) => b.impact - a.impact);
  const topFactors = sortedFactors.slice(0, 2);
  
  // Calculate interval width as percentage of predicted value
  const intervalWidth = ((predictionInterval.upper - predictionInterval.lower) / 
                        ((predictionInterval.upper + predictionInterval.lower) / 2)) * 100;
  
  let explanation = `This prediction has ${confidenceLevel.toLowerCase()} confidence with a ${predictionInterval.confidencePercentage * 100}% prediction interval of ±${intervalWidth.toFixed(1)}%. `;
  
  // Add context based on confidence level
  switch (confidenceLevel) {
    case ConfidenceLevel.HIGH:
      explanation += 'The models show strong agreement and are based on sufficient historical data. ';
      break;
    case ConfidenceLevel.MEDIUM:
      explanation += 'There is moderate agreement between prediction models with adequate supporting data. ';
      break;
    case ConfidenceLevel.LOW:
      explanation += 'There is significant uncertainty in this prediction due to limited data or model disagreement. ';
      break;
  }
  
  // Add top factors information
  if (topFactors.length > 0) {
    explanation += `The most significant factor affecting confidence is "${topFactors[0].factor}": ${topFactors[0].description} `;
    if (topFactors.length > 1) {
      explanation += `Another important factor is "${topFactors[1].factor}": ${topFactors[1].description} `;
    }
  }
  
  // Add improvement suggestion if confidence is not high
  if (confidenceLevel !== ConfidenceLevel.HIGH && improvementSuggestions.length > 0) {
    explanation += `To improve prediction confidence, ${improvementSuggestions[0].toLowerCase()}`;
    if (improvementSuggestions.length > 1) {
      explanation += ` Additionally, ${improvementSuggestions[1].toLowerCase()}`;
    }
  }
  
  return explanation;
}

/**
 * Calculates risk-adjusted valuation based on confidence metrics
 * 
 * @param predictedPrice The predicted price
 * @param metrics The confidence metrics
 * @returns Risk-adjusted valuation
 */
export function calculateRiskAdjustedValuation(
  predictedPrice: number,
  metrics: ConfidenceMetrics
): number {
  const { modelUncertainty, confidenceLevel } = metrics;
  
  // Apply risk discount based on uncertainty and confidence level
  let riskDiscount = 0;
  
  switch (confidenceLevel) {
    case ConfidenceLevel.HIGH:
      riskDiscount = 0.05; // 5% discount for high confidence
      break;
    case ConfidenceLevel.MEDIUM:
      riskDiscount = 0.15; // 15% discount for medium confidence
      break;
    case ConfidenceLevel.LOW:
      riskDiscount = 0.30; // 30% discount for low confidence
      break;
  }
  
  // Adjust discount based on model uncertainty
  riskDiscount += modelUncertainty * 0.5;
  
  // Cap discount at 50%
  riskDiscount = Math.min(0.5, riskDiscount);
  
  return predictedPrice * (1 - riskDiscount);
}
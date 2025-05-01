/**
 * Test file for Price Volatility Metrics and Confidence Metrics
 * 
 * This file contains test functions to verify the functionality of the
 * price volatility metrics and confidence metrics modules.
 */

import {
  calculatePriceVolatilityMetrics,
  calculateHistoricalVolatility,
  predictFutureVolatility,
  calculateRelativeVolatility,
  calculateRiskAdjustedValuation,
  generatePriceMovementBands
} from './price_volatility_metrics';

import {
  calculateConfidenceMetrics,
  generateConfidenceExplanation
} from './confidence_metrics';

import { TimeHorizon, ConfidenceLevel } from './types';

/**
 * Test data for NFT, Collection, and Predictions
 */
const mockNFT = {
  tokenId: 'token123',
  name: 'Test NFT',
  description: 'A test NFT for volatility metrics',
  imageUrl: 'https://example.com/image.png',
  traits: [
    { trait_type: 'Background', value: 'Blue' },
    { trait_type: 'Eyes', value: 'Green' }
  ],
  creator: 'Creator123'
};

const mockCollection = {
  id: 'collection123',
  name: 'Test Collection',
  description: 'A test collection',
  sales: [
    { timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000), price: 1.0 },
    { timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), price: 1.1 },
    { timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000), price: 0.9 },
    { timestamp: Date.now() - (4 * 24 * 60 * 60 * 1000), price: 1.2 },
    { timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000), price: 1.0 },
    { timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000), price: 0.8 },
    { timestamp: Date.now() - (15 * 24 * 60 * 60 * 1000), price: 0.7 },
    { timestamp: Date.now() - (20 * 24 * 60 * 60 * 1000), price: 0.9 },
    { timestamp: Date.now() - (25 * 24 * 60 * 60 * 1000), price: 1.1 },
    { timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), price: 1.0 }
  ],
  volatility: 0.3,
  trendingScore: 0.7
};

const mockEnsemblePrediction = {
  predictedPrice: 1.2,
  confidenceInterval: { lower: 1.0, upper: 1.4 },
  confidenceScore: 0.75,
  individualPredictions: [
    { modelName: 'Model1', predictedPrice: 1.15, confidence: 0.8 },
    { modelName: 'Model2', predictedPrice: 1.25, confidence: 0.7 },
    { modelName: 'Model3', predictedPrice: 1.3, confidence: 0.6 },
    { modelName: 'Model4', predictedPrice: 1.1, confidence: 0.9 }
  ],
  modelWeights: {
    'Model1': 0.3,
    'Model2': 0.25,
    'Model3': 0.2,
    'Model4': 0.25
  },
  explanationFactors: [
    { factor: 'Rarity', impact: 0.4 },
    { factor: 'Recent Sales', impact: 0.3 },
    { factor: 'Collection Trend', impact: 0.2 },
    { factor: 'Market Conditions', impact: 0.1 }
  ]
};

/**
 * Test function for Price Volatility Metrics
 */
function testPriceVolatilityMetrics() {
  console.log('\n=== Testing Price Volatility Metrics ===');
  
  // Test historical volatility calculation
  const historicalVolatility = calculateHistoricalVolatility(mockCollection.sales, 30);
  console.log(`Historical Volatility: ${historicalVolatility.toFixed(4)}`);
  
  // Test future volatility prediction
  const predictedVolatility = predictFutureVolatility(historicalVolatility, mockNFT, mockCollection);
  console.log('Predicted Volatility:');
  predictedVolatility.forEach(v => {
    console.log(`  ${v.timeHorizon}: ${v.value.toFixed(4)}`);
  });
  
  // Test relative volatility calculation
  const marketVolatility = 0.5; // Mock market volatility
  const relativeVolatility = calculateRelativeVolatility(historicalVolatility, mockCollection, marketVolatility);
  console.log('Relative Volatility:');
  console.log(`  To Collection: ${relativeVolatility.toCollection.toFixed(4)}`);
  console.log(`  To Market: ${relativeVolatility.toMarket.toFixed(4)}`);
  
  // Test risk-adjusted valuation
  const riskAdjustedValue = calculateRiskAdjustedValuation(mockEnsemblePrediction.predictedPrice, historicalVolatility);
  console.log(`Risk-Adjusted Valuation: ${riskAdjustedValue.toFixed(4)}`);
  
  // Test price movement bands generation
  const priceMovementBands = generatePriceMovementBands(mockEnsemblePrediction.predictedPrice, predictedVolatility);
  console.log('Price Movement Bands:');
  priceMovementBands.forEach(band => {
    console.log(`  ${band.timeHorizon}: ${band.lowerBand.toFixed(4)} - ${band.upperBand.toFixed(4)} (${band.probability * 100}% confidence)`);
  });
  
  // Test complete price volatility metrics
  const volatilityMetrics = calculatePriceVolatilityMetrics(mockNFT, mockCollection, mockEnsemblePrediction, marketVolatility);
  console.log('\nComplete Price Volatility Metrics:');
  console.log(JSON.stringify(volatilityMetrics, null, 2));
}

/**
 * Test function for Confidence Metrics
 */
function testConfidenceMetrics() {
  console.log('\n=== Testing Confidence Metrics ===');
  
  // Test confidence metrics calculation
  const confidenceMetrics = calculateConfidenceMetrics(mockEnsemblePrediction, mockNFT, mockCollection);
  console.log('Confidence Metrics:');
  console.log(`  Model Uncertainty: ${confidenceMetrics.modelUncertainty.toFixed(4)}`);
  console.log(`  Prediction Interval: ${confidenceMetrics.predictionInterval.lower.toFixed(4)} - ${confidenceMetrics.predictionInterval.upper.toFixed(4)} (${confidenceMetrics.predictionInterval.confidencePercentage * 100}% confidence)`);
  console.log(`  Confidence Level: ${confidenceMetrics.confidenceLevel}`);
  
  console.log('\nConfidence Factors:');
  confidenceMetrics.confidenceFactors.forEach(factor => {
    console.log(`  ${factor.factor}: ${factor.impact.toFixed(4)} - ${factor.description}`);
  });
  
  console.log('\nImprovement Suggestions:');
  confidenceMetrics.improvementSuggestions.forEach(suggestion => {
    console.log(`  - ${suggestion}`);
  });
  
  // Test confidence explanation generation
  const explanation = generateConfidenceExplanation(confidenceMetrics);
  console.log('\nConfidence Explanation:');
  console.log(explanation);
}

/**
 * Run all tests
 */
export function runVolatilityConfidenceTests() {
  console.log('Running Price Volatility and Confidence Metrics Tests...');
  testPriceVolatilityMetrics();
  testConfidenceMetrics();
  console.log('\nTests completed!');
}

// Uncomment to run tests directly
// runVolatilityConfidenceTests();
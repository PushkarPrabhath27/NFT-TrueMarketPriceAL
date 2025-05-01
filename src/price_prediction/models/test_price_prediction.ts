/**
 * Test file for NFT Price Prediction Engine
 * 
 * This file demonstrates how to use the rarity-based models and ensemble integration
 * components for NFT price prediction.
 */

import {
  NFT,
  Collection,
  NFTCategory,
  EnsemblePrediction
} from '../types';

import {
  calculateRarityPriceCorrelation,
  calculateCollectionRarityPremium,
  assessTimeVaryingRarityImpact,
  forecastRarityTrend,
  selectRarityBasedComparables,
  predictPriceWithRarityModel
} from './rarity_based_models';

import {
  stackModelPredictions,
  createSpecializedEnsemble,
  applyFallbackStrategies,
  updateModelPerformance,
  getPricePrediction
} from './ensemble_integration';

/**
 * Sample test data
 */
const sampleNFT: NFT = {
  id: 'nft123',
  collectionId: 'collection456',
  tokenId: '123',
  traits: [
    { type: 'background', value: 'blue' },
    { type: 'eyes', value: 'laser' },
    { type: 'mouth', value: 'smile' },
    { type: 'hat', value: 'crown' }
  ],
  rarityScore: 85.7,
  rarityRank: 42
};

const sampleCollection: Collection = {
  id: 'collection456',
  name: 'Sample Collection',
  nfts: [
    sampleNFT,
    // Additional NFTs would be here in a real scenario
    {
      id: 'nft124',
      collectionId: 'collection456',
      tokenId: '124',
      traits: [
        { type: 'background', value: 'red' },
        { type: 'eyes', value: 'normal' },
        { type: 'mouth', value: 'smile' },
        { type: 'hat', value: 'none' }
      ],
      rarityScore: 65.3,
      rarityRank: 120
    },
    {
      id: 'nft125',
      collectionId: 'collection456',
      tokenId: '125',
      traits: [
        { type: 'background', value: 'green' },
        { type: 'eyes', value: 'laser' },
        { type: 'mouth', value: 'frown' },
        { type: 'hat', value: 'beanie' }
      ],
      rarityScore: 78.2,
      rarityRank: 67
    }
  ],
  sales: [
    {
      nft: sampleNFT,
      price: 2.5,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      buyer: '0xbuyer1',
      seller: '0xseller1'
    },
    {
      nft: {
        id: 'nft124',
        collectionId: 'collection456',
        tokenId: '124',
        traits: [
          { type: 'background', value: 'red' },
          { type: 'eyes', value: 'normal' },
          { type: 'mouth', value: 'smile' },
          { type: 'hat', value: 'none' }
        ],
        rarityScore: 65.3,
        rarityRank: 120
      },
      price: 1.8,
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      buyer: '0xbuyer2',
      seller: '0xseller2'
    }
  ],
  floorPrice: 1.5,
  totalVolume: 500,
  category: 'collectible'
};

/**
 * Test function for rarity-based models
 */
function testRarityBasedModels() {
  console.log('\n--- Testing Rarity-Based Models ---');
  
  // Test rarity-price correlation
  const correlation = calculateRarityPriceCorrelation(sampleCollection);
  console.log('Rarity-Price Correlation:', correlation);
  
  // Test collection rarity premium
  const premium = calculateCollectionRarityPremium(sampleCollection);
  console.log('Collection Rarity Premium:', premium);
  
  // Test time-varying rarity impact
  const timeImpact = assessTimeVaryingRarityImpact(sampleCollection);
  console.log('Time-Varying Rarity Impact:', timeImpact);
  
  // Test rarity trend forecasting
  const forecast = forecastRarityTrend(sampleCollection, 7);
  console.log('Rarity Trend Forecast (7 days):', forecast);
  
  // Test rarity-based comparable selection
  const comparables = selectRarityBasedComparables(sampleNFT, sampleCollection);
  console.log('Rarity-Based Comparables:', comparables);
  
  // Test price prediction with rarity model
  const prediction = predictPriceWithRarityModel(sampleNFT, sampleCollection);
  console.log('Rarity Model Price Prediction:', prediction);
}

/**
 * Test function for ensemble integration
 */
function testEnsembleIntegration() {
  console.log('\n--- Testing Ensemble Integration ---');
  
  // Mock the other model predictions for testing purposes
  // In a real scenario, these would come from the actual model implementations
  const mockPredictions = {
    regression: {
      predictedPrice: 2.3,
      confidenceInterval: { lower: 2.0, upper: 2.6 },
      confidenceScore: 0.75,
      modelType: 'regression'
    },
    timeSeries: {
      predictedPrice: 2.7,
      confidenceInterval: { lower: 2.2, upper: 3.2 },
      confidenceScore: 0.65,
      modelType: 'time-series'
    },
    comparableSales: {
      predictedPrice: 2.4,
      confidenceInterval: { lower: 2.1, upper: 2.7 },
      confidenceScore: 0.8,
      modelType: 'comparable-sales',
      comparables: ['nft124', 'nft125']
    }
  };
  
  // Override the imported functions to use our mock data
  // This is just for testing - in a real scenario, we would use the actual implementations
  const originalStackModelPredictions = global.stackModelPredictions;
  global.stackModelPredictions = (nft, collection) => {
    const rarityPrediction = predictPriceWithRarityModel(nft, collection);
    
    return {
      predictedPrice: 2.5,
      confidenceInterval: { lower: 2.0, upper: 3.0 },
      confidenceScore: 0.75,
      modelWeights: {
        'regression': 0.25,
        'time-series': 0.2,
        'comparable-sales': 0.3,
        'rarity-based': 0.25
      },
      individualPredictions: [
        mockPredictions.regression,
        mockPredictions.timeSeries,
        mockPredictions.comparableSales,
        rarityPrediction
      ],
      explanationFactors: [
        { factor: 'Comparable Sales Model', description: 'Analysis of similar NFTs with similar attributes.', impact: 'high' },
        { factor: 'Regression Model', description: 'Regression models analyzed multiple data points to identify price patterns.', impact: 'medium' },
        { factor: 'Rarity-based Model', description: 'Rarity analysis determined price premium based on trait scarcity.', impact: 'medium' },
        { factor: 'Time Series Model', description: 'Time series analysis identified price trends and seasonality patterns.', impact: 'low' }
      ],
      modelType: 'ensemble'
    };
  };
  
  // Test stacking model predictions
  const stackedPrediction = stackModelPredictions(sampleNFT, sampleCollection);
  console.log('Stacked Model Prediction:', stackedPrediction);
  
  // Test specialized ensemble for NFT category
  const specializedPrediction = createSpecializedEnsemble(sampleNFT, sampleCollection, 'collectible');
  console.log('Specialized Ensemble Prediction (Collectible):', specializedPrediction);
  
  // Test fallback strategies
  const lowConfidencePrediction = {
    ...stackedPrediction,
    confidenceScore: 0.4 // Set a low confidence score to trigger fallback
  };
  const fallbackPrediction = applyFallbackStrategies(lowConfidencePrediction, sampleNFT, sampleCollection);
  console.log('Fallback Strategy Applied Prediction:', fallbackPrediction);
  
  // Test updating model performance
  updateModelPerformance('rarity-based', 2.5, 2.7, sampleCollection.id);
  console.log('Updated Model Performance for Rarity-Based Model');
  
  // Test main price prediction function
  const finalPrediction = getPricePrediction(sampleNFT, sampleCollection, 'collectible');
  console.log('Final Price Prediction:', finalPrediction);
  
  // Restore original function
  global.stackModelPredictions = originalStackModelPredictions;
}

/**
 * Main test function
 */
function runTests() {
  console.log('=== NFT Price Prediction Engine Tests ===');
  
  // Test rarity-based models
  testRarityBasedModels();
  
  // Test ensemble integration
  testEnsembleIntegration();
  
  console.log('\n=== Tests Completed ===');
}

// Run the tests
runTests();
/**
 * Test file for Price Intelligence Features
 * 
 * This file demonstrates how to use the price intelligence features
 * to generate actionable insights from model predictions.
 */

import { NFT, Collection, EnsemblePrediction } from '../types';
import { 
  calculateFairValueEstimation,
  generatePriceTrendPrediction,
  assessValuation,
  calculateConfidenceMetrics,
  generateConfidenceExplanation,
  calculateRiskAdjustedValuation
} from '../intelligence';

/**
 * Example function demonstrating the complete price intelligence workflow
 */
export function demonstratePriceIntelligence() {
  // Sample data - in a real implementation, this would come from the database
  const sampleNFT: NFT = {
    id: 'nft123',
    collectionId: 'collection456',
    tokenId: '42',
    traits: [
      { type: 'Background', value: 'Blue' },
      { type: 'Eyes', value: 'Laser' },
      { type: 'Mouth', value: 'Grin' }
    ],
    rarityScore: 85.7,
    rarityRank: 42,
    lastSalePrice: 2.5,
    lastSaleTimestamp: '2023-01-15T12:00:00Z'
  };
  
  const sampleCollection: Collection = {
    id: 'collection456',
    name: 'Sample Collection',
    nfts: [sampleNFT], // In reality, this would contain many NFTs
    sales: [
      {
        nft: sampleNFT,
        price: 2.5,
        timestamp: '2023-01-15T12:00:00Z',
        buyer: '0x123',
        seller: '0x456'
      },
      // Additional sales would be here
    ],
    floorPrice: 1.8,
    totalVolume: 1250
  };
  
  // Sample ensemble prediction - in a real implementation, this would come from the model ensemble
  const samplePrediction: EnsemblePrediction = {
    predictedPrice: 3.2,
    confidenceInterval: {
      lower: 2.8,
      upper: 3.6
    },
    confidenceScore: 0.75,
    modelType: 'ensemble',
    modelWeights: {
      'regression': 0.3,
      'timeSeries': 0.2,
      'comparableSales': 0.4,
      'rarityBased': 0.1
    },
    individualPredictions: [
      {
        predictedPrice: 3.1,
        confidenceInterval: { lower: 2.7, upper: 3.5 },
        confidenceScore: 0.7,
        modelType: 'regression'
      },
      {
        predictedPrice: 3.4,
        confidenceInterval: { lower: 2.9, upper: 3.9 },
        confidenceScore: 0.65,
        modelType: 'timeSeries'
      },
      {
        predictedPrice: 3.2,
        confidenceInterval: { lower: 2.8, upper: 3.6 },
        confidenceScore: 0.8,
        modelType: 'comparableSales',
        comparables: ['nft789', 'nft101']
      },
      {
        predictedPrice: 3.0,
        confidenceInterval: { lower: 2.6, upper: 3.4 },
        confidenceScore: 0.75,
        modelType: 'rarityBased'
      }
    ],
    explanationFactors: [
      {
        factor: 'Rarity Rank',
        description: 'This NFT ranks in the top 10% of the collection by rarity',
        impact: 'high'
      },
      {
        factor: 'Recent Sales Trend',
        description: 'Collection has seen 15% price increase in the last 30 days',
        impact: 'medium'
      },
      {
        factor: 'Trait Combination',
        description: 'The Laser Eyes trait adds significant value',
        impact: 'high'
      }
    ]
  };
  
  // Current listed price - in a real implementation, this would come from marketplace data
  const currentListedPrice = 2.8;
  
  // 1. Calculate fair value estimation
  console.log('\n--- FAIR VALUE ESTIMATION ---');
  const fairValueEstimation = calculateFairValueEstimation(
    sampleNFT,
    sampleCollection,
    samplePrediction,
    currentListedPrice
  );
  console.log(JSON.stringify(fairValueEstimation, null, 2));
  
  // 2. Generate price trend prediction
  console.log('\n--- PRICE TREND PREDICTION ---');
  const priceTrendPrediction = generatePriceTrendPrediction(
    sampleNFT,
    sampleCollection,
    samplePrediction
  );
  // Simplify visualization data for console output
  const simplifiedTrendPrediction = {
    ...priceTrendPrediction,
    visualizationData: {
      ...priceTrendPrediction.visualizationData,
      timestamps: `[${priceTrendPrediction.visualizationData.timestamps.length} timestamps]`,
      predictedValues: `[${priceTrendPrediction.visualizationData.predictedValues.length} values]`,
      upperBound: `[${priceTrendPrediction.visualizationData.upperBound.length} values]`,
      lowerBound: `[${priceTrendPrediction.visualizationData.lowerBound.length} values]`
    }
  };
  console.log(JSON.stringify(simplifiedTrendPrediction, null, 2));
  
  // 3. Assess valuation (undervalued/overvalued)
  console.log('\n--- VALUATION ASSESSMENT ---');
  const valuationAssessment = assessValuation(
    sampleNFT,
    sampleCollection,
    samplePrediction,
    currentListedPrice
  );
  console.log(JSON.stringify(valuationAssessment, null, 2));
  
  // 4. Calculate confidence metrics
  console.log('\n--- CONFIDENCE METRICS ---');
  const confidenceMetrics = calculateConfidenceMetrics(
    samplePrediction,
    sampleNFT,
    sampleCollection
  );
  console.log(JSON.stringify(confidenceMetrics, null, 2));
  
  // 5. Generate confidence explanation
  console.log('\n--- CONFIDENCE EXPLANATION ---');
  const confidenceExplanation = generateConfidenceExplanation(confidenceMetrics);
  console.log(confidenceExplanation);
  
  // 6. Calculate risk-adjusted valuation
  console.log('\n--- RISK-ADJUSTED VALUATION ---');
  const riskAdjustedValue = calculateRiskAdjustedValuation(
    samplePrediction.predictedPrice,
    confidenceMetrics
  );
  console.log(`Predicted price: ${samplePrediction.predictedPrice} ETH`);
  console.log(`Risk-adjusted value: ${riskAdjustedValue.toFixed(2)} ETH`);
  
  return {
    fairValueEstimation,
    priceTrendPrediction,
    valuationAssessment,
    confidenceMetrics,
    confidenceExplanation,
    riskAdjustedValue
  };
}

// Uncomment to run the demonstration
// demonstratePriceIntelligence();
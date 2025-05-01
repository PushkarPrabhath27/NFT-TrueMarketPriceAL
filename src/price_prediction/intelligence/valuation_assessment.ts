/**
 * Valuation Assessment Module
 * 
 * Implements undervalued/overvalued assessment for NFTs, including percentage difference
 * from fair value, classification thresholds, comparative analysis, opportunity scoring,
 * and explanation generation for valuation gaps.
 */

import { NFT, Collection, EnsemblePrediction } from '../types';
import { ValuationAssessment, ValuationStatus, ConfidenceLevel } from './types';
import { calculateFairValueEstimation } from './fair_value_estimation';

/**
 * Assesses whether an NFT is undervalued, overvalued, or fairly valued
 * 
 * @param nft The NFT to assess
 * @param collection The collection the NFT belongs to
 * @param prediction The ensemble prediction result
 * @param currentPrice The current price (listed or last sale)
 * @returns A comprehensive valuation assessment with opportunity scoring
 */
export function assessValuation(
  nft: NFT,
  collection: Collection,
  prediction: EnsemblePrediction,
  currentPrice: number
): ValuationAssessment {
  // Calculate fair value using the fair value estimation module
  const fairValueEstimation = calculateFairValueEstimation(nft, collection, prediction, currentPrice);
  const fairValue = fairValueEstimation.estimatedValue;
  
  // Calculate percentage difference from fair value
  const percentageDifference = ((currentPrice - fairValue) / fairValue) * 100;
  
  // Determine valuation status based on thresholds
  const valuationStatus = determineValuationStatus(percentageDifference);
  
  // Generate comparison metrics within the collection
  const comparisonMetrics = generateComparisonMetrics(nft, collection, fairValue, currentPrice);
  
  // Calculate opportunity score
  const opportunityScore = calculateOpportunityScore(
    percentageDifference,
    fairValueEstimation.confidenceLevel,
    nft.rarityScore,
    collection
  );
  
  // Generate explanation for valuation gap
  const valuationGapExplanation = generateValuationGapExplanation(
    valuationStatus,
    percentageDifference,
    fairValueEstimation.valueDrivers,
    comparisonMetrics
  );
  
  return {
    tokenId: nft.tokenId,
    collectionId: collection.id,
    fairValue,
    currentPrice,
    percentageDifference,
    valuationStatus,
    comparisonMetrics,
    opportunityScore,
    valuationGapExplanation,
    confidenceLevel: fairValueEstimation.confidenceLevel,
    timestamp: Date.now()
  };
}

/**
 * Determines valuation status based on percentage difference from fair value
 * 
 * @param percentageDifference The percentage difference between current price and fair value
 * @returns The appropriate valuation status
 */
function determineValuationStatus(percentageDifference: number): ValuationStatus {
  // Define thresholds for undervalued/overvalued classification
  const UNDERVALUED_THRESHOLD = -15; // 15% below fair value
  const OVERVALUED_THRESHOLD = 15;   // 15% above fair value
  
  if (percentageDifference < UNDERVALUED_THRESHOLD) {
    return ValuationStatus.UNDERVALUED;
  } else if (percentageDifference > OVERVALUED_THRESHOLD) {
    return ValuationStatus.OVERVALUED;
  } else {
    return ValuationStatus.FAIR_VALUED;
  }
}

/**
 * Generates comparison metrics within the collection
 * 
 * @param nft The NFT being assessed
 * @param collection The collection the NFT belongs to
 * @param fairValue The calculated fair value
 * @param currentPrice The current price
 * @returns Array of comparison metrics with collection averages
 */
function generateComparisonMetrics(
  nft: NFT,
  collection: Collection,
  fairValue: number,
  currentPrice: number
): ValuationAssessment['comparisonMetrics'] {
  // Calculate collection averages for key metrics
  const avgPrice = collection.sales.length > 0
    ? collection.sales.reduce((sum, sale) => sum + sale.price, 0) / collection.sales.length
    : 0;
  
  // Calculate average rarity score
  const avgRarityScore = collection.nfts.length > 0
    ? collection.nfts.reduce((sum, nft) => sum + nft.rarityScore, 0) / collection.nfts.length
    : 0;
  
  // Generate comparison metrics
  return [
    {
      metric: 'Price to Floor Ratio',
      value: collection.floorPrice > 0 ? currentPrice / collection.floorPrice : 1,
      collectionAverage: collection.floorPrice > 0 ? avgPrice / collection.floorPrice : 1,
      percentDifference: collection.floorPrice > 0
        ? (((currentPrice / collection.floorPrice) / (avgPrice / collection.floorPrice)) - 1) * 100
        : 0
    },
    {
      metric: 'Rarity Premium',
      value: nft.rarityScore > 0 ? currentPrice / nft.rarityScore : 0,
      collectionAverage: avgRarityScore > 0 ? avgPrice / avgRarityScore : 0,
      percentDifference: nft.rarityScore > 0 && avgRarityScore > 0
        ? (((currentPrice / nft.rarityScore) / (avgPrice / avgRarityScore)) - 1) * 100
        : 0
    },
    {
      metric: 'Price to Fair Value Ratio',
      value: fairValue > 0 ? currentPrice / fairValue : 1,
      collectionAverage: 1, // By definition, fair value ratio average should be 1
      percentDifference: fairValue > 0 ? ((currentPrice / fairValue) - 1) * 100 : 0
    }
  ];
}

/**
 * Calculates opportunity score based on valuation gap and other factors
 * 
 * @param percentageDifference The percentage difference from fair value
 * @param confidenceLevel The confidence level of the fair value estimation
 * @param rarityScore The rarity score of the NFT
 * @param collection The collection the NFT belongs to
 * @returns Opportunity score on a 0-100 scale
 */
function calculateOpportunityScore(
  percentageDifference: number,
  confidenceLevel: ConfidenceLevel,
  rarityScore: number,
  collection: Collection
): number {
  // Base score from percentage difference (inverted - more undervalued = higher score)
  let score = 50 - percentageDifference;
  
  // Adjust based on confidence level
  const confidenceMultiplier = {
    [ConfidenceLevel.HIGH]: 1,
    [ConfidenceLevel.MEDIUM]: 0.8,
    [ConfidenceLevel.LOW]: 0.6
  };
  score *= confidenceMultiplier[confidenceLevel];
  
  // Adjust based on rarity (higher rarity = better opportunity)
  const avgRarityScore = collection.nfts.length > 0
    ? collection.nfts.reduce((sum, nft) => sum + nft.rarityScore, 0) / collection.nfts.length
    : 0;
  
  if (avgRarityScore > 0 && rarityScore > avgRarityScore) {
    score *= (1 + (rarityScore / avgRarityScore - 1) * 0.2);
  }
  
  // Adjust based on collection liquidity (more sales = better opportunity)
  const liquidityFactor = Math.min(1, collection.sales.length / 50) * 0.2 + 0.8;
  score *= liquidityFactor;
  
  // Clamp score to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Generates explanation for valuation gap
 * 
 * @param valuationStatus The determined valuation status
 * @param percentageDifference The percentage difference from fair value
 * @param valueDrivers The value drivers from fair value estimation
 * @param comparisonMetrics The generated comparison metrics
 * @returns Human-readable explanation of the valuation gap
 */
function generateValuationGapExplanation(
  valuationStatus: ValuationStatus,
  percentageDifference: number,
  valueDrivers: any[],
  comparisonMetrics: ValuationAssessment['comparisonMetrics']
): string {
  // Get the top value driver
  const topDriver = valueDrivers.length > 0
    ? valueDrivers.sort((a, b) => b.impact - a.impact)[0]
    : null;
  
  // Get the most significant comparison metric
  const significantMetric = comparisonMetrics.length > 0
    ? comparisonMetrics.sort((a, b) => Math.abs(b.percentDifference) - Math.abs(a.percentDifference))[0]
    : null;
  
  let explanation = '';
  
  // Generate explanation based on valuation status
  switch (valuationStatus) {
    case ValuationStatus.UNDERVALUED:
      explanation = `This NFT appears to be undervalued by ${Math.abs(percentageDifference).toFixed(1)}%. `;
      if (topDriver) {
        explanation += `The primary value driver "${topDriver.driver}" suggests higher value than the current price reflects. `;
      }
      if (significantMetric && significantMetric.percentDifference < 0) {
        explanation += `The ${significantMetric.metric} is ${Math.abs(significantMetric.percentDifference).toFixed(1)}% below the collection average, indicating potential for price appreciation.`;
      }
      break;
      
    case ValuationStatus.OVERVALUED:
      explanation = `This NFT appears to be overvalued by ${percentageDifference.toFixed(1)}%. `;
      if (topDriver) {
        explanation += `Despite the value driver "${topDriver.driver}", the current price exceeds our fair value estimate. `;
      }
      if (significantMetric && significantMetric.percentDifference > 0) {
        explanation += `The ${significantMetric.metric} is ${significantMetric.percentDifference.toFixed(1)}% above the collection average, suggesting the price may be inflated.`;
      }
      break;
      
    case ValuationStatus.FAIR_VALUED:
      explanation = `This NFT appears to be fairly valued, with the current price within ${Math.abs(percentageDifference).toFixed(1)}% of our estimated fair value. `;
      if (topDriver) {
        explanation += `The value driver "${topDriver.driver}" is appropriately reflected in the current price. `;
      }
      if (significantMetric) {
        explanation += `The ${significantMetric.metric} is close to the collection average, supporting our fair valuation assessment.`;
      }
      break;
  }
  
  return explanation;
}

/**
 * Performs comparative analysis within a collection
 * 
 * @param nft The NFT to analyze
 * @param collection The collection the NFT belongs to
 * @param fairValue The calculated fair value
 * @returns Comparative analysis results
 */
export function performComparativeAnalysis(
  nft: NFT,
  collection: Collection,
  fairValue: number
): { rank: number; percentile: number; similarNFTs: NFT[] } {
  // Sort NFTs by the ratio of fair value to rarity score
  const valueToRarityRatios = collection.nfts.map(collectionNft => {
    // For the current NFT, use our calculated fair value
    const nftValue = collectionNft.tokenId === nft.tokenId
      ? fairValue
      : (collectionNft.lastSalePrice || 0);
    
    return {
      nft: collectionNft,
      ratio: collectionNft.rarityScore > 0 ? nftValue / collectionNft.rarityScore : 0
    };
  });
  
  // Sort by ratio (higher ratio = better value)
  const sortedRatios = [...valueToRarityRatios].sort((a, b) => b.ratio - a.ratio);
  
  // Find rank of current NFT
  const rank = sortedRatios.findIndex(item => item.nft.tokenId === nft.tokenId) + 1;
  
  // Calculate percentile
  const percentile = (collection.nfts.length - rank) / collection.nfts.length * 100;
  
  // Find similar NFTs based on traits
  const similarNFTs = findSimilarNFTs(nft, collection.nfts, 5);
  
  return {
    rank,
    percentile,
    similarNFTs
  };
}

/**
 * Finds similar NFTs based on trait similarity
 * 
 * @param targetNft The NFT to find similar ones for
 * @param collectionNfts All NFTs in the collection
 * @param limit Maximum number of similar NFTs to return
 * @returns Array of similar NFTs
 */
function findSimilarNFTs(targetNft: NFT, collectionNfts: NFT[], limit: number): NFT[] {
  // Calculate similarity scores based on shared traits
  const similarityScores = collectionNfts
    .filter(nft => nft.tokenId !== targetNft.tokenId) // Exclude the target NFT
    .map(nft => {
      // Count matching traits
      const targetTraitTypes = targetNft.traits.map(trait => trait.type);
      const targetTraitValues = targetNft.traits.map(trait => `${trait.type}:${trait.value}`);
      
      const sharedTraitTypes = nft.traits
        .filter(trait => targetTraitTypes.includes(trait.type))
        .length;
      
      const sharedTraitValues = nft.traits
        .filter(trait => targetTraitValues.includes(`${trait.type}:${trait.value}`))
        .length;
      
      // Calculate similarity score (weighted more towards exact trait matches)
      const similarityScore = (sharedTraitValues * 2 + sharedTraitTypes) / 
                             (targetNft.traits.length * 3);
      
      return { nft, similarityScore };
    });
  
  // Sort by similarity score (descending) and take top 'limit'
  return similarityScores
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit)
    .map(item => item.nft);
}
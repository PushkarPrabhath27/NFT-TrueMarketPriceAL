/**
 * Rarity-Based Models for NFT Price Prediction
 * 
 * This module implements models that analyze the relationship between NFT rarity and price,
 * calculate collection-specific rarity premiums, assess time-varying rarity impact,
 * forecast rarity trends, and implement comparable selection based on rarity.
 */

import { NFT, Collection, RarityScore, PricePoint, ModelPrediction } from '../types';
import { findSimilarNFTs } from './comparable_sales';

/**
 * Calculates the statistical correlation between rarity scores and prices within a collection
 * @param collection The NFT collection to analyze
 * @param timeWindow Optional time window to restrict analysis (in days)
 * @returns Correlation coefficient and p-value
 */
export function calculateRarityPriceCorrelation(
  collection: Collection,
  timeWindow?: number
): { coefficient: number; pValue: number } {
  // Filter sales data based on time window if provided
  const salesData = timeWindow
    ? collection.sales.filter(
        sale => (Date.now() - new Date(sale.timestamp).getTime()) / (1000 * 60 * 60 * 24) <= timeWindow
      )
    : collection.sales;

  // Extract rarity scores and corresponding prices
  const rarityScores = salesData.map(sale => sale.nft.rarityScore);
  const prices = salesData.map(sale => sale.price);

  // Calculate Pearson correlation coefficient
  const n = rarityScores.length;
  const sumX = rarityScores.reduce((sum, x) => sum + x, 0);
  const sumY = prices.reduce((sum, y) => sum + y, 0);
  const sumXY = rarityScores.reduce((sum, x, i) => sum + x * prices[i], 0);
  const sumX2 = rarityScores.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = prices.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  const coefficient = denominator === 0 ? 0 : numerator / denominator;
  
  // Calculate p-value (simplified approach)
  const t = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
  const pValue = calculatePValue(t, n - 2); // Two-tailed p-value

  return { coefficient, pValue };
}

/**
 * Helper function to calculate p-value from t-statistic
 * @param t t-statistic
 * @param df degrees of freedom
 * @returns p-value
 */
function calculatePValue(t: number, df: number): number {
  // Simplified p-value calculation
  // In a production environment, use a statistical library
  const abst = Math.abs(t);
  // Approximation for two-tailed p-value
  return 2 * (1 - (1 - Math.exp(-0.5 * abst * abst)) / Math.sqrt(2 * Math.PI * abst));
}

/**
 * Calculates the rarity premium for a specific collection
 * @param collection The NFT collection
 * @param rarityPercentile The rarity percentile to calculate premium for
 * @returns The calculated premium as a multiplier
 */
export function calculateCollectionRarityPremium(
  collection: Collection,
  rarityPercentile: number = 90
): number {
  // Sort NFTs by rarity score
  const sortedNFTs = [...collection.nfts].sort((a, b) => b.rarityScore - a.rarityScore);
  
  // Determine rarity threshold for the given percentile
  const rarityThresholdIndex = Math.floor(sortedNFTs.length * (rarityPercentile / 100));
  const rarityThreshold = sortedNFTs[rarityThresholdIndex]?.rarityScore || 0;
  
  // Get average price for NFTs above the threshold
  const rareNFTs = collection.sales.filter(sale => sale.nft.rarityScore >= rarityThreshold);
  const rareAvgPrice = rareNFTs.reduce((sum, sale) => sum + sale.price, 0) / (rareNFTs.length || 1);
  
  // Get average price for all NFTs
  const avgPrice = collection.sales.reduce((sum, sale) => sum + sale.price, 0) / 
                  (collection.sales.length || 1);
  
  // Calculate premium as a multiplier
  return avgPrice > 0 ? rareAvgPrice / avgPrice : 1;
}

/**
 * Assesses how rarity impact on price changes over time
 * @param collection The NFT collection
 * @param timeWindows Array of time windows to analyze (in days)
 * @returns Object mapping time windows to correlation coefficients
 */
export function assessTimeVaryingRarityImpact(
  collection: Collection,
  timeWindows: number[] = [7, 30, 90, 180, 365]
): Record<number, number> {
  const result: Record<number, number> = {};
  
  // Calculate correlation for each time window
  for (const window of timeWindows) {
    const { coefficient } = calculateRarityPriceCorrelation(collection, window);
    result[window] = coefficient;
  }
  
  return result;
}

/**
 * Forecasts rarity trend based on historical data
 * @param collection The NFT collection
 * @param forecastDays Number of days to forecast
 * @returns Predicted rarity impact coefficients for future days
 */
export function forecastRarityTrend(
  collection: Collection,
  forecastDays: number = 30
): Array<{ day: number; coefficient: number }> {
  // Get historical rarity impact data
  const historicalImpact = assessTimeVaryingRarityImpact(collection);
  const timePoints = Object.keys(historicalImpact).map(Number).sort((a, b) => a - b);
  const coefficients = timePoints.map(tp => historicalImpact[tp]);
  
  // Simple linear regression for forecasting
  const n = timePoints.length;
  const sumX = timePoints.reduce((sum, x) => sum + x, 0);
  const sumY = coefficients.reduce((sum, y) => sum + y, 0);
  const sumXY = timePoints.reduce((sum, x, i) => sum + x * coefficients[i], 0);
  const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate forecast
  const forecast: Array<{ day: number; coefficient: number }> = [];
  const lastDay = timePoints[timePoints.length - 1] || 0;
  
  for (let i = 1; i <= forecastDays; i++) {
    const day = lastDay + i;
    const coefficient = intercept + slope * day;
    // Ensure coefficient is within reasonable bounds
    const boundedCoefficient = Math.max(-1, Math.min(1, coefficient));
    forecast.push({ day, coefficient: boundedCoefficient });
  }
  
  return forecast;
}

/**
 * Selects comparable NFTs based on rarity similarity
 * @param nft The target NFT
 * @param collection The collection containing potential comparables
 * @param count Number of comparables to return
 * @returns Array of comparable NFTs with similarity scores
 */
export function selectRarityBasedComparables(
  nft: NFT,
  collection: Collection,
  count: number = 5
): Array<{ comparable: NFT; similarityScore: number }> {
  // Filter out the target NFT itself
  const potentialComparables = collection.nfts.filter(item => item.id !== nft.id);
  
  // Calculate similarity based on rarity score and traits
  const comparables = potentialComparables.map(comparable => {
    // Rarity score similarity (inverse of normalized absolute difference)
    const rarityScoreDiff = Math.abs(nft.rarityScore - comparable.rarityScore) / 
                           Math.max(nft.rarityScore, comparable.rarityScore);
    const rarityScoreSimilarity = 1 - rarityScoreDiff;
    
    // Trait similarity (Jaccard similarity coefficient)
    const nftTraits = new Set(nft.traits.map(t => `${t.type}:${t.value}`));
    const comparableTraits = new Set(comparable.traits.map(t => `${t.type}:${t.value}`));
    
    // Calculate intersection and union
    const intersection = new Set([...nftTraits].filter(x => comparableTraits.has(x)));
    const union = new Set([...nftTraits, ...comparableTraits]);
    
    const traitSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    
    // Combined similarity score (weighted average)
    const similarityScore = 0.6 * rarityScoreSimilarity + 0.4 * traitSimilarity;
    
    return { comparable, similarityScore };
  });
  
  // Sort by similarity score (descending) and take the top 'count'
  return comparables
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, count);
}

/**
 * Predicts price based on rarity model
 * @param nft The NFT to predict price for
 * @param collection The collection the NFT belongs to
 * @returns Price prediction with confidence interval
 */
export function predictPriceWithRarityModel(
  nft: NFT,
  collection: Collection
): ModelPrediction {
  // Get collection-wide rarity premium
  const rarityPremium = calculateCollectionRarityPremium(collection);
  
  // Get rarity-based comparables
  const comparables = selectRarityBasedComparables(nft, collection);
  
  // Calculate base price from comparables
  let basePrice = 0;
  let totalWeight = 0;
  
  comparables.forEach(({ comparable, similarityScore }) => {
    // Find the most recent sale for this comparable
    const recentSales = collection.sales
      .filter(sale => sale.nft.id === comparable.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (recentSales.length > 0) {
      const salePrice = recentSales[0].price;
      const weight = similarityScore;
      
      basePrice += salePrice * weight;
      totalWeight += weight;
    }
  });
  
  // Calculate weighted average price
  const avgPrice = totalWeight > 0 ? basePrice / totalWeight : 0;
  
  // Apply rarity adjustment based on the NFT's rarity percentile
  const collectionRarityScores = collection.nfts.map(n => n.rarityScore);
  const rarityPercentile = calculatePercentile(nft.rarityScore, collectionRarityScores);
  
  // Calculate rarity adjustment factor
  const rarityAdjustment = calculateRarityAdjustment(rarityPercentile, rarityPremium);
  
  // Apply adjustment to get predicted price
  const predictedPrice = avgPrice * rarityAdjustment;
  
  // Calculate confidence interval (simplified)
  const confidenceInterval = {
    lower: predictedPrice * 0.85,
    upper: predictedPrice * 1.15
  };
  
  // Calculate confidence score based on comparable quality and data availability
  const confidenceScore = calculateConfidenceScore(comparables, collection);
  
  return {
    predictedPrice,
    confidenceInterval,
    confidenceScore,
    modelType: 'rarity-based',
    comparables: comparables.map(c => c.comparable.id)
  };
}

/**
 * Helper function to calculate percentile of a value in an array
 * @param value The value to find percentile for
 * @param array The array of values
 * @returns Percentile (0-100)
 */
function calculatePercentile(value: number, array: number[]): number {
  const sortedArray = [...array].sort((a, b) => a - b);
  const index = sortedArray.findIndex(v => v >= value);
  
  if (index === -1) return 100; // Value is greater than all elements
  
  return (index / sortedArray.length) * 100;
}

/**
 * Calculates rarity adjustment factor based on percentile and premium
 * @param rarityPercentile Percentile of the NFT's rarity in the collection
 * @param rarityPremium Collection-wide rarity premium
 * @returns Adjustment factor
 */
function calculateRarityAdjustment(rarityPercentile: number, rarityPremium: number): number {
  // Linear interpolation between 1.0 and rarityPremium based on percentile
  // At 50th percentile: factor = 1.0 (no adjustment)
  // At 100th percentile: factor = rarityPremium
  if (rarityPercentile <= 50) return 1.0;
  
  return 1.0 + ((rarityPercentile - 50) / 50) * (rarityPremium - 1.0);
}

/**
 * Calculates confidence score based on comparable quality
 * @param comparables Array of comparable NFTs with similarity scores
 * @param collection The collection
 * @returns Confidence score (0-1)
 */
function calculateConfidenceScore(
  comparables: Array<{ comparable: NFT; similarityScore: number }>,
  collection: Collection
): number {
  if (comparables.length === 0) return 0.3; // Low confidence if no comparables
  
  // Average similarity score
  const avgSimilarity = comparables.reduce((sum, c) => sum + c.similarityScore, 0) / comparables.length;
  
  // Recent sales factor
  const recentSalesCount = collection.sales.filter(
    sale => (Date.now() - new Date(sale.timestamp).getTime()) / (1000 * 60 * 60 * 24) <= 30
  ).length;
  const recentSalesFactor = Math.min(1, recentSalesCount / 20); // Normalize, cap at 1
  
  // Collection size factor
  const collectionSizeFactor = Math.min(1, collection.nfts.length / 1000);
  
  // Combined confidence score
  return 0.5 * avgSimilarity + 0.3 * recentSalesFactor + 0.2 * collectionSizeFactor;
}
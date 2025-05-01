/**
 * Price Volatility Metrics Module
 * 
 * Implements historical volatility calculation, future volatility prediction,
 * relative volatility comparison, risk-adjusted valuation, and visualization data
 * for price movement bands.
 */

import { NFT, Collection, EnsemblePrediction, SaleHistory } from '../types';
import { PriceVolatilityMetrics, TimeHorizon } from './types';

/**
 * Calculates historical volatility based on past price data
 * 
 * @param salesHistory Array of historical sales with timestamps and prices
 * @param windowDays Number of days to consider for volatility calculation
 * @returns Annualized volatility as a decimal (e.g., 0.5 = 50%)
 */
export function calculateHistoricalVolatility(salesHistory: SaleHistory[], windowDays: number = 30): number {
  // Filter sales within the specified window
  const now = Date.now();
  const windowStart = now - (windowDays * 24 * 60 * 60 * 1000);
  const relevantSales = salesHistory
    .filter(sale => sale.timestamp >= windowStart)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (relevantSales.length < 2) {
    return 0; // Not enough data to calculate volatility
  }
  
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < relevantSales.length; i++) {
    const previousPrice = relevantSales[i-1].price;
    const currentPrice = relevantSales[i].price;
    const returnRate = Math.log(currentPrice / previousPrice);
    returns.push(returnRate);
  }
  
  // Calculate standard deviation of returns
  const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / returns.length;
  const dailyVolatility = Math.sqrt(variance);
  
  // Annualize the volatility (assuming 365 trading days)
  const annualizedVolatility = dailyVolatility * Math.sqrt(365);
  
  return annualizedVolatility;
}

/**
 * Predicts future volatility for different time horizons
 * 
 * @param historicalVolatility The calculated historical volatility
 * @param nft The NFT being analyzed
 * @param collection The collection the NFT belongs to
 * @returns Predicted volatility for each time horizon
 */
export function predictFutureVolatility(
  historicalVolatility: number,
  nft: NFT,
  collection: Collection
): { timeHorizon: TimeHorizon; value: number }[] {
  // Base future volatility on historical with adjustments for each time horizon
  // Typically longer horizons have higher uncertainty
  const volatilityAdjustments = {
    [TimeHorizon.SEVEN_DAYS]: 0.9, // Slightly lower for short term
    [TimeHorizon.THIRTY_DAYS]: 1.0, // Same as historical for medium term
    [TimeHorizon.NINETY_DAYS]: 1.2, // Higher for long term
  };
  
  // Apply collection-specific adjustments based on liquidity and market conditions
  const collectionLiquidityFactor = Math.min(collection.sales.length / 100, 1);
  const marketTrendFactor = collection.trendingScore ? 1.1 : 0.95;
  
  return Object.entries(volatilityAdjustments).map(([horizon, adjustment]) => {
    const timeHorizon = horizon as TimeHorizon;
    const baseVolatility = historicalVolatility * adjustment;
    const adjustedVolatility = baseVolatility * (2 - collectionLiquidityFactor) * marketTrendFactor;
    
    return {
      timeHorizon,
      value: adjustedVolatility
    };
  });
}

/**
 * Calculates relative volatility compared to collection and market
 * 
 * @param historicalVolatility The NFT's historical volatility
 * @param collection The collection the NFT belongs to
 * @param marketVolatility The overall NFT market volatility
 * @returns Relative volatility metrics
 */
export function calculateRelativeVolatility(
  historicalVolatility: number,
  collection: Collection,
  marketVolatility: number
): { toCollection: number; toMarket: number } {
  // Calculate ratio of NFT volatility to collection volatility
  const collectionVolatility = collection.volatility || marketVolatility * 0.8; // Fallback if not available
  const relativeToCollection = historicalVolatility / collectionVolatility;
  
  // Calculate ratio of NFT volatility to market volatility
  const relativeToMarket = historicalVolatility / marketVolatility;
  
  return {
    toCollection: relativeToCollection,
    toMarket: relativeToMarket
  };
}

/**
 * Calculates risk-adjusted valuation based on volatility
 * 
 * @param fairValue The estimated fair value of the NFT
 * @param historicalVolatility The NFT's historical volatility
 * @param riskAversion Risk aversion parameter (higher = more risk averse)
 * @returns Risk-adjusted valuation
 */
export function calculateRiskAdjustedValuation(
  fairValue: number,
  historicalVolatility: number,
  riskAversion: number = 0.5
): number {
  // Apply a risk discount based on volatility and risk aversion
  // Higher volatility and risk aversion lead to larger discounts
  const riskDiscount = 1 - (historicalVolatility * riskAversion);
  
  // Ensure the discount doesn't exceed reasonable bounds
  const boundedDiscount = Math.max(0.5, Math.min(1, riskDiscount));
  
  return fairValue * boundedDiscount;
}

/**
 * Generates price movement bands for visualization
 * 
 * @param fairValue The estimated fair value of the NFT
 * @param predictedVolatility Predicted volatility for different time horizons
 * @returns Price movement bands with upper and lower bounds
 */
export function generatePriceMovementBands(
  fairValue: number,
  predictedVolatility: { timeHorizon: TimeHorizon; value: number }[]
): { timeHorizon: TimeHorizon; upperBand: number; lowerBand: number; probability: number }[] {
  // Calculate price bands based on volatility and confidence level
  // Using 1.96 for 95% confidence interval (assuming normal distribution)
  const confidenceFactor = 1.96;
  
  return predictedVolatility.map(({ timeHorizon, value }) => {
    // Adjust confidence factor based on time horizon
    const adjustedConfidenceFactor = confidenceFactor * (
      timeHorizon === TimeHorizon.NINETY_DAYS ? 1.2 :
      timeHorizon === TimeHorizon.THIRTY_DAYS ? 1.0 : 0.8
    );
    
    // Calculate price movement range
    const priceMovement = fairValue * value * adjustedConfidenceFactor;
    
    return {
      timeHorizon,
      upperBand: fairValue + priceMovement,
      lowerBand: Math.max(0, fairValue - priceMovement), // Ensure non-negative
      probability: 0.95 // 95% confidence interval
    };
  });
}

/**
 * Calculates comprehensive price volatility metrics
 * 
 * @param nft The NFT to analyze
 * @param collection The collection the NFT belongs to
 * @param prediction The ensemble prediction result
 * @param marketVolatility The overall NFT market volatility
 * @returns Complete price volatility metrics
 */
export function calculatePriceVolatilityMetrics(
  nft: NFT,
  collection: Collection,
  prediction: EnsemblePrediction,
  marketVolatility: number = 0.7 // Default market volatility if not provided
): PriceVolatilityMetrics {
  // Calculate historical volatility
  const historicalVolatility = calculateHistoricalVolatility(collection.sales);
  
  // Predict future volatility for different time horizons
  const predictedVolatility = predictFutureVolatility(historicalVolatility, nft, collection);
  
  // Calculate relative volatility compared to collection and market
  const relativeVolatility = calculateRelativeVolatility(historicalVolatility, collection, marketVolatility);
  
  // Calculate risk-adjusted valuation
  const riskAdjustedValuation = calculateRiskAdjustedValuation(prediction.predictedPrice, historicalVolatility);
  
  // Generate price movement bands for visualization
  const priceMovementBands = generatePriceMovementBands(prediction.predictedPrice, predictedVolatility);
  
  return {
    tokenId: nft.tokenId,
    collectionId: collection.id,
    historicalVolatility,
    predictedVolatility,
    relativeVolatility,
    riskAdjustedValuation,
    priceMovementBands,
    timestamp: Date.now()
  };
}
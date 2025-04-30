/**
 * FactorCalculator.ts
 * 
 * Base interface for all trust factor calculators.
 * Each factor calculator is responsible for computing a specific dimension
 * of trust for NFTs, creators, or collections.
 */

import { TrustScoreTypes } from '../types';

/**
 * Interface that all factor calculators must implement.
 * This ensures a consistent approach to factor calculation across the system.
 */
export interface FactorCalculator {
  /**
   * The weight of this factor in the overall trust score calculation (0-1)
   */
  readonly weight: number;
  
  /**
   * Calculate the factor score based on the provided input data
   * 
   * @param inputData The data needed for calculation
   * @returns A factor score with confidence metrics and explanations
   */
  calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore>;
  
  /**
   * Calculate the factor score for a creator
   * 
   * @param inputData The creator data needed for calculation
   * @returns A factor score for the creator
   */
  calculateForCreator?(inputData: TrustScoreTypes.CreatorInputData): Promise<TrustScoreTypes.FactorScore>;
  
  /**
   * Calculate the factor score for a collection
   * 
   * @param inputData The collection data needed for calculation
   * @returns A factor score for the collection
   */
  calculateForCollection?(inputData: TrustScoreTypes.CollectionInputData): Promise<TrustScoreTypes.FactorScore>;
  
  /**
   * Get a detailed explanation of how this factor is calculated
   * 
   * @returns A human-readable explanation of the factor calculation
   */
  getExplanation(): string;
  
  /**
   * Adjust the confidence of the factor score based on data completeness
   * 
   * @param inputData The data used for calculation
   * @param baseConfidence The initial confidence value
   * @returns An adjusted confidence value (0-1)
   */
  calculateConfidence(inputData: any, baseConfidence: number): number;
  
  /**
   * Identify red flags related to this factor
   * 
   * @param inputData The data used for calculation
   * @param score The calculated factor score
   * @returns An array of red flags, if any
   */
  identifyRedFlags(inputData: any, score: number): TrustScoreTypes.RedFlag[];
  
  /**
   * Identify strengths related to this factor
   * 
   * @param inputData The data used for calculation
   * @param score The calculated factor score
   * @returns An array of strengths, if any
   */
  identifyStrengths(inputData: any, score: number): TrustScoreTypes.Strength[];
}
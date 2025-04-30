/**
 * OriginalityFactor.ts
 * 
 * Implementation of the Originality Factor calculator.
 * This factor evaluates the originality of an NFT based on image similarity detection results.
 * It accounts for 20% of the overall trust score.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';

/**
 * Calculates the Originality Factor score for NFTs based on image similarity analysis.
 */
export class OriginalityFactor implements FactorCalculator {
  /**
   * The weight of this factor in the overall trust score (20%)
   */
  public readonly weight: number;

  /**
   * Initialize the Originality Factor calculator with its weight
   * 
   * @param weight The weight of this factor in the overall trust score
   */
  constructor(weight: number = 0.20) {
    this.weight = weight;
  }

  /**
   * Calculate the originality score based on image similarity detection results
   * 
   * @param inputData The NFT data including image similarity results
   * @returns A factor score with confidence metrics and explanations
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values for when no image similarity data is available
    let score = 50; // Neutral score
    let confidence = 0.3; // Low confidence without data
    let explanation = "No image similarity analysis data available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process image similarity results if available
    if (inputData.imageSimilarityResults && inputData.imageSimilarityResults.length > 0) {
      const results = inputData.imageSimilarityResults;
      
      // Find the highest similarity score (most similar match)
      const highestSimilarity = Math.max(...results.map(r => r.similarityScore));
      
      // Calculate originality score (inverse of similarity - higher similarity means lower originality)
      score = Math.round((1 - highestSimilarity) * 100);
      
      // Adjust score based on temporal factors (if this NFT came first, it's original regardless of similarity)
      const earlierCreations = results.filter(r => r.earlierCreationTimestamp);
      const isDerivative = earlierCreations.length > 0;
      
      if (isDerivative) {
        // Reduce score if this appears to be derivative work
        const earliestSimilar = earlierCreations.reduce((earliest, current) => {
          if (!earliest.earlierCreationTimestamp) return current;
          return new Date(current.earlierCreationTimestamp) < new Date(earliest.earlierCreationTimestamp) 
            ? current : earliest;
        }, earlierCreations[0]);
        
        // Higher similarity to earlier work means lower originality
        const temporalPenalty = earliestSimilar.similarityScore * 20; // Up to 20 point reduction
        score = Math.max(0, score - temporalPenalty);
        
        details.derivativeOf = earliestSimilar.comparedToNFT;
        details.similarityToOriginal = earliestSimilar.similarityScore;
        details.temporalPenalty = temporalPenalty;
      }
      
      // Calculate confidence based on the quality and quantity of similarity data
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      confidence = this.calculateConfidence(inputData, avgConfidence);
      
      // Generate explanation
      if (score >= 90) {
        explanation = `This NFT appears to be highly original with no significant similarities to existing NFTs.`;
      } else if (score >= 70) {
        explanation = `This NFT shows good originality with only minor similarities to existing works.`;
      } else if (score >= 50) {
        explanation = `This NFT has moderate originality with some notable similarities to existing works.`;
      } else if (score >= 30) {
        explanation = `This NFT shows limited originality with substantial similarities to existing works.`;
      } else {
        explanation = `This NFT appears to be highly derivative with significant similarities to existing works.`;
      }
      
      if (isDerivative) {
        explanation += ` It appears to be derivative of NFT ${details.derivativeOf} with a similarity score of ${(details.similarityToOriginal * 100).toFixed(1)}%.`;
      }
      
      // Add details for transparency
      details.highestSimilarityScore = highestSimilarity;
      details.numberOfComparisons = results.length;
      details.averageConfidenceOfAnalysis = avgConfidence;
    }
    
    // Identify red flags and strengths
    const redFlags = this.identifyRedFlags(inputData, score);
    const strengths = this.identifyStrengths(inputData, score);
    
    return {
      score,
      confidence,
      explanation,
      details,
      redFlags,
      strengths
    };
  }

  /**
   * Get a detailed explanation of how the originality factor is calculated
   * 
   * @returns A human-readable explanation of the factor calculation
   */
  public getExplanation(): string {
    return `The Originality Factor evaluates how unique an NFT is compared to existing works. It analyzes image similarity detection results, considering both visual similarity and which image appeared first chronologically. Higher scores indicate more original works with fewer similarities to existing NFTs. This factor accounts for 20% of the overall trust score.`;
  }

  /**
   * Calculate confidence in the originality score based on data completeness
   * 
   * @param inputData The NFT data used for calculation
   * @param baseConfidence The initial confidence from similarity analysis
   * @returns An adjusted confidence value (0-1)
   */
  public calculateConfidence(inputData: TrustScoreTypes.NFTInputData, baseConfidence: number): number {
    // Start with the base confidence from the similarity analysis
    let confidence = baseConfidence;
    
    // Adjust based on data completeness
    if (!inputData.imageSimilarityResults || inputData.imageSimilarityResults.length === 0) {
      return 0.3; // Low confidence without any similarity data
    }
    
    // More comparisons increase confidence
    const comparisonCount = inputData.imageSimilarityResults.length;
    const coverageFactor = Math.min(1, comparisonCount / 50); // Max out at 50 comparisons
    
    // Adjust confidence based on coverage
    confidence = confidence * 0.7 + coverageFactor * 0.3;
    
    // Age of the NFT affects confidence (newer NFTs have had less time for comparison)
    const creationDate = new Date(inputData.creationTimestamp);
    const now = new Date();
    const ageInDays = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
    const ageFactor = Math.min(1, ageInDays / 30); // Max out at 30 days
    
    // Adjust confidence based on age
    confidence = confidence * 0.8 + ageFactor * 0.2;
    
    return Math.min(1, Math.max(0.1, confidence)); // Ensure confidence is between 0.1 and 1
  }

  /**
   * Identify red flags related to originality
   * 
   * @param inputData The NFT data used for calculation
   * @param score The calculated originality score
   * @returns An array of red flags, if any
   */
  public identifyRedFlags(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    // No similarity data is a minor red flag
    if (!inputData.imageSimilarityResults || inputData.imageSimilarityResults.length === 0) {
      redFlags.push({
        severity: 'low',
        description: 'No image similarity analysis available',
        evidence: 'Unable to verify originality due to missing image analysis data.'
      });
      return redFlags;
    }
    
    const results = inputData.imageSimilarityResults;
    
    // High similarity to existing works is a red flag
    const highSimilarityResults = results.filter(r => r.similarityScore > 0.7);
    if (highSimilarityResults.length > 0) {
      const highestSimilarity = highSimilarityResults.reduce(
        (highest, current) => current.similarityScore > highest.similarityScore ? current : highest,
        highSimilarityResults[0]
      );
      
      const severity = highestSimilarity.similarityScore > 0.9 ? 'high' : 
                      highestSimilarity.similarityScore > 0.8 ? 'medium' : 'low';
      
      redFlags.push({
        severity,
        description: `High similarity to existing NFT`,
        evidence: `${(highestSimilarity.similarityScore * 100).toFixed(1)}% similar to NFT ${highestSimilarity.comparedToNFT}`
      });
    }
    
    // Derivative work (created after similar works) is a red flag
    const earlierCreations = results.filter(r => r.earlierCreationTimestamp && r.similarityScore > 0.5);
    if (earlierCreations.length > 0) {
      redFlags.push({
        severity: 'medium',
        description: 'Appears to be derivative of earlier works',
        evidence: `Similar to ${earlierCreations.length} NFTs that were created earlier`
      });
    }
    
    return redFlags;
  }

  /**
   * Identify strengths related to originality
   * 
   * @param inputData The NFT data used for calculation
   * @param score The calculated originality score
   * @returns An array of strengths, if any
   */
  public identifyStrengths(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.Strength[] {
    const strengths: TrustScoreTypes.Strength[] = [];
    
    // No similarity data means we can't identify strengths
    if (!inputData.imageSimilarityResults || inputData.imageSimilarityResults.length === 0) {
      return strengths;
    }
    
    // High originality is a strength
    if (score >= 90) {
      strengths.push({
        significance: 'high',
        description: 'Highly original artwork',
        evidence: 'No significant similarities found to existing NFTs'
      });
    } else if (score >= 75) {
      strengths.push({
        significance: 'medium',
        description: 'Good originality',
        evidence: 'Only minor similarities to existing NFTs'
      });
    }
    
    // Being the original that others copy is a strength
    const results = inputData.imageSimilarityResults;
    const laterSimilarWorks = results.filter(r => !r.earlierCreationTimestamp && r.similarityScore > 0.7);
    if (laterSimilarWorks.length > 0) {
      const significance = laterSimilarWorks.length > 5 ? 'high' : 
                         laterSimilarWorks.length > 2 ? 'medium' : 'low';
      
      strengths.push({
        significance,
        description: 'Influential original work',
        evidence: `${laterSimilarWorks.length} similar NFTs were created after this one`
      });
    }
    
    return strengths;
  }
}
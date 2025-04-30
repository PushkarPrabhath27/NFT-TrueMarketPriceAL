/**
 * Trust Score Service
 * 
 * Provides business logic for retrieving trust scores for NFTs, creators, and collections.
 * Acts as an interface between the API controllers and the trust score calculation system.
 */

import { TrustScoreEngine } from '../../TrustScoreEngine';
import { ScoreAggregator } from '../../aggregation/ScoreAggregator';
import { VisualizationDataGenerator } from '../../aggregation/VisualizationDataGenerator';

// Types for service responses
export interface TrustScoreResponse {
  score: number;
  confidence: number;
  explanation: string;
  timestamp: string;
  visualizationData?: Record<string, any>;
  [key: string]: any; // Allow for additional fields
}

export interface BatchTrustScoreResponse {
  tokenId: string;
  score: number;
  confidence: number;
  timestamp: string;
}

/**
 * Service for retrieving trust scores
 */
export class TrustScoreService {
  private trustScoreEngine: TrustScoreEngine;
  private scoreAggregator: ScoreAggregator;
  private visualizationGenerator: VisualizationDataGenerator;

  constructor() {
    this.trustScoreEngine = new TrustScoreEngine();
    this.scoreAggregator = new ScoreAggregator();
    this.visualizationGenerator = new VisualizationDataGenerator();
  }

  /**
   * Get trust score for a specific NFT
   * @param tokenId - NFT token ID
   * @param fields - Optional fields to include in response
   * @returns Trust score response
   */
  public async getNftTrustScore(tokenId: string, fields?: string[]): Promise<TrustScoreResponse | null> {
    try {
      // Get trust score from engine
      const trustScore = await this.trustScoreEngine.calculateNftTrustScore(tokenId);
      
      if (!trustScore) {
        return null;
      }

      // Create base response
      const response: TrustScoreResponse = {
        score: trustScore.score,
        confidence: trustScore.confidence,
        explanation: trustScore.explanation,
        timestamp: new Date().toISOString()
      };

      // Add visualization data if requested
      if (!fields || fields.includes('visualizationData')) {
        response.visualizationData = this.visualizationGenerator.generateForNft(tokenId);
      }

      // Add additional fields if requested
      if (fields) {
        if (fields.includes('factors')) {
          response.factors = trustScore.factors;
        }
        if (fields.includes('redFlags')) {
          response.redFlags = trustScore.redFlags;
        }
        if (fields.includes('strengths')) {
          response.strengths = trustScore.strengths;
        }
      }

      return response;
    } catch (error) {
      console.error(`Error getting NFT trust score for ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get trust scores for multiple NFTs in a single request
   * @param tokenIds - Array of NFT token IDs
   * @returns Array of trust score responses
   */
  public async getBatchNftTrustScores(tokenIds: string[]): Promise<BatchTrustScoreResponse[]> {
    try {
      // Process in parallel for better performance
      const promises = tokenIds.map(async (tokenId) => {
        try {
          const trustScore = await this.trustScoreEngine.calculateNftTrustScore(tokenId);
          
          if (!trustScore) {
            return {
              tokenId,
              score: 0,
              confidence: 0,
              timestamp: new Date().toISOString()
            };
          }

          return {
            tokenId,
            score: trustScore.score,
            confidence: trustScore.confidence,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error getting batch trust score for ${tokenId}:`, error);
          // Return placeholder with error indicator
          return {
            tokenId,
            score: 0,
            confidence: 0,
            timestamp: new Date().toISOString(),
            error: 'Failed to calculate trust score'
          };
        }
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('Error in batch trust score calculation:', error);
      throw error;
    }
  }

  /**
   * Get trust score for a specific creator
   * @param address - Creator wallet address
   * @returns Trust score response
   */
  public async getCreatorTrustScore(address: string): Promise<TrustScoreResponse | null> {
    try {
      // Get creator reputation from engine
      const creatorScore = await this.trustScoreEngine.calculateCreatorReputation(address);
      
      if (!creatorScore) {
        return null;
      }

      return {
        score: creatorScore.score,
        confidence: creatorScore.confidence,
        explanation: creatorScore.explanation,
        timestamp: new Date().toISOString(),
        visualizationData: this.visualizationGenerator.generateForCreator(address)
      };
    } catch (error) {
      console.error(`Error getting creator trust score for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get trust score for a specific collection
   * @param collectionId - Collection ID
   * @returns Trust score response
   */
  public async getCollectionTrustScore(collectionId: string): Promise<TrustScoreResponse | null> {
    try {
      // Get collection trust score from engine
      const collectionScore = await this.trustScoreEngine.calculateCollectionTrustScore(collectionId);
      
      if (!collectionScore) {
        return null;
      }

      return {
        score: collectionScore.score,
        confidence: collectionScore.confidence,
        explanation: collectionScore.explanation,
        timestamp: new Date().toISOString(),
        visualizationData: this.visualizationGenerator.generateForCollection(collectionId)
      };
    } catch (error) {
      console.error(`Error getting collection trust score for ${collectionId}:`, error);
      throw error;
    }
  }
}
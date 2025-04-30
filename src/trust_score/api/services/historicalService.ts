/**
 * Historical Service
 * 
 * Provides business logic for retrieving historical trust score data
 * for NFTs, creators, and collections.
 */

import { HistoricalTracker } from '../../history/HistoricalTracker';
import { ScoreHistoryRepository } from '../../repositories/ScoreHistoryRepository';

// Types for service responses
export interface HistoricalDataOptions {
  startDate?: Date;
  endDate?: Date;
  interval: 'day' | 'week' | 'month';
}

export interface HistoricalDataPoint {
  timestamp: string;
  score: number;
  confidence: number;
}

export interface HistoricalDataResponse {
  tokenId?: string;
  address?: string;
  collectionId?: string;
  interval: string;
  confidence: number;
  dataPoints: HistoricalDataPoint[];
  significantChanges?: {
    timestamp: string;
    description: string;
    scoreBefore: number;
    scoreAfter: number;
  }[];
}

/**
 * Service for retrieving historical trust score data
 */
export class HistoricalService {
  private historicalTracker: HistoricalTracker;
  private scoreHistoryRepository: ScoreHistoryRepository;

  constructor() {
    this.historicalTracker = new HistoricalTracker();
    this.scoreHistoryRepository = new ScoreHistoryRepository();
  }

  /**
   * Get historical trust score data for a specific NFT
   * @param tokenId - NFT token ID
   * @param options - Options for historical data retrieval
   * @returns Historical data response
   */
  public async getNftTrustScoreHistory(
    tokenId: string,
    options: HistoricalDataOptions
  ): Promise<HistoricalDataResponse | null> {
    try {
      // Get historical data from repository
      const history = await this.scoreHistoryRepository.getNftScoreHistory(tokenId, {
        startDate: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
        endDate: options.endDate || new Date(),
        interval: options.interval
      });

      if (!history || history.dataPoints.length === 0) {
        return null;
      }

      // Get significant changes
      const significantChanges = await this.historicalTracker.getSignificantChanges({
        entityType: 'nft',
        entityId: tokenId,
        startDate: options.startDate,
        endDate: options.endDate
      });

      return {
        tokenId,
        interval: options.interval,
        confidence: history.confidence,
        dataPoints: history.dataPoints.map(point => ({
          timestamp: point.timestamp,
          score: point.score,
          confidence: point.confidence
        })),
        significantChanges: significantChanges.map(change => ({
          timestamp: change.timestamp,
          description: change.description,
          scoreBefore: change.scoreBefore,
          scoreAfter: change.scoreAfter
        }))
      };
    } catch (error) {
      console.error(`Error getting NFT trust score history for ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get historical trust score data for a specific creator
   * @param address - Creator wallet address
   * @param options - Options for historical data retrieval
   * @returns Historical data response
   */
  public async getCreatorTrustScoreHistory(
    address: string,
    options: HistoricalDataOptions
  ): Promise<HistoricalDataResponse | null> {
    try {
      // Get historical data from repository
      const history = await this.scoreHistoryRepository.getCreatorScoreHistory(address, {
        startDate: options.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default to last 90 days
        endDate: options.endDate || new Date(),
        interval: options.interval
      });

      if (!history || history.dataPoints.length === 0) {
        return null;
      }

      // Get significant changes
      const significantChanges = await this.historicalTracker.getSignificantChanges({
        entityType: 'creator',
        entityId: address,
        startDate: options.startDate,
        endDate: options.endDate
      });

      return {
        address,
        interval: options.interval,
        confidence: history.confidence,
        dataPoints: history.dataPoints.map(point => ({
          timestamp: point.timestamp,
          score: point.score,
          confidence: point.confidence
        })),
        significantChanges: significantChanges.map(change => ({
          timestamp: change.timestamp,
          description: change.description,
          scoreBefore: change.scoreBefore,
          scoreAfter: change.scoreAfter
        }))
      };
    } catch (error) {
      console.error(`Error getting creator trust score history for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get historical trust score data for a specific collection
   * @param collectionId - Collection ID
   * @param options - Options for historical data retrieval
   * @returns Historical data response
   */
  public async getCollectionTrustScoreHistory(
    collectionId: string,
    options: HistoricalDataOptions
  ): Promise<HistoricalDataResponse | null> {
    try {
      // Get historical data from repository
      const history = await this.scoreHistoryRepository.getCollectionScoreHistory(collectionId, {
        startDate: options.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default to last 90 days
        endDate: options.endDate || new Date(),
        interval: options.interval
      });

      if (!history || history.dataPoints.length === 0) {
        return null;
      }

      // Get significant changes
      const significantChanges = await this.historicalTracker.getSignificantChanges({
        entityType: 'collection',
        entityId: collectionId,
        startDate: options.startDate,
        endDate: options.endDate
      });

      return {
        collectionId,
        interval: options.interval,
        confidence: history.confidence,
        dataPoints: history.dataPoints.map(point => ({
          timestamp: point.timestamp,
          score: point.score,
          confidence: point.confidence
        })),
        significantChanges: significantChanges.map(change => ({
          timestamp: change.timestamp,
          description: change.description,
          scoreBefore: change.scoreBefore,
          scoreAfter: change.scoreAfter
        }))
      };
    } catch (error) {
      console.error(`Error getting collection trust score history for ${collectionId}:`, error);
      throw error;
    }
  }
}
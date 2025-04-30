/**
 * NFT Controller
 * 
 * Implements the business logic for NFT trust score API endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { TrustScoreService } from '../services/trustScoreService';
import { HistoricalService } from '../services/historicalService';
import { FactorAnalysisService } from '../services/factorAnalysisService';

/**
 * Controller for NFT trust score endpoints
 */
export class NftController {
  private trustScoreService: TrustScoreService;
  private historicalService: HistoricalService;
  private factorService: FactorAnalysisService;

  constructor() {
    this.trustScoreService = new TrustScoreService();
    this.historicalService = new HistoricalService();
    this.factorService = new FactorAnalysisService();
  }

  /**
   * Get trust score for a specific NFT
   */
  public getTrustScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tokenId } = req.params;
      const fields = req.query.fields ? String(req.query.fields).split(',') : undefined;

      // Get trust score from service
      const trustScore = await this.trustScoreService.getNftTrustScore(tokenId, fields);

      // If NFT not found, return 404
      if (!trustScore) {
        next(ApiError.notFound('NFT not found', { tokenId }));
        return;
      }

      // Format response with metadata
      res.json({
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          request_id: req.headers['x-request-id'] || generateRequestId(),
          confidence: trustScore.confidence || 0.95
        },
        data: trustScore,
        links: {
          self: `/scores/nft/${tokenId}`,
          related: [
            `/scores/nft/${tokenId}/factors`,
            `/scores/nft/${tokenId}/history`,
            `/risk/profile/${tokenId}`
          ]
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get historical trust scores for an NFT
   */
  public getTrustScoreHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tokenId } = req.params;
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
      const interval = req.query.interval ? String(req.query.interval) : 'day';

      // Get historical data from service
      const history = await this.historicalService.getNftTrustScoreHistory(tokenId, {
        startDate,
        endDate,
        interval: interval as 'day' | 'week' | 'month'
      });

      // If NFT not found, return 404
      if (!history) {
        next(ApiError.notFound('NFT history not found', { tokenId }));
        return;
      }

      // Format response with metadata
      res.json({
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          request_id: req.headers['x-request-id'] || generateRequestId(),
          confidence: history.confidence || 0.95
        },
        data: history,
        links: {
          self: `/scores/nft/${tokenId}/history`,
          related: [
            `/scores/nft/${tokenId}`,
            `/scores/nft/${tokenId}/factors`
          ]
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get detailed factor breakdown for an NFT trust score
   */
  public getTrustScoreFactors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tokenId } = req.params;

      // Get factor analysis from service
      const factors = await this.factorService.getNftFactorAnalysis(tokenId);

      // If NFT not found, return 404
      if (!factors) {
        next(ApiError.notFound('NFT factors not found', { tokenId }));
        return;
      }

      // Format response with metadata
      res.json({
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          request_id: req.headers['x-request-id'] || generateRequestId(),
          confidence: factors.confidence || 0.95
        },
        data: factors,
        links: {
          self: `/scores/nft/${tokenId}/factors`,
          related: [
            `/scores/nft/${tokenId}`,
            `/risk/profile/${tokenId}`
          ]
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get trust scores for multiple NFTs in a single request
   */
  public getBatchTrustScores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idsParam = String(req.query.ids);
      const tokenIds = idsParam.split(',').map(id => id.trim());

      // Validate number of IDs (prevent abuse)
      if (tokenIds.length > 50) {
        next(ApiError.badRequest('Too many token IDs. Maximum is 50.'));
        return;
      }

      // Get batch scores from service
      const batchScores = await this.trustScoreService.getBatchNftTrustScores(tokenIds);

      // Format response with metadata
      res.json({
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          request_id: req.headers['x-request-id'] || generateRequestId(),
          count: batchScores.length
        },
        data: batchScores,
        links: {
          self: `/scores/nft/batch?ids=${idsParam}`
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Generate a unique request ID
 * @returns Unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}
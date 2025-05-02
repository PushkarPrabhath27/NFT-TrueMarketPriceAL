/**
 * Trust Score Routes
 * 
 * Defines API routes for NFT trust scores and related data.
 */

import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { ApiError } from '../middleware/errorHandler';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * /scores/nft/{token_id}:
 *   get:
 *     summary: Get trust score for an individual NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Trust score details
 *       404:
 *         description: NFT not found
 */
router.get('/nft/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // In a real implementation, this would call the trust score service
      // const score = await trustScoreService.getNftScore(token_id);
      
      // Mock response for demonstration
      const score = {
        token_id,
        score: 85.7,
        confidence: 0.92,
        timestamp: new Date().toISOString(),
        factors: {
          authenticity: 90,
          market_performance: 82,
          creator_reputation: 88,
          liquidity: 75,
          community_engagement: 80
        },
        risk_level: 'low'
      };
      
      res.status(200).json({
        data: score,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/scores/nft/${token_id}`,
          factors: `/scores/nft/${token_id}/factors`,
          history: `/scores/nft/${token_id}/history`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve NFT score'));
    }
  }
);

/**
 * @swagger
 * /scores/nft/{token_id}/history:
 *   get:
 *     summary: Get historical trust scores for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *         description: Time period for history
 *     responses:
 *       200:
 *         description: Historical trust scores
 *       404:
 *         description: NFT not found
 */
router.get('/nft/:token_id/history',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required'),
    query('period').optional().isIn(['day', 'week', 'month', 'year', 'all']).withMessage('Invalid period')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      const period = req.query.period as string || 'month';
      
      // Mock response for demonstration
      const history = {
        token_id,
        period,
        data_points: [
          { timestamp: '2023-01-01T00:00:00Z', score: 82.5 },
          { timestamp: '2023-01-15T00:00:00Z', score: 83.1 },
          { timestamp: '2023-02-01T00:00:00Z', score: 84.2 },
          { timestamp: '2023-02-15T00:00:00Z', score: 85.0 },
          { timestamp: '2023-03-01T00:00:00Z', score: 85.7 }
        ]
      };
      
      res.status(200).json({
        data: history,
        meta: {
          timestamp: new Date().toISOString(),
          period
        },
        links: {
          self: `/scores/nft/${token_id}/history?period=${period}`,
          nft: `/scores/nft/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve NFT score history'));
    }
  }
);

/**
 * @swagger
 * /scores/nft/{token_id}/factors:
 *   get:
 *     summary: Get detailed factor analysis for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Detailed factor analysis
 *       404:
 *         description: NFT not found
 */
router.get('/nft/:token_id/factors',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // Mock response for demonstration
      const factors = {
        token_id,
        timestamp: new Date().toISOString(),
        factors: [
          {
            name: 'authenticity',
            score: 90,
            weight: 0.25,
            components: [
              { name: 'contract_verification', value: 1.0, contribution: 25 },
              { name: 'creator_verification', value: 0.9, contribution: 22.5 },
              { name: 'metadata_consistency', value: 0.85, contribution: 21.25 },
              { name: 'image_uniqueness', value: 0.85, contribution: 21.25 }
            ]
          },
          {
            name: 'market_performance',
            score: 82,
            weight: 0.2,
            components: [
              { name: 'price_stability', value: 0.8, contribution: 16 },
              { name: 'volume_trend', value: 0.85, contribution: 17 },
              { name: 'market_cap_growth', value: 0.8, contribution: 16 },
              { name: 'liquidity_depth', value: 0.825, contribution: 16.5 },
              { name: 'price_momentum', value: 0.825, contribution: 16.5 }
            ]
          },
          {
            name: 'creator_reputation',
            score: 88,
            weight: 0.2,
            components: [
              { name: 'previous_projects', value: 0.9, contribution: 18 },
              { name: 'community_standing', value: 0.85, contribution: 17 },
              { name: 'delivery_history', value: 0.9, contribution: 18 },
              { name: 'transparency', value: 0.875, contribution: 17.5 },
              { name: 'longevity', value: 0.875, contribution: 17.5 }
            ]
          },
          {
            name: 'liquidity',
            score: 75,
            weight: 0.15,
            components: [
              { name: 'trading_volume', value: 0.7, contribution: 10.5 },
              { name: 'bid_ask_spread', value: 0.8, contribution: 12 },
              { name: 'market_depth', value: 0.75, contribution: 11.25 },
              { name: 'transaction_count', value: 0.75, contribution: 11.25 }
            ]
          },
          {
            name: 'community_engagement',
            score: 80,
            weight: 0.2,
            components: [
              { name: 'social_media_activity', value: 0.8, contribution: 16 },
              { name: 'holder_diversity', value: 0.75, contribution: 15 },
              { name: 'community_growth', value: 0.85, contribution: 17 },
              { name: 'developer_activity', value: 0.8, contribution: 16 }
            ]
          }
        ],
        overall_score: 85.7
      };
      
      res.status(200).json({
        data: factors,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/scores/nft/${token_id}/factors`,
          nft: `/scores/nft/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve NFT factor analysis'));
    }
  }
);

/**
 * @swagger
 * /scores/collection/{collection_id}:
 *   get:
 *     summary: Get trust score for a collection
 *     parameters:
 *       - in: path
 *         name: collection_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The collection ID
 *     responses:
 *       200:
 *         description: Collection trust score details
 *       404:
 *         description: Collection not found
 */
router.get('/collection/:collection_id',
  [
    param('collection_id').isString().notEmpty().withMessage('Collection ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { collection_id } = req.params;
      
      // Mock response for demonstration
      const score = {
        collection_id,
        name: 'Example Collection',
        score: 88.3,
        confidence: 0.95,
        timestamp: new Date().toISOString(),
        nft_count: 10000,
        factors: {
          authenticity: 92,
          market_performance: 85,
          creator_reputation: 90,
          liquidity: 82,
          community_engagement: 87
        },
        risk_level: 'low'
      };
      
      res.status(200).json({
        data: score,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/scores/collection/${collection_id}`,
          factors: `/scores/collection/${collection_id}/factors`,
          history: `/scores/collection/${collection_id}/history`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve collection score'));
    }
  }
);

/**
 * @swagger
 * /scores/creator/{address}:
 *   get:
 *     summary: Get trust score for a creator
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The creator's blockchain address
 *     responses:
 *       200:
 *         description: Creator trust score details
 *       404:
 *         description: Creator not found
 */
router.get('/creator/:address',
  [
    param('address').isString().notEmpty().withMessage('Creator address is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { address } = req.params;
      
      // Mock response for demonstration
      const score = {
        address,
        name: 'Example Creator',
        score: 91.2,
        confidence: 0.94,
        timestamp: new Date().toISOString(),
        collection_count: 5,
        nft_count: 500,
        factors: {
          delivery_history: 95,
          community_standing: 90,
          project_quality: 92,
          transparency: 88,
          longevity: 85
        },
        risk_level: 'very_low'
      };
      
      res.status(200).json({
        data: score,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/scores/creator/${address}`,
          factors: `/scores/creator/${address}/factors`,
          history: `/scores/creator/${address}/history`,
          nfts: `/scores/creator/${address}/nfts`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve creator score'));
    }
  }
);

/**
 * @swagger
 * /scores/batch:
 *   post:
 *     summary: Get trust scores for multiple NFTs in a single request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Batch trust score results
 *       400:
 *         description: Invalid request
 */
router.post('/batch',
  async (req, res, next) => {
    try {
      const { token_ids } = req.body;
      
      if (!Array.isArray(token_ids)) {
        throw ApiError.badRequest('token_ids must be an array');
      }
      
      if (token_ids.length > 50) {
        throw ApiError.badRequest('Maximum of 50 token IDs allowed per request');
      }
      
      // Mock response for demonstration
      const scores = token_ids.map(id => ({
        token_id: id,
        score: 80 + Math.random() * 15, // Random score between 80-95
        confidence: 0.85 + Math.random() * 0.1, // Random confidence between 0.85-0.95
        timestamp: new Date().toISOString(),
        risk_level: Math.random() > 0.7 ? 'low' : 'medium' // 70% chance of 'low'
      }));
      
      res.status(200).json({
        data: scores,
        meta: {
          timestamp: new Date().toISOString(),
          count: scores.length
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve batch scores'));
    }
  }
);

export default router;
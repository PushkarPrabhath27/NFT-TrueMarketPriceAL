/**
 * Price Intelligence Routes
 * 
 * Defines API routes for NFT price predictions and related data.
 */

import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { ApiError } from '../middleware/errorHandler';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * /price/prediction/{token_id}:
 *   get:
 *     summary: Get price forecast for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *       - in: query
 *         name: horizon
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *         description: Time horizon for prediction
 *     responses:
 *       200:
 *         description: Price prediction details
 *       404:
 *         description: NFT not found
 */
router.get('/prediction/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required'),
    query('horizon').optional().isIn(['day', 'week', 'month', 'quarter', 'year']).withMessage('Invalid horizon')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      const horizon = req.query.horizon as string || 'month';
      
      // Mock response for demonstration
      const prediction = {
        token_id,
        current_price: 1.25,
        currency: 'ETH',
        prediction: {
          horizon,
          expected_price: 1.45,
          upper_bound: 1.65,
          lower_bound: 1.30,
          confidence: 0.85
        },
        factors: {
          market_trend: 'bullish',
          collection_momentum: 'positive',
          liquidity: 'medium',
          volatility: 'low'
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json({
        data: prediction,
        meta: {
          timestamp: new Date().toISOString(),
          horizon
        },
        links: {
          self: `/price/prediction/${token_id}?horizon=${horizon}`,
          history: `/price/history/${token_id}`,
          comparable: `/price/comparable/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve price prediction'));
    }
  }
);

/**
 * @swagger
 * /price/history/{token_id}:
 *   get:
 *     summary: Get historical price data for an NFT
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
 *           enum: [day, week, month, quarter, year, all]
 *         description: Time period for history
 *     responses:
 *       200:
 *         description: Historical price data
 *       404:
 *         description: NFT not found
 */
router.get('/history/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required'),
    query('period').optional().isIn(['day', 'week', 'month', 'quarter', 'year', 'all']).withMessage('Invalid period')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      const period = req.query.period as string || 'month';
      
      // Mock response for demonstration
      const history = {
        token_id,
        currency: 'ETH',
        period,
        data_points: [
          { timestamp: '2023-01-01T00:00:00Z', price: 1.05, volume: 3.2 },
          { timestamp: '2023-01-15T00:00:00Z', price: 1.12, volume: 2.8 },
          { timestamp: '2023-02-01T00:00:00Z', price: 1.18, volume: 4.1 },
          { timestamp: '2023-02-15T00:00:00Z', price: 1.22, volume: 3.5 },
          { timestamp: '2023-03-01T00:00:00Z', price: 1.25, volume: 2.9 }
        ],
        statistics: {
          min: 1.05,
          max: 1.25,
          avg: 1.16,
          volatility: 0.08,
          trend: 'upward'
        }
      };
      
      res.status(200).json({
        data: history,
        meta: {
          timestamp: new Date().toISOString(),
          period
        },
        links: {
          self: `/price/history/${token_id}?period=${period}`,
          prediction: `/price/prediction/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve price history'));
    }
  }
);

/**
 * @swagger
 * /price/comparable/{token_id}:
 *   get:
 *     summary: Get comparable NFTs with similar price characteristics
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of comparable NFTs to return
 *     responses:
 *       200:
 *         description: Comparable NFTs
 *       404:
 *         description: NFT not found
 */
router.get('/comparable/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Mock response for demonstration
      const comparables = {
        token_id,
        current_price: 1.25,
        currency: 'ETH',
        comparable_nfts: Array.from({ length: limit }, (_, i) => ({
          token_id: `token-${1000 + i}`,
          collection_id: `collection-${100 + Math.floor(i / 3)}`,
          similarity_score: 0.95 - (i * 0.05),
          price: 1.25 * (0.9 + (Math.random() * 0.2)),
          price_difference_pct: Math.round((Math.random() * 20) - 10),
          key_similarities: [
            'trait_distribution',
            'price_history',
            'creator_reputation'
          ].slice(0, Math.floor(Math.random() * 3) + 1)
        }))
      };
      
      res.status(200).json({
        data: comparables,
        meta: {
          timestamp: new Date().toISOString(),
          count: comparables.comparable_nfts.length
        },
        links: {
          self: `/price/comparable/${token_id}?limit=${limit}`,
          prediction: `/price/prediction/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve comparable NFTs'));
    }
  }
);

/**
 * @swagger
 * /price/volatility/{token_id}:
 *   get:
 *     summary: Get volatility metrics for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Volatility metrics
 *       404:
 *         description: NFT not found
 */
router.get('/volatility/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // Mock response for demonstration
      const volatility = {
        token_id,
        current_price: 1.25,
        currency: 'ETH',
        volatility_metrics: {
          daily_volatility: 0.03,
          weekly_volatility: 0.08,
          monthly_volatility: 0.15,
          price_stability_score: 82,
          max_drawdown: 0.12,
          sharpe_ratio: 1.8
        },
        market_comparison: {
          collection_percentile: 65, // Less volatile than 65% of collection
          market_percentile: 72 // Less volatile than 72% of market
        },
        risk_assessment: 'medium_low',
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json({
        data: volatility,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/price/volatility/${token_id}`,
          prediction: `/price/prediction/${token_id}`,
          history: `/price/history/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve volatility metrics'));
    }
  }
);

/**
 * @swagger
 * /price/valuation/{token_id}:
 *   get:
 *     summary: Get fair value assessment for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Fair value assessment
 *       404:
 *         description: NFT not found
 */
router.get('/valuation/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // Mock response for demonstration
      const valuation = {
        token_id,
        current_price: 1.25,
        currency: 'ETH',
        valuation: {
          fair_value_estimate: 1.32,
          confidence_interval: [1.18, 1.46],
          valuation_methods: [
            { method: 'comparable_sales', value: 1.30, weight: 0.4 },
            { method: 'trait_based', value: 1.35, weight: 0.3 },
            { method: 'collection_floor', value: 1.28, weight: 0.2 },
            { method: 'rarity_based', value: 1.38, weight: 0.1 }
          ],
          overvalued_probability: 0.35,
          undervalued_probability: 0.65
        },
        market_context: {
          collection_floor_price: 0.95,
          collection_average_price: 1.15,
          market_trend: 'stable'
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json({
        data: valuation,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/price/valuation/${token_id}`,
          prediction: `/price/prediction/${token_id}`,
          comparable: `/price/comparable/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve valuation assessment'));
    }
  }
);

export default router;
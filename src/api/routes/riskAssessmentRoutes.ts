/**
 * Risk Assessment Routes
 * 
 * Defines API routes for NFT risk assessments and related data.
 */

import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { ApiError } from '../middleware/errorHandler';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * /risk/profile/{token_id}:
 *   get:
 *     summary: Get comprehensive risk assessment for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Risk assessment details
 *       404:
 *         description: NFT not found
 */
router.get('/profile/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // Mock response for demonstration
      const riskProfile = {
        token_id,
        overall_risk_score: 28, // Lower is better (less risky)
        risk_category: 'low',
        confidence: 0.92,
        timestamp: new Date().toISOString(),
        risk_factors: {
          market_risk: 25,
          liquidity_risk: 35,
          volatility_risk: 30,
          fraud_risk: 15,
          smart_contract_risk: 20
        },
        recommendations: [
          {
            type: 'holding_period',
            recommendation: 'long_term',
            confidence: 0.88,
            reasoning: 'Low volatility and strong creator reputation suggest good long-term value'
          },
          {
            type: 'position_sizing',
            recommendation: 'moderate',
            confidence: 0.85,
            reasoning: 'Good liquidity allows for moderate position sizing'
          }
        ]
      };
      
      res.status(200).json({
        data: riskProfile,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/risk/profile/${token_id}`,
          factors: `/risk/factors/${token_id}`,
          history: `/risk/history/${token_id}`,
          mitigation: `/risk/mitigation/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve risk profile'));
    }
  }
);

/**
 * @swagger
 * /risk/factors/{token_id}:
 *   get:
 *     summary: Get detailed risk factor breakdown for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Detailed risk factor breakdown
 *       404:
 *         description: NFT not found
 */
router.get('/factors/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // Mock response for demonstration
      const riskFactors = {
        token_id,
        timestamp: new Date().toISOString(),
        factors: [
          {
            name: 'market_risk',
            score: 25,
            weight: 0.25,
            components: [
              { name: 'market_correlation', value: 0.3, contribution: 7.5 },
              { name: 'market_sentiment', value: 0.2, contribution: 5.0 },
              { name: 'market_cycle_position', value: 0.25, contribution: 6.25 },
              { name: 'collection_momentum', value: 0.25, contribution: 6.25 }
            ]
          },
          {
            name: 'liquidity_risk',
            score: 35,
            weight: 0.2,
            components: [
              { name: 'trading_volume', value: 0.4, contribution: 8.0 },
              { name: 'bid_ask_spread', value: 0.3, contribution: 6.0 },
              { name: 'sell_order_depth', value: 0.35, contribution: 7.0 },
              { name: 'time_to_liquidate', value: 0.35, contribution: 7.0 },
              { name: 'buyer_diversity', value: 0.35, contribution: 7.0 }
            ]
          },
          {
            name: 'volatility_risk',
            score: 30,
            weight: 0.2,
            components: [
              { name: 'price_volatility', value: 0.3, contribution: 6.0 },
              { name: 'max_drawdown', value: 0.25, contribution: 5.0 },
              { name: 'price_stability', value: 0.35, contribution: 7.0 },
              { name: 'volatility_trend', value: 0.3, contribution: 6.0 },
              { name: 'outlier_transactions', value: 0.3, contribution: 6.0 }
            ]
          },
          {
            name: 'fraud_risk',
            score: 15,
            weight: 0.2,
            components: [
              { name: 'wash_trading_probability', value: 0.1, contribution: 2.0 },
              { name: 'suspicious_activity', value: 0.15, contribution: 3.0 },
              { name: 'ownership_concentration', value: 0.2, contribution: 4.0 },
              { name: 'creator_reputation', value: 0.15, contribution: 3.0 },
              { name: 'marketplace_verification', value: 0.15, contribution: 3.0 }
            ]
          },
          {
            name: 'smart_contract_risk',
            score: 20,
            weight: 0.15,
            components: [
              { name: 'contract_audit_status', value: 0.15, contribution: 2.25 },
              { name: 'contract_complexity', value: 0.2, contribution: 3.0 },
              { name: 'contract_age', value: 0.25, contribution: 3.75 },
              { name: 'previous_vulnerabilities', value: 0.2, contribution: 3.0 },
              { name: 'upgrade_mechanisms', value: 0.25, contribution: 3.75 },
              { name: 'ownership_controls', value: 0.25, contribution: 3.75 }
            ]
          }
        ],
        overall_risk_score: 28
      };
      
      res.status(200).json({
        data: riskFactors,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/risk/factors/${token_id}`,
          profile: `/risk/profile/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve risk factors'));
    }
  }
);

/**
 * @swagger
 * /risk/comparison/{collection_id}:
 *   get:
 *     summary: Get relative risk positioning within a collection
 *     parameters:
 *       - in: path
 *         name: collection_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The collection ID
 *       - in: query
 *         name: token_id
 *         schema:
 *           type: string
 *         description: Optional token ID to highlight in comparison
 *     responses:
 *       200:
 *         description: Collection risk comparison
 *       404:
 *         description: Collection not found
 */
router.get('/comparison/:collection_id',
  [
    param('collection_id').isString().notEmpty().withMessage('Collection ID is required'),
    query('token_id').optional().isString().withMessage('Invalid token ID')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { collection_id } = req.params;
      const token_id = req.query.token_id as string;
      
      // Mock response for demonstration
      const comparison = {
        collection_id,
        collection_name: 'Example Collection',
        timestamp: new Date().toISOString(),
        collection_stats: {
          average_risk_score: 35,
          median_risk_score: 32,
          min_risk_score: 15,
          max_risk_score: 75,
          risk_distribution: [
            { range: '0-20', count: 150, percentage: 15 },
            { range: '21-40', count: 450, percentage: 45 },
            { range: '41-60', count: 300, percentage: 30 },
            { range: '61-80', count: 80, percentage: 8 },
            { range: '81-100', count: 20, percentage: 2 }
          ]
        },
        highlighted_token: token_id ? {
          token_id,
          risk_score: 28,
          percentile: 85, // Better than 85% of collection
          relative_position: 'low_risk'
        } : undefined
      };
      
      res.status(200).json({
        data: comparison,
        meta: {
          timestamp: new Date().toISOString(),
          token_id
        },
        links: {
          self: `/risk/comparison/${collection_id}${token_id ? `?token_id=${token_id}` : ''}`,
          collection: `/scores/collection/${collection_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve risk comparison'));
    }
  }
);

/**
 * @swagger
 * /risk/mitigation/{token_id}:
 *   get:
 *     summary: Get risk reduction recommendations for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Risk mitigation recommendations
 *       404:
 *         description: NFT not found
 */
router.get('/mitigation/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // Mock response for demonstration
      const mitigation = {
        token_id,
        current_risk_score: 28,
        timestamp: new Date().toISOString(),
        recommendations: [
          {
            risk_factor: 'liquidity_risk',
            current_score: 35,
            recommendation: 'Consider setting a lower sell price to improve liquidity',
            potential_improvement: 8,
            confidence: 0.85
          },
          {
            risk_factor: 'volatility_risk',
            current_score: 30,
            recommendation: 'Hold for at least 3 months to ride out short-term volatility',
            potential_improvement: 5,
            confidence: 0.75
          },
          {
            risk_factor: 'market_risk',
            current_score: 25,
            recommendation: 'Diversify collection exposure across multiple artists',
            potential_improvement: 6,
            confidence: 0.8
          }
        ],
        potential_risk_score: 18,
        improvement_percentage: 35.7
      };
      
      res.status(200).json({
        data: mitigation,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/risk/mitigation/${token_id}`,
          profile: `/risk/profile/${token_id}`,
          factors: `/risk/factors/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve risk mitigation recommendations'));
    }
  }
);

/**
 * @swagger
 * /risk/history/{token_id}:
 *   get:
 *     summary: Get risk evolution tracking for an NFT
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
 *           enum: [week, month, quarter, year, all]
 *         description: Time period for history
 *     responses:
 *       200:
 *         description: Historical risk evolution
 *       404:
 *         description: NFT not found
 */
router.get('/history/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required'),
    query('period').optional().isIn(['week', 'month', 'quarter', 'year', 'all']).withMessage('Invalid period')
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
          { timestamp: '2023-01-01T00:00:00Z', risk_score: 42, risk_category: 'medium' },
          { timestamp: '2023-01-15T00:00:00Z', risk_score: 38, risk_category: 'medium' },
          { timestamp: '2023-02-01T00:00:00Z', risk_score: 35, risk_category: 'low_medium' },
          { timestamp: '2023-02-15T00:00:00Z', risk_score: 30, risk_category: 'low_medium' },
          { timestamp: '2023-03-01T00:00:00Z', risk_score: 28, risk_category: 'low' }
        ],
        factor_evolution: {
          market_risk: [
            { timestamp: '2023-01-01T00:00:00Z', score: 35 },
            { timestamp: '2023-03-01T00:00:00Z', score: 25 }
          ],
          liquidity_risk: [
            { timestamp: '2023-01-01T00:00:00Z', score: 45 },
            { timestamp: '2023-03-01T00:00:00Z', score: 35 }
          ],
          volatility_risk: [
            { timestamp: '2023-01-01T00:00:00Z', score: 40 },
            { timestamp: '2023-03-01T00:00:00Z', score: 30 }
          ],
          fraud_risk: [
            { timestamp: '2023-01-01T00:00:00Z', score: 20 },
            { timestamp: '2023-03-01T00:00:00Z', score: 15 }
          ],
          smart_contract_risk: [
            { timestamp: '2023-01-01T00:00:00Z', score: 25 },
            { timestamp: '2023-03-01T00:00:00Z', score: 20 }
          ]
        },
        key_events: [
          {
            timestamp: '2023-01-20T00:00:00Z',
            event: 'Collection floor price increased by 25%',
            impact: 'Reduced liquidity risk by 8 points'
          },
          {
            timestamp: '2023-02-10T00:00:00Z',
            event: 'Creator launched new successful project',
            impact: 'Reduced fraud risk by 5 points'
          }
        ]
      };
      
      res.status(200).json({
        data: history,
        meta: {
          timestamp: new Date().toISOString(),
          period
        },
        links: {
          self: `/risk/history/${token_id}?period=${period}`,
          profile: `/risk/profile/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve risk history'));
    }
  }
);

export default router;
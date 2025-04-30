/**
 * Creator Routes
 * 
 * Defines API routes for creator reputation scores and related data.
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { CreatorController } from '../controllers/creatorController';

const router = Router();
const controller = new CreatorController();

/**
 * @route GET /scores/creator/:address
 * @description Get reputation score for a creator
 * @param address - Creator wallet address
 * @query fields - Comma-separated list of fields to include
 */
router.get('/:address',
  validate([
    param('address').isString().notEmpty().withMessage('Valid creator address is required'),
    query('fields').optional().isString().withMessage('Fields must be a comma-separated string')
  ]),
  controller.getReputationScore
);

/**
 * @route GET /scores/creator/:address/history
 * @description Get historical reputation data for a creator
 * @param address - Creator wallet address
 * @query startDate - Start date for history (ISO format)
 * @query endDate - End date for history (ISO format)
 * @query interval - Time interval for data points (day, week, month)
 */
router.get('/:address/history',
  validate([
    param('address').isString().notEmpty().withMessage('Valid creator address is required'),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO format'),
    query('interval').optional().isIn(['day', 'week', 'month']).withMessage('Interval must be day, week, or month')
  ]),
  controller.getReputationHistory
);

/**
 * @route GET /scores/creator/:address/nfts
 * @description Get trust scores for all NFTs by a creator
 * @param address - Creator wallet address
 * @query page - Page number for paginated results
 * @query limit - Number of results per page (max 100)
 * @query sort - Field to sort results by (prefix with - for descending order)
 */
router.get('/:address/nfts',
  validate([
    param('address').isString().notEmpty().withMessage('Valid creator address is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isString().withMessage('Sort must be a valid field name')
  ]),
  controller.getCreatorNfts
);

/**
 * @route GET /scores/creator/:address/factors
 * @description Get detailed factor breakdown for a creator's reputation
 * @param address - Creator wallet address
 */
router.get('/:address/factors',
  validate([
    param('address').isString().notEmpty().withMessage('Valid creator address is required')
  ]),
  controller.getReputationFactors
);

export const creatorRoutes = router;
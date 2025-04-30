/**
 * NFT Routes
 * 
 * Defines API routes for NFT trust scores and related data.
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { NftController } from '../controllers/nftController';

const router = Router();
const controller = new NftController();

/**
 * @route GET /scores/nft/:tokenId
 * @description Get trust score for a specific NFT
 * @param tokenId - NFT token ID
 * @query fields - Comma-separated list of fields to include
 */
router.get('/:tokenId',
  validate([
    param('tokenId').isString().notEmpty().withMessage('Valid token ID is required'),
    query('fields').optional().isString().withMessage('Fields must be a comma-separated string')
  ]),
  controller.getTrustScore
);

/**
 * @route GET /scores/nft/:tokenId/history
 * @description Get historical trust scores for an NFT
 * @param tokenId - NFT token ID
 * @query startDate - Start date for history (ISO format)
 * @query endDate - End date for history (ISO format)
 * @query interval - Time interval for data points (day, week, month)
 */
router.get('/:tokenId/history',
  validate([
    param('tokenId').isString().notEmpty().withMessage('Valid token ID is required'),
    query('startDate').optional().isISO8601().withMessage('Start date must be in ISO format'),
    query('endDate').optional().isISO8601().withMessage('End date must be in ISO format'),
    query('interval').optional().isIn(['day', 'week', 'month']).withMessage('Interval must be day, week, or month')
  ]),
  controller.getTrustScoreHistory
);

/**
 * @route GET /scores/nft/:tokenId/factors
 * @description Get detailed factor breakdown for an NFT trust score
 * @param tokenId - NFT token ID
 */
router.get('/:tokenId/factors',
  validate([
    param('tokenId').isString().notEmpty().withMessage('Valid token ID is required')
  ]),
  controller.getTrustScoreFactors
);

/**
 * @route GET /scores/nft/batch
 * @description Get trust scores for multiple NFTs in a single request
 * @query ids - Comma-separated list of token IDs
 */
router.get('/batch',
  validate([
    query('ids').isString().notEmpty().withMessage('Comma-separated list of token IDs is required')
  ]),
  controller.getBatchTrustScores
);

export const nftRoutes = router;
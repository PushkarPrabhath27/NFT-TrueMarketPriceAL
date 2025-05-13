import { Router } from 'express';
import { createHathorEnabledEngine } from '../../trust_score/integrations/HathorIntegration';
import { validateApiKey, validateTier } from '../middleware/auth';
import { RateLimiter } from '../middleware/rateLimiter';

const router = Router();
const { hathorIntegration } = createHathorEnabledEngine();

// Rate limiter middleware
const rateLimiter = new RateLimiter();

/**
 * Get trust score with Hathor data
 * @route GET /api/v1/hathor/nfts/{nftId}/trust-score
 */
router.get('/nfts/:nftId/trust-score',
  validateApiKey,
  validateTier,
  rateLimiter.check(),
  async (req, res) => {
    try {
      const { nftId } = req.params;
      const trustScore = await hathorIntegration.calculateTrustScore(nftId, {
        tokenId: nftId,
        hathorContractId: req.query.contractId as string
      });

      res.json({
        success: true,
        data: {
          nftId,
          trustScore: {
            score: trustScore.score,
            confidence: trustScore.confidence,
            explanation: trustScore.explanation,
            lastUpdated: new Date().toISOString()
          },
          trustFactors: trustScore.factors,
          hathorData: trustScore.hathorMetrics,
          redFlags: trustScore.redFlags,
          strengths: trustScore.strengths
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to calculate trust score',
          details: error.message
        }
      });
    }
  }
);

/**
 * Analyze Hathor nano contract
 * @route GET /api/v1/hathor/contracts/{contractId}/analysis
 */
router.get('/contracts/:contractId/analysis',
  validateApiKey,
  validateTier,
  rateLimiter.check(),
  async (req, res) => {
    try {
      const { contractId } = req.params;
      const extractor = hathorIntegration.getExtractor();
      
      const contractData = await extractor.extractContractData({
        contractId,
        includeTransactions: true,
        includeBlueprint: true
      });

      res.json({
        success: true,
        data: {
          contractId,
          analysis: contractData.trustAnalysis,
          blueprint: contractData.blueprint,
          transactions: contractData.transactions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to analyze contract',
          details: error.message
        }
      });
    }
  }
);

export default router;
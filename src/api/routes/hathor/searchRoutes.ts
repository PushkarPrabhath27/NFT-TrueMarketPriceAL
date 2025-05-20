/**
 * searchRoutes.ts
 * 
 * API routes for searching and retrieving NFT data from Hathor blockchain.
 * These endpoints connect to the Hathor blockchain and return NFT data for various analytics features.
 */

import express from 'express';
import { HathorProvider } from '../../../blockchain/hathor/connection/HathorProvider';
import { HathorDataTransformer } from '../../../blockchain/hathor/transformation/DataTransformer';
import config from '../../config';

const router = express.Router();

/**
 * Search for NFTs on the Hathor blockchain
 * GET /api/hathor/search?query=<search_term>
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    // Connect to Hathor blockchain
    const hathorProvider = new HathorProvider(config.hathor);
    await hathorProvider.connect();
    
    // Search by token ID, name, or collection
    const results = await hathorProvider.searchNFTs(query);
    
    // Transform the results to the expected format
    const transformer = new HathorDataTransformer();
    const transformedResults = results.map(nft => transformer.transformNFTData(nft));
    
    res.json({
      success: true,
      data: transformedResults
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search NFTs on Hathor blockchain'
    });
  }
});

/**
 * Get NFT data by token ID
 * GET /api/hathor/nft/:id
 */
router.get('/nft/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Connect to Hathor blockchain
    const hathorProvider = new HathorProvider(config.hathor);
    await hathorProvider.connect();
    
    // Get NFT data
    const nftData = await hathorProvider.getNFTData(id);
    
    if (!nftData) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }
    
    // Transform the data to the expected format
    const transformer = new HathorDataTransformer();
    const transformedData = transformer.transformNFTData(nftData);
    
    res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('NFT data fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT data from Hathor blockchain'
    });
  }
});

/**
 * Get trust score for a specific NFT
 * GET /api/hathor/trustscore/:nftId
 */
router.get('/trustscore/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    
    const hathorProvider = new HathorProvider(config.hathor);
    await hathorProvider.connect();
    
    // Get raw NFT data from Hathor blockchain
    const rawData = await hathorProvider.getNFTData(nftId);
    
    if (!rawData) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }
    
    // Transform the data for frontend consumption
    const transformer = new HathorDataTransformer();
    const trustScoreData = transformer.extractTrustScore(rawData);
    
    res.json({
      success: true,
      data: trustScoreData
    });
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trust score from Hathor blockchain'
    });
  }
});

/**
 * Get price history for a specific NFT
 * GET /api/hathor/price-history/:nftId?timeframe=<timeframe>
 */
router.get('/price-history/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    const { timeframe } = req.query;
    
    const hathorProvider = new HathorProvider(config.hathor);
    await hathorProvider.connect();
    
    // Get price history from Hathor blockchain
    const priceHistory = await hathorProvider.getNFTPriceHistory(nftId, timeframe as string);
    
    res.json({
      success: true,
      data: priceHistory
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history from Hathor blockchain'
    });
  }
});

/**
 * Get risk assessment for a specific NFT
 * GET /api/hathor/risk/:nftId
 */
router.get('/risk/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    
    const hathorProvider = new HathorProvider(config.hathor);
    await hathorProvider.connect();
    
    // Get raw NFT data from Hathor blockchain
    const rawData = await hathorProvider.getNFTData(nftId);
    
    if (!rawData) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }
    
    // Transform the data for frontend consumption
    const transformer = new HathorDataTransformer();
    const riskData = transformer.extractRiskAssessment(rawData);
    
    res.json({
      success: true,
      data: riskData
    });
  } catch (error) {
    console.error('Get risk assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch risk assessment from Hathor blockchain'
    });
  }
});

export default router;
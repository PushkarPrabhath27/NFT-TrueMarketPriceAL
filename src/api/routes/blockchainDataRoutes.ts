/**
 * Blockchain Data Routes
 * 
 * Defines API routes for blockchain data and NFT metadata.
 */

import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { ApiError } from '../middleware/errorHandler';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * /blockchain/nft/{token_id}:
 *   get:
 *     summary: Get NFT metadata and details
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: NFT metadata and details
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
      
      // Mock response for demonstration
      const nftData = {
        token_id,
        contract_address: '0x1234567890abcdef1234567890abcdef12345678',
        token_standard: 'ERC-721',
        blockchain: 'ethereum',
        owner: '0xabcdef1234567890abcdef1234567890abcdef12',
        creator: '0x9876543210abcdef1234567890abcdef12345678',
        creation_date: '2022-05-15T10:30:00Z',
        metadata: {
          name: 'Example NFT',
          description: 'This is an example NFT for the API documentation',
          image: 'https://example.com/nft/image.png',
          external_url: 'https://example.com/nft/123',
          attributes: [
            { trait_type: 'Background', value: 'Blue' },
            { trait_type: 'Eyes', value: 'Green' },
            { trait_type: 'Species', value: 'Alien' }
          ]
        },
        last_transfer: {
          timestamp: '2023-02-10T15:45:00Z',
          from: '0x1111111111111111111111111111111111111111',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          transaction_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        }
      };
      
      res.status(200).json({
        data: nftData,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/blockchain/nft/${token_id}`,
          collection: `/blockchain/collection/${nftData.contract_address}`,
          creator: `/blockchain/creator/${nftData.creator}`,
          ownership: `/blockchain/ownership/${token_id}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve NFT data'));
    }
  }
);

/**
 * @swagger
 * /blockchain/collection/{collection_id}:
 *   get:
 *     summary: Get collection information
 *     parameters:
 *       - in: path
 *         name: collection_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The collection ID (contract address)
 *     responses:
 *       200:
 *         description: Collection information
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
      const collectionData = {
        collection_id,
        name: 'Example Collection',
        description: 'This is an example NFT collection',
        creator: '0x9876543210abcdef1234567890abcdef12345678',
        creation_date: '2022-01-10T08:15:00Z',
        token_standard: 'ERC-721',
        blockchain: 'ethereum',
        total_supply: 10000,
        owner_count: 3500,
        floor_price: 0.85,
        volume_traded: 12500.75,
        website: 'https://example-collection.com',
        social_links: {
          twitter: 'https://twitter.com/example_collection',
          discord: 'https://discord.gg/example',
          instagram: 'https://instagram.com/example_collection'
        },
        verified: true,
        traits: [
          { name: 'Background', values: ['Blue', 'Red', 'Green', 'Yellow'], rarity: [0.25, 0.25, 0.25, 0.25] },
          { name: 'Eyes', values: ['Green', 'Blue', 'Brown', 'Purple'], rarity: [0.3, 0.3, 0.3, 0.1] },
          { name: 'Species', values: ['Human', 'Alien', 'Robot'], rarity: [0.5, 0.3, 0.2] }
        ]
      };
      
      res.status(200).json({
        data: collectionData,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/blockchain/collection/${collection_id}`,
          creator: `/blockchain/creator/${collectionData.creator}`,
          nfts: `/blockchain/collection/${collection_id}/nfts`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve collection data'));
    }
  }
);

/**
 * @swagger
 * /blockchain/creator/{address}:
 *   get:
 *     summary: Get creator profile
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The creator's blockchain address
 *     responses:
 *       200:
 *         description: Creator profile information
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
      const creatorData = {
        address,
        name: 'Example Creator',
        bio: 'Digital artist specializing in abstract NFT art',
        verified: true,
        first_mint_date: '2021-03-15T12:00:00Z',
        collections_created: 5,
        total_nfts_created: 500,
        total_volume: 1250.5,
        highest_sale: 75.0,
        social_links: {
          twitter: 'https://twitter.com/example_creator',
          instagram: 'https://instagram.com/example_creator',
          website: 'https://example-creator.com'
        },
        recent_activity: [
          { type: 'mint', timestamp: '2023-02-28T14:30:00Z', collection: 'Example Collection', count: 10 },
          { type: 'sale', timestamp: '2023-02-15T09:45:00Z', collection: 'Example Collection', price: 5.2 }
        ]
      };
      
      res.status(200).json({
        data: creatorData,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/blockchain/creator/${address}`,
          collections: `/blockchain/creator/${address}/collections`,
          nfts: `/blockchain/creator/${address}/nfts`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve creator data'));
    }
  }
);

/**
 * @swagger
 * /blockchain/transaction/{tx_hash}:
 *   get:
 *     summary: Get transaction details
 *     parameters:
 *       - in: path
 *         name: tx_hash
 *         required: true
 *         schema:
 *           type: string
 *         description: The transaction hash
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 */
router.get('/transaction/:tx_hash',
  [
    param('tx_hash').isString().notEmpty().withMessage('Transaction hash is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { tx_hash } = req.params;
      
      // Mock response for demonstration
      const transactionData = {
        tx_hash,
        blockchain: 'ethereum',
        block_number: 15243687,
        timestamp: '2023-01-20T18:30:45Z',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x1234567890abcdef1234567890abcdef12345678', // Contract address
        value: 1.5,
        gas_used: 150000,
        gas_price: 25000000000,
        transaction_fee: 0.00375,
        status: 'success',
        transaction_type: 'nft_transfer',
        nft_details: {
          token_id: 'token-123',
          from_address: '0x1111111111111111111111111111111111111111',
          to_address: '0xabcdef1234567890abcdef1234567890abcdef12',
          contract_address: '0x1234567890abcdef1234567890abcdef12345678'
        }
      };
      
      res.status(200).json({
        data: transactionData,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/blockchain/transaction/${tx_hash}`,
          nft: `/blockchain/nft/${transactionData.nft_details.token_id}`,
          collection: `/blockchain/collection/${transactionData.nft_details.contract_address}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve transaction data'));
    }
  }
);

/**
 * @swagger
 * /blockchain/ownership/{token_id}:
 *   get:
 *     summary: Get ownership history for an NFT
 *     parameters:
 *       - in: path
 *         name: token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The NFT token ID
 *     responses:
 *       200:
 *         description: Ownership history
 *       404:
 *         description: NFT not found
 */
router.get('/ownership/:token_id',
  [
    param('token_id').isString().notEmpty().withMessage('Token ID is required')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const { token_id } = req.params;
      
      // Mock response for demonstration
      const ownershipData = {
        token_id,
        contract_address: '0x1234567890abcdef1234567890abcdef12345678',
        current_owner: '0xabcdef1234567890abcdef1234567890abcdef12',
        ownership_history: [
          {
            owner: '0xabcdef1234567890abcdef1234567890abcdef12',
            acquired_date: '2023-02-10T15:45:00Z',
            transaction_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            price: 1.5,
            marketplace: 'OpenSea'
          },
          {
            owner: '0x1111111111111111111111111111111111111111',
            acquired_date: '2022-11-05T09:20:00Z',
            transaction_hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
            price: 1.2,
            marketplace: 'Rarible'
          },
          {
            owner: '0x2222222222222222222222222222222222222222',
            acquired_date: '2022-08-15T14:10:00Z',
            transaction_hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
            price: 0.8,
            marketplace: 'OpenSea'
          },
          {
            owner: '0x9876543210abcdef1234567890abcdef12345678', // Creator
            acquired_date: '2022-05-15T10:30:00Z',
            transaction_hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
            price: null,
            marketplace: 'Mint'
          }
        ],
        ownership_duration: {
          current_owner_days: 48,
          average_holding_period: 95,
          longest_holding_period: 120
        }
      };
      
      res.status(200).json({
        data: ownershipData,
        meta: {
          timestamp: new Date().toISOString()
        },
        links: {
          self: `/blockchain/ownership/${token_id}`,
          nft: `/blockchain/nft/${token_id}`,
          current_owner: `/blockchain/address/${ownershipData.current_owner}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to retrieve ownership data'));
    }
  }
);

/**
 * @swagger
 * /blockchain/search:
 *   get:
 *     summary: Search for NFTs, collections, or creators
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [nft, collection, creator, all]
 *         description: Type of entities to search for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid search parameters
 */
router.get('/search',
  [
    query('q').isString().notEmpty().withMessage('Search query is required'),
    query('type').optional().isIn(['nft', 'collection', 'creator', 'all']).withMessage('Invalid type'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validationMiddleware,
  async (req, res, next) => {
    try {
      const searchQuery = req.query.q as string;
      const type = req.query.type as string || 'all';
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Mock response for demonstration
      const searchResults = {
        query: searchQuery,
        type,
        results: {
          nfts: type === 'nft' || type === 'all' ? Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
            token_id: `token-${1000 + i}`,
            name: `${searchQuery} NFT ${i + 1}`,
            collection: 'Example Collection',
            image_url: `https://example.com/nft/image-${1000 + i}.png`,
            match_reason: 'name'
          })) : [],
          collections: type === 'collection' || type === 'all' ? Array.from({ length: Math.min(limit, 2) }, (_, i) => ({
            collection_id: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            name: `${searchQuery} Collection ${i + 1}`,
            image_url: `https://example.com/collection/image-${100 + i}.png`,
            nft_count: 1000 * (i + 1),
            match_reason: 'name'
          })) : [],
          creators: type === 'creator' || type === 'all' ? Array.from({ length: Math.min(limit, 2) }, (_, i) => ({
            address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            name: `${searchQuery} Creator ${i + 1}`,
            verified: i === 0,
            collection_count: i + 1,
            match_reason: 'name'
          })) : []
        }
      };
      
      res.status(200).json({
        data: searchResults,
        meta: {
          timestamp: new Date().toISOString(),
          count: {
            nfts: searchResults.results.nfts.length,
            collections: searchResults.results.collections.length,
            creators: searchResults.results.creators.length,
            total: searchResults.results.nfts.length + 
                   searchResults.results.collections.length + 
                   searchResults.results.creators.length
          }
        },
        links: {
          self: `/blockchain/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=${limit}`
        }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : ApiError.internal('Failed to perform search'));
    }
  }
);

export default router;
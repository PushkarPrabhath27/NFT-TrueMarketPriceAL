/**
 * API Service for Hathor Blockchain Integration
 * 
 * This service provides methods to interact with the Hathor blockchain
 * through our backend API endpoints.
 */

import axios from 'axios';
import { NFTData } from '../blockchain/hathor/transformation/DataTransformer';

// Base API configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler helper
const handleError = (error: any) => {
  console.error('API Error:', error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return Promise.reject(error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    return Promise.reject({ message: 'No response from server. Please try again later.' });
  } else {
    // Something happened in setting up the request that triggered an Error
    return Promise.reject({ message: 'Request failed. Please try again later.' });
  }
};

// API methods for Hathor blockchain integration
export const hathorApi = {
  /**
   * Search for NFTs on the Hathor blockchain
   * @param query Search query string (token ID, name, etc.)
   */
  searchNFT: async (query: string) => {
    try {
      const response = await api.get(`/hathor/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get detailed data for a specific NFT
   * @param nftId The NFT token ID
   */
  getNFTData: async (nftId: string): Promise<{ data: NFTData }> => {
    try {
      const response = await api.get(`/hathor/nft/${nftId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get trust score data for a specific NFT
   * @param nftId The NFT token ID
   */
  getTrustScore: async (nftId: string) => {
    try {
      const response = await api.get(`/hathor/trustscore/${nftId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get price history for a specific NFT
   * @param nftId The NFT token ID
   * @param timeframe Optional timeframe parameter (e.g., '1d', '7d', '30d', '1y')
   */
  getPriceHistory: async (nftId: string, timeframe?: string) => {
    try {
      const params = timeframe ? `?timeframe=${timeframe}` : '';
      const response = await api.get(`/hathor/price-history/${nftId}${params}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get risk assessment for a specific NFT
   * @param nftId The NFT token ID
   */
  getRiskAssessment: async (nftId: string) => {
    try {
      const response = await api.get(`/hathor/risk/${nftId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
};

export default hathorApi;
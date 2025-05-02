/**
 * Trust Score Service
 * 
 * Service for interacting with the Trust Score API endpoints.
 */

import { NFTTrustScoreClient } from '../client';
import { ApiResponse, TrustScore, RequestOptions } from '../types';

/**
 * Trust Score Service class for interacting with trust score endpoints
 */
export class TrustScoreService {
  private client: NFTTrustScoreClient;
  
  /**
   * Create a new Trust Score Service
   * 
   * @param client NFT TrustScore API client
   */
  constructor(client: NFTTrustScoreClient) {
    this.client = client;
  }
  
  /**
   * Get trust score for an NFT
   * 
   * @param tokenId NFT token ID
   * @param options Request options
   * @returns Trust score data
   */
  public async getTokenScore(tokenId: string, options?: RequestOptions): Promise<ApiResponse<TrustScore>> {
    return this.client.get<TrustScore>(`scores/nft/${encodeURIComponent(tokenId)}`, options);
  }
  
  /**
   * Get trust scores for multiple NFTs
   * 
   * @param tokenIds Array of NFT token IDs
   * @param options Request options
   * @returns Trust scores data
   */
  public async getBatchTokenScores(tokenIds: string[], options?: RequestOptions): Promise<ApiResponse<TrustScore[]>> {
    return this.client.post<TrustScore[]>('scores/nft/batch', { tokenIds }, options);
  }
  
  /**
   * Get trust score for a collection
   * 
   * @param collectionId Collection ID
   * @param options Request options
   * @returns Collection trust score data
   */
  public async getCollectionScore(collectionId: string, options?: RequestOptions): Promise<ApiResponse<{
    collectionId: string;
    score: number;
    confidence: number;
    tokenCount: number;
    timestamp: string;
  }>> {
    return this.client.get(`scores/collection/${encodeURIComponent(collectionId)}`, options);
  }
  
  /**
   * Get trust score for a creator
   * 
   * @param creatorAddress Creator's blockchain address
   * @param options Request options
   * @returns Creator trust score data
   */
  public async getCreatorScore(creatorAddress: string, options?: RequestOptions): Promise<ApiResponse<{
    creatorAddress: string;
    score: number;
    confidence: number;
    collectionCount: number;
    tokenCount: number;
    timestamp: string;
  }>> {
    return this.client.get(`scores/creator/${encodeURIComponent(creatorAddress)}`, options);
  }
  
  /**
   * Get trust score factors explanation
   * 
   * @param tokenId NFT token ID
   * @param options Request options
   * @returns Trust score factors explanation
   */
  public async getScoreFactors(tokenId: string, options?: RequestOptions): Promise<ApiResponse<{
    tokenId: string;
    factors: {
      name: string;
      score: number;
      weight: number;
      description: string;
    }[];
  }>> {
    return this.client.get(`scores/nft/${encodeURIComponent(tokenId)}/factors`, options);
  }
  
  /**
   * Get trust score history for an NFT
   * 
   * @param tokenId NFT token ID
   * @param options Request options
   * @returns Trust score history data
   */
  public async getScoreHistory(tokenId: string, options?: RequestOptions): Promise<ApiResponse<{
    tokenId: string;
    history: {
      score: number;
      timestamp: string;
    }[];
  }>> {
    return this.client.get(`scores/nft/${encodeURIComponent(tokenId)}/history`, options);
  }
}
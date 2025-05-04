/**
 * hathor.ts
 * 
 * Type definitions for Hathor Network nano contracts integration
 * with the NFT TrustScore system.
 */

import { TrustScoreTypes } from '../types';
import { ExtractedContractData } from '../../blockchain/hathor/extraction/NanoContractExtractor';

/**
 * Extend the NFTInputData interface to include Hathor-specific fields
 */
declare module '../types' {
  namespace TrustScoreTypes {
    interface NFTInputData {
      /**
       * Hathor nano contract ID if this NFT is associated with a nano contract
       */
      hathorContractId?: string;
      
      /**
       * Pre-extracted Hathor contract data if available
       */
      hathorContractData?: ExtractedContractData;
    }
    
    interface NFTTrustScore {
      /**
       * Hathor-specific trust metrics if applicable
       */
      hathorMetrics?: {
        /**
         * Blueprint quality score
         */
        blueprintQuality: number;
        
        /**
         * State consistency score
         */
        stateConsistency: number;
        
        /**
         * Transaction legitimacy score
         */
        transactionLegitimacy: number;
        
        /**
         * Balance legitimacy score
         */
        balanceLegitimacy: number;
      };
    }
  }
}

/**
 * Utility functions for working with Hathor data in trust scores
 */
export const HathorTrustUtils = {
  /**
   * Extract Hathor-specific metrics from a trust score
   * @param trustScore The trust score to extract metrics from
   */
  extractHathorMetrics(trustScore: TrustScoreTypes.NFTTrustScore): {
    hasHathorData: boolean;
    metrics?: TrustScoreTypes.NFTTrustScore['hathorMetrics'];
  } {
    if (!trustScore.hathorMetrics) {
      return { hasHathorData: false };
    }
    
    return {
      hasHathorData: true,
      metrics: trustScore.hathorMetrics
    };
  },
  
  /**
   * Check if an NFT is associated with a Hathor nano contract
   * @param inputData The NFT input data
   */
  isHathorNanoContract(inputData: TrustScoreTypes.NFTInputData): boolean {
    return !!inputData.hathorContractId;
  }
};
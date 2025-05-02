/**
 * JavaScript/TypeScript SDK for NFT TrustScore API
 * 
 * Provides a client library for JavaScript and TypeScript applications
 * to easily integrate with the NFT TrustScore API.
 */

import { NFTTrustScoreClient } from './client';
import { TrustScoreService } from './services/trustScore';
import { PriceIntelligenceService } from './services/priceIntelligence';
import { RiskAssessmentService } from './services/risk';
import { BlockchainDataService } from './services/blockchain';
import { FraudDetectionService } from './services/fraud';

// Export all components
export * from './client';
export * from './services/trustScore';
export * from './services/priceIntelligence';
export * from './services/risk';
export * from './services/blockchain';
export * from './services/fraud';
export * from './types';
export * from './auth';
export * from './utils';

/**
 * JavaScript SDK for NFT TrustScore API
 */
export const javascriptSDK = {
  createClient: (apiKey: string, options?: any) => new NFTTrustScoreClient(apiKey, options),
  services: {
    trustScore: TrustScoreService,
    priceIntelligence: PriceIntelligenceService,
    riskAssessment: RiskAssessmentService,
    blockchainData: BlockchainDataService,
    fraudDetection: FraudDetectionService
  }
};

export default javascriptSDK;
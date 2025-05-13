/**
 * HathorIntegration.ts
 * 
 * Integration module for Hathor Network's nano contracts with the NFT TrustScore engine.
 * This module extends the core TrustScoreEngine with Hathor-specific functionality.
 */

import { TrustScoreEngine } from '../TrustScoreEngine';
import { HathorProvider } from '../../blockchain/hathor/HathorProvider';
import { NanoContractClient } from '../../blockchain/hathor/NanoContractClient';
import { NanoContractExtractor } from '../../blockchain/hathor/NanoContractExtractor';

interface HathorConfig {
  factorWeight?: number;
  providerConfig?: {
    network: string;
    apiUrl: string;
  };
}

interface HathorMetrics {
  blueprintQuality: number;
  stateConsistency: number;
  transactionLegitimacy: number;
  balanceLegitimacy: number;
}

interface TrustScoreWithHathor {
  score: number;
  confidence: number;
  explanation: string;
  factors: Record<string, number>;
  hathorMetrics: HathorMetrics;
  redFlags: string[];
  strengths: string[];
}
export class HathorIntegration {
  private provider: HathorProvider;
  private client: NanoContractClient;
  private extractor: NanoContractExtractor;
  private factorWeight: number;

  constructor(config: HathorConfig = {}) {
    this.factorWeight = config.factorWeight || 0.15;
    this.provider = new HathorProvider(config.providerConfig);
    this.client = new NanoContractClient(this.provider);
    this.extractor = new NanoContractExtractor(this.client);
  }

  public async calculateTrustScore(
    nftId: string,
    data: { tokenId: string; hathorContractId: string }
  ): Promise<TrustScoreWithHathor> {
    const contractData = await this.extractor.extractContractData({
      contractId: data.hathorContractId,
      includeTransactions: true,
      includeBlueprint: true
    });

    const hathorMetrics = contractData.trustAnalysis;
    const hathorScore = this.calculateHathorScore(hathorMetrics);

    return {
      score: hathorScore,
      confidence: 0.9,
      explanation: this.generateExplanation(hathorMetrics),
      factors: {
        blueprintQuality: hathorMetrics.blueprintQuality,
        stateConsistency: hathorMetrics.stateConsistency,
        transactionLegitimacy: hathorMetrics.transactionLegitimacy,
        balanceLegitimacy: hathorMetrics.balanceLegitimacy
      },
      hathorMetrics,
      redFlags: this.identifyRedFlags(hathorMetrics),
      strengths: this.identifyStrengths(hathorMetrics)
    };
  }

  public getExtractor(): NanoContractExtractor {
    return this.extractor;
  }

  private calculateHathorScore(metrics: HathorMetrics): number {
    const weights = {
      blueprintQuality: 0.3,
      stateConsistency: 0.3,
      transactionLegitimacy: 0.2,
      balanceLegitimacy: 0.2
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + metrics[key as keyof HathorMetrics] * weight;
    }, 0) * this.factorWeight;
  }

  private generateExplanation(metrics: HathorMetrics): string {
    const strongest = Object.entries(metrics).reduce((a, b) => 
      metrics[a as keyof HathorMetrics] > metrics[b[0] as keyof HathorMetrics] ? a : b[0]
    );

    return `This NFT shows ${metrics[strongest as keyof HathorMetrics] > 0.8 ? 'excellent' : 'good'} 
      trust characteristics, particularly in ${strongest.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
  }

  private identifyRedFlags(metrics: HathorMetrics): string[] {
    const redFlags: string[] = [];
    if (metrics.blueprintQuality < 0.6) {
      redFlags.push('Low quality or unverified blueprint');
    }
    if (metrics.stateConsistency < 0.6) {
      redFlags.push('Inconsistent contract state');
    }
    if (metrics.transactionLegitimacy < 0.6) {
      redFlags.push('Suspicious transaction patterns');
    }
    if (metrics.balanceLegitimacy < 0.6) {
      redFlags.push('Irregular token balance patterns');
    }
    return redFlags;
  }

  private identifyStrengths(metrics: HathorMetrics): string[] {
    const strengths: string[] = [];
    if (metrics.blueprintQuality > 0.8) {
      strengths.push('High-quality verified blueprint');
    }
    if (metrics.stateConsistency > 0.8) {
      strengths.push('Consistent and reliable contract state');
    }
    if (metrics.transactionLegitimacy > 0.8) {
      strengths.push('Legitimate transaction history');
    }
    if (metrics.balanceLegitimacy > 0.8) {
      strengths.push('Valid token balance management');
    }
    return strengths;
  }
}

export function createHathorEnabledEngine(config: HathorConfig = {}) {
  const hathorIntegration = new HathorIntegration(config);
  const engine = new TrustScoreEngine();
  return { engine, hathorIntegration };
}
import { NanoContractExtractor } from '../../blockchain/hathor/extraction/NanoContractExtractor';
import { TrustScoreTypes } from '../types';
import '../types/hathor'; // Import type extensions

/**
 * Configuration options for Hathor integration
 */
export interface HathorIntegrationConfig {
  /**
   * Weight for the Hathor nano contract factor (default: 0.15)
   */
  factorWeight?: number;
  
  /**
   * Hathor provider configuration
   */
  providerConfig?: {
    network: 'mainnet' | 'testnet' | 'nano-testnet';
    apiUrl: string;
    apiKey?: string;
  };
}

/**
 * Default configuration for Hathor integration
 */
const DEFAULT_CONFIG: HathorIntegrationConfig = {
  factorWeight: 0.15,
  providerConfig: {
    network: 'mainnet',
    apiUrl: 'https://node1.hathor.network/v1a/'
  }
};

/**
 * Extends the TrustScoreEngine with Hathor Network nano contracts support
 */
export class HathorIntegration {
  private engine: TrustScoreEngine;
  private config: HathorIntegrationConfig;
  private provider: HathorProvider;
  private extractor: NanoContractExtractor;
  private factor: HathorNanoContractFactor;
  
  /**
   * Create a new Hathor integration for the trust score engine
   * @param engine The trust score engine to extend
   * @param config Configuration options
   */
  constructor(engine: TrustScoreEngine, config: HathorIntegrationConfig = DEFAULT_CONFIG) {
    this.engine = engine;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      providerConfig: {
        ...DEFAULT_CONFIG.providerConfig,
        ...config.providerConfig
      }
    };
    
    // Initialize Hathor provider
    this.provider = new HathorProvider(this.config.providerConfig!);
    
    // Initialize contract extractor
    this.extractor = new NanoContractExtractor(this.provider);
    
    // Create and register the Hathor factor
    this.factor = new HathorNanoContractFactor(
      this.config.factorWeight!,
      this.config.providerConfig
    );
    
    // Register the factor with the engine
    this.registerFactor();
  }
  
  /**
   * Register the Hathor nano contract factor with the trust score engine
   */
  private registerFactor(): void {
    // Access the engine's factorCalculators map and add our factor
    // Note: This assumes the engine exposes its factorCalculators map
    // If not, this would need to be adapted to the engine's API
    if ((this.engine as any).factorCalculators instanceof Map) {
      (this.engine as any).factorCalculators.set('hathorNanoContract', this.factor);
      console.log('Hathor nano contract factor registered with trust score engine');
    } else {
      console.error('Unable to register Hathor factor: factorCalculators not accessible');
    }
  }
  
  /**
   * Enhance NFT input data with Hathor nano contract data if applicable
   * @param nftId The NFT identifier
   * @param inputData The original input data
   */
  public async enhanceInputData(
    nftId: string,
    inputData: TrustScoreTypes.NFTInputData
  ): Promise<TrustScoreTypes.NFTInputData> {
    // If no Hathor contract ID is provided, return the original data
    if (!inputData.hathorContractId) {
      return inputData;
    }
    
    try {
      // Connect to Hathor Network if not already connected
      if (!this.provider.isActive()) {
        await this.provider.connect();
      }
      
      // Extract contract data
      const contractData = await this.extractor.extractContractData({
        contractId: inputData.hathorContractId,
        includeTransactions: true,
        includeBlueprint: true
      });
      
      // Enhance the input data with the extracted contract data
      return {
        ...inputData,
        hathorContractData: contractData
      };
    } catch (error) {
      console.error('Error enhancing input data with Hathor contract data:', error);
      return inputData;
    }
  }
  
  /**
   * Calculate a trust score with Hathor nano contract integration
   * @param nftId The NFT identifier
   * @param inputData The input data for trust score calculation
   */
  public async calculateTrustScore(
    nftId: string,
    inputData: TrustScoreTypes.NFTInputData
  ): Promise<TrustScoreTypes.NFTTrustScore> {
    // Enhance input data with Hathor contract data if applicable
    const enhancedData = await this.enhanceInputData(nftId, inputData);
    
    // Calculate the trust score using the enhanced data
    const trustScore = await this.engine.calculateNFTTrustScore(nftId, enhancedData);
    
    // If this is a Hathor nano contract, add Hathor-specific metrics
    if (enhancedData.hathorContractData) {
      const { trustAnalysis } = enhancedData.hathorContractData;
      
      // Add Hathor-specific metrics to the trust score
      return {
        ...trustScore,
        hathorMetrics: {
          blueprintQuality: trustAnalysis.blueprintQuality,
          stateConsistency: trustAnalysis.stateConsistency,
          transactionLegitimacy: trustAnalysis.transactionLegitimacy,
          balanceLegitimacy: trustAnalysis.balanceLegitimacy
        }
      };
    }
    
    return trustScore;
  }
  
  /**
   * Get the Hathor provider instance
   */
  public getProvider(): HathorProvider {
    return this.provider;
  }
  
  /**
   * Get the nano contract extractor instance
   */
  public getExtractor(): NanoContractExtractor {
    return this.extractor;
  }
}

/**
 * Factory function to create a Hathor-enabled trust score engine
 * @param config Configuration options for Hathor integration
 */
export function createHathorEnabledEngine(config?: HathorIntegrationConfig): {
  engine: TrustScoreEngine;
  hathorIntegration: HathorIntegration;
} {
  // Create a new trust score engine
  const engine = new TrustScoreEngine();
  
  // Create and initialize the Hathor integration
  const hathorIntegration = new HathorIntegration(engine, config);
  
  return { engine, hathorIntegration };
}
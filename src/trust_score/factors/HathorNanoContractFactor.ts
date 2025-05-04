/**
 * HathorNanoContractFactor.ts
 * 
 * Specialized trust factor for evaluating Hathor Network's nano contracts.
 * This factor analyzes nano contract properties including blueprint quality,
 * state consistency, transaction patterns, and token balances.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';
import { NanoContractExtractor, ExtractedContractData } from '../../blockchain/hathor/extraction/NanoContractExtractor';
import { HathorProvider } from '../../blockchain/hathor/connection/HathorProvider';

/**
 * Trust factor for evaluating Hathor Network's nano contracts
 */
export class HathorNanoContractFactor implements FactorCalculator {
  private weight: number;
  private provider: HathorProvider;
  private extractor: NanoContractExtractor;
  
  /**
   * Create a new Hathor nano contract trust factor
   * @param weight The weight of this factor in the overall trust score
   * @param providerConfig Configuration for the Hathor provider
   */
  constructor(weight: number, providerConfig?: any) {
    this.weight = weight;
    
    // Initialize Hathor provider with default or provided configuration
    this.provider = new HathorProvider(providerConfig || {
      network: 'mainnet',
      apiUrl: 'https://node1.hathor.network/v1a/'
    });
    
    // Initialize the contract extractor
    this.extractor = new NanoContractExtractor(this.provider);
  }
  
  /**
   * Calculate the trust score factor for a nano contract
   * @param inputData Input data for trust score calculation
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Check if this is a Hathor nano contract
    if (!inputData.hathorContractId) {
      return {
        score: 0,
        confidence: 0,
        explanation: 'Not a Hathor nano contract',
        details: {},
        redFlags: [],
        strengths: []
      };
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
      
      // Calculate the factor score
      return this.calculateFactorScore(contractData);
    } catch (error) {
      console.error('Error calculating Hathor nano contract factor:', error);
      
      return {
        score: 0,
        confidence: 0.1,
        explanation: `Error analyzing Hathor nano contract: ${error.message}`,
        details: {},
        redFlags: ['Failed to analyze Hathor nano contract'],
        strengths: []
      };
    }
  }
  
  /**
   * Calculate the factor score based on extracted contract data
   * @param contractData Extracted nano contract data
   */
  private calculateFactorScore(contractData: ExtractedContractData): TrustScoreTypes.FactorScore {
    // Extract trust analysis from the contract data
    const { trustAnalysis } = contractData;
    
    // Calculate weighted average of trust metrics
    const blueprintWeight = 0.3; // 30% weight for blueprint quality
    const stateWeight = 0.2;     // 20% weight for state consistency
    const transactionWeight = 0.3; // 30% weight for transaction legitimacy
    const balanceWeight = 0.2;    // 20% weight for balance legitimacy
    
    const weightedScore = (
      (trustAnalysis.blueprintQuality * blueprintWeight) +
      (trustAnalysis.stateConsistency * stateWeight) +
      (trustAnalysis.transactionLegitimacy * transactionWeight) +
      (trustAnalysis.balanceLegitimacy * balanceWeight)
    );
    
    // Calculate confidence based on transaction count and data availability
    let confidence = 0.5; // Base confidence
    
    if (contractData.transactionCount > 50) {
      confidence = 0.9; // High confidence with many transactions
    } else if (contractData.transactionCount > 10) {
      confidence = 0.7; // Medium confidence
    } else if (contractData.transactionCount === 0) {
      confidence = 0.3; // Low confidence with no transactions
    }
    
    // Generate explanation
    const explanation = this.generateExplanation(contractData);
    
    // Prepare details object
    const details = {
      blueprintId: contractData.blueprintId,
      blueprintName: contractData.blueprintName,
      blueprintType: contractData.blueprintType,
      transactionCount: contractData.transactionCount,
      creationDate: contractData.creationDate,
      lastActivityDate: contractData.lastActivityDate,
      trustMetrics: {
        blueprintQuality: trustAnalysis.blueprintQuality,
        stateConsistency: trustAnalysis.stateConsistency,
        transactionLegitimacy: trustAnalysis.transactionLegitimacy,
        balanceLegitimacy: trustAnalysis.balanceLegitimacy
      }
    };
    
    return {
      score: weightedScore,
      confidence,
      explanation,
      details,
      redFlags: trustAnalysis.riskIndicators,
      strengths: trustAnalysis.strengths
    };
  }
  
  /**
   * Generate a human-readable explanation of the trust score
   * @param contractData Extracted nano contract data
   */
  private generateExplanation(contractData: ExtractedContractData): string {
    const { trustAnalysis } = contractData;
    
    // Determine the overall quality description
    let qualityDescription = 'moderate';
    const averageScore = (
      trustAnalysis.blueprintQuality +
      trustAnalysis.stateConsistency +
      trustAnalysis.transactionLegitimacy +
      trustAnalysis.balanceLegitimacy
    ) / 4;
    
    if (averageScore >= 0.8) {
      qualityDescription = 'excellent';
    } else if (averageScore >= 0.6) {
      qualityDescription = 'good';
    } else if (averageScore <= 0.3) {
      qualityDescription = 'poor';
    }
    
    // Generate blueprint description
    const blueprintDescription = contractData.blueprintType === 'built-in' ?
      `official built-in blueprint "${contractData.blueprintName}"` :
      `custom blueprint "${contractData.blueprintName}"`;
    
    // Generate transaction description
    let transactionDescription = 'no transaction history';
    if (contractData.transactionCount > 0) {
      transactionDescription = `${contractData.transactionCount} transactions`;
      if (contractData.transactionSummary) {
        transactionDescription += ` with ${contractData.transactionSummary.uniqueInteractors} unique interactors`;
      }
    }
    
    // Construct the explanation
    return `This Hathor nano contract shows ${qualityDescription} trust characteristics. ` +
      `It uses ${blueprintDescription} and has ${transactionDescription}. ` +
      `Created on ${new Date(contractData.creationDate).toLocaleDateString()}, ` +
      `with last activity on ${new Date(contractData.lastActivityDate).toLocaleDateString()}.`;
  }
  
  /**
   * Get the weight of this factor
   */
  public getWeight(): number {
    return this.weight;
  }
}
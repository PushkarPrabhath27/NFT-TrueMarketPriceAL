/**
 * NanoContractExtractor.ts
 * 
 * Extracts and processes nano contract data from Hathor Network.
 * This module is responsible for gathering all relevant data about
 * nano contracts that will be used in trust score calculations.
 */

import { HathorProvider } from '../connection/HathorProvider';
import { NanoContractClient, NanoContract } from '../connection/NanoContractClient';

/**
 * Input parameters for contract data extraction
 */
export interface ExtractionParams {
  contractId: string;
  includeTransactions?: boolean;
  transactionLimit?: number;
  includeBlueprint?: boolean;
}

/**
 * Extracted data structure for trust score calculation
 */
export interface ExtractedContractData {
  contractId: string;
  blueprintId: string;
  blueprintName: string;
  blueprintType: 'built-in' | 'custom';
  state: Record<string, any>;
  balance: {
    HTR: string;
    tokens: Record<string, string>;
  };
  transactionCount: number;
  transactionSummary?: {
    methodCalls: Record<string, number>;
    depositCount: number;
    withdrawalCount: number;
    uniqueInteractors: number;
  };
  creationDate: string;
  lastActivityDate: string;
  trustAnalysis: {
    blueprintQuality: number;
    stateConsistency: number;
    transactionLegitimacy: number;
    balanceLegitimacy: number;
    riskIndicators: string[];
    strengths: string[];
  };
}

/**
 * Extracts and processes nano contract data for trust score calculation
 */
export class NanoContractExtractor {
  private provider: HathorProvider;
  private client: NanoContractClient;
  
  /**
   * Create a new nano contract extractor
   * @param provider The Hathor provider to use for blockchain interactions
   */
  constructor(provider: HathorProvider) {
    this.provider = provider;
    this.client = new NanoContractClient(provider);
  }
  
  /**
   * Extract all relevant data for a nano contract
   * @param params Parameters for the extraction process
   */
  public async extractContractData(params: ExtractionParams): Promise<ExtractedContractData> {
    // Ensure provider is connected
    if (!this.provider.isActive()) {
      await this.provider.connect();
    }
    
    // Get the full contract data
    const contract = await this.client.getContract(params.contractId);
    
    // Analyze the contract for trust factors
    const trustAnalysis = await this.client.analyzeContractTrust(params.contractId);
    
    // Process transaction data if available
    const transactionSummary = contract.transactions ? 
      this.summarizeTransactions(contract) : undefined;
    
    // Determine the last activity date
    const lastActivityDate = contract.transactions && contract.transactions.length > 0 ?
      contract.transactions[0].timestamp : contract.createdAt;
    
    // Construct the extracted data
    return {
      contractId: contract.id,
      blueprintId: contract.blueprintId,
      blueprintName: contract.blueprint?.name || 'Unknown',
      blueprintType: contract.blueprint?.isBuiltIn ? 'built-in' : 'custom',
      state: contract.state,
      balance: contract.balance,
      transactionCount: contract.transactions?.length || 0,
      transactionSummary,
      creationDate: contract.createdAt,
      lastActivityDate,
      trustAnalysis: {
        blueprintQuality: trustAnalysis.trustFactors.blueprintQuality || 0.5,
        stateConsistency: trustAnalysis.trustFactors.stateConsistency || 0.5,
        transactionLegitimacy: trustAnalysis.trustFactors.transactionLegitimacy || 0.5,
        balanceLegitimacy: trustAnalysis.trustFactors.balanceLegitimacy || 0.5,
        riskIndicators: trustAnalysis.riskIndicators,
        strengths: trustAnalysis.strengths
      }
    };
  }
  
  /**
   * Summarize transaction data for a contract
   * @param contract The nano contract with transaction data
   */
  private summarizeTransactions(contract: NanoContract): {
    methodCalls: Record<string, number>;
    depositCount: number;
    withdrawalCount: number;
    uniqueInteractors: number;
  } {
    // Initialize counters
    const methodCalls: Record<string, number> = {};
    let depositCount = 0;
    let withdrawalCount = 0;
    const interactors = new Set<string>();
    
    // Process each transaction
    for (const tx of contract.transactions) {
      // Count method calls
      if (tx.method) {
        methodCalls[tx.method] = (methodCalls[tx.method] || 0) + 1;
      }
      
      // Count deposits and withdrawals
      depositCount += tx.deposits?.length || 0;
      withdrawalCount += tx.withdrawals?.length || 0;
      
      // Track unique interactors (would need sender information from actual implementation)
      // This is a placeholder for the actual implementation
      if (tx.id) {
        interactors.add(tx.id);
      }
    }
    
    return {
      methodCalls,
      depositCount,
      withdrawalCount,
      uniqueInteractors: interactors.size
    };
  }
}
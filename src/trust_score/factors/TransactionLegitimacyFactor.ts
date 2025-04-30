/**
 * TransactionLegitimacyFactor.ts
 * 
 * Implementation of the Transaction Legitimacy Factor calculator.
 * This factor evaluates the legitimacy of an NFT's transaction history,
 * looking for patterns that might indicate wash trading or price manipulation.
 * It accounts for 20% of the overall trust score.
 */

import { FactorCalculator } from './FactorCalculator';
import { TrustScoreTypes } from '../types';

/**
 * Calculates the Transaction Legitimacy Factor score for NFTs based on transaction patterns.
 */
export class TransactionLegitimacyFactor implements FactorCalculator {
  /**
   * The weight of this factor in the overall trust score (20%)
   */
  public readonly weight: number;

  /**
   * Initialize the Transaction Legitimacy Factor calculator with its weight
   * 
   * @param weight The weight of this factor in the overall trust score
   */
  constructor(weight: number = 0.20) {
    this.weight = weight;
  }

  /**
   * Calculate the transaction legitimacy score based on transaction history
   * 
   * @param inputData The NFT data including transaction history
   * @returns A factor score with confidence metrics and explanations
   */
  public async calculate(inputData: TrustScoreTypes.NFTInputData): Promise<TrustScoreTypes.FactorScore> {
    // Default values for when no transaction data is available
    let score = 50; // Neutral score
    let confidence = 0.3; // Low confidence without data
    let explanation = "Limited transaction history available. Score represents neutral assessment with low confidence.";
    const details: Record<string, any> = {};
    
    // Process transaction history if available
    if (inputData.transactionHistory && inputData.transactionHistory.length > 0) {
      const transactions = inputData.transactionHistory;
      
      // Calculate various metrics for transaction legitimacy
      const metrics = this.calculateTransactionMetrics(transactions);
      details.metrics = metrics;
      
      // Detect potential wash trading
      const washTradingScore = this.detectWashTrading(transactions, metrics);
      details.washTradingScore = washTradingScore;
      
      // Detect price manipulation
      const priceManipulationScore = this.detectPriceManipulation(transactions, metrics);
      details.priceManipulationScore = priceManipulationScore;
      
      // Evaluate wallet relationships
      const walletRelationshipScore = this.evaluateWalletRelationships(transactions);
      details.walletRelationshipScore = walletRelationshipScore;
      
      // Calculate overall legitimacy score (higher is better)
      score = Math.round((
        washTradingScore * 0.4 + 
        priceManipulationScore * 0.4 + 
        walletRelationshipScore * 0.2
      ) * 100);
      
      // Calculate confidence based on transaction volume and history
      confidence = this.calculateConfidence(inputData, metrics);
      
      // Generate explanation
      if (score >= 90) {
        explanation = `Transaction history appears highly legitimate with no signs of wash trading or price manipulation.`;
      } else if (score >= 70) {
        explanation = `Transaction history shows good legitimacy with only minor anomalies.`;
      } else if (score >= 50) {
        explanation = `Transaction history shows moderate legitimacy with some concerning patterns.`;
      } else if (score >= 30) {
        explanation = `Transaction history shows questionable legitimacy with several suspicious patterns.`;
      } else {
        explanation = `Transaction history shows poor legitimacy with strong indicators of wash trading or price manipulation.`;
      }
      
      // Add specific details to explanation if significant issues were found
      if (washTradingScore < 0.5) {
        explanation += ` Potential wash trading detected between related wallets.`;
      }
      
      if (priceManipulationScore < 0.5) {
        explanation += ` Suspicious price patterns suggest potential manipulation.`;
      }
    }
    
    // Identify red flags and strengths
    const redFlags = this.identifyRedFlags(inputData, score);
    const strengths = this.identifyStrengths(inputData, score);
    
    return {
      score,
      confidence,
      explanation,
      details,
      redFlags,
      strengths
    };
  }

  /**
   * Calculate various metrics from transaction history
   * 
   * @param transactions Array of transactions to analyze
   * @returns Object containing calculated metrics
   */
  private calculateTransactionMetrics(transactions: TrustScoreTypes.Transaction[]): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    // Sort transactions by timestamp
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Count unique wallets involved
    const uniqueWallets = new Set<string>();
    transactions.forEach(tx => {
      uniqueWallets.add(tx.fromAddress);
      uniqueWallets.add(tx.toAddress);
    });
    metrics.uniqueWalletCount = uniqueWallets.size;
    
    // Calculate transaction frequency
    if (sortedTransactions.length >= 2) {
      const firstDate = new Date(sortedTransactions[0].timestamp).getTime();
      const lastDate = new Date(sortedTransactions[sortedTransactions.length - 1].timestamp).getTime();
      const daysDifference = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      metrics.transactionsPerDay = daysDifference > 0 ? transactions.length / daysDifference : transactions.length;
    } else {
      metrics.transactionsPerDay = 0;
    }
    
    // Calculate price changes
    metrics.priceChanges = [];
    for (let i = 1; i < sortedTransactions.length; i++) {
      const prevValue = parseFloat(sortedTransactions[i-1].value);
      const currValue = parseFloat(sortedTransactions[i].value);
      if (prevValue > 0 && currValue > 0) {
        const percentChange = ((currValue - prevValue) / prevValue) * 100;
        metrics.priceChanges.push({
          fromTx: sortedTransactions[i-1].transactionHash,
          toTx: sortedTransactions[i].transactionHash,
          percentChange,
          timeDiffHours: (new Date(sortedTransactions[i].timestamp).getTime() - 
                         new Date(sortedTransactions[i-1].timestamp).getTime()) / (1000 * 60 * 60)
        });
      }
    }
    
    // Calculate circular transaction patterns
    metrics.circularPatterns = this.detectCircularPatterns(sortedTransactions);
    
    return metrics;
  }

  /**
   * Detect potential wash trading based on transaction patterns
   * 
   * @param transactions Array of transactions to analyze
   * @param metrics Pre-calculated transaction metrics
   * @returns Score between 0-1 where 1 is no wash trading detected
   */
  private detectWashTrading(
    transactions: TrustScoreTypes.Transaction[], 
    metrics: Record<string, any>
  ): number {
    let washTradingScore = 1.0; // Start with perfect score
    
    // Few unique wallets relative to transaction count is suspicious
    const walletRatio = metrics.uniqueWalletCount / transactions.length;
    if (walletRatio < 0.5 && transactions.length > 3) {
      washTradingScore -= 0.3 * (1 - walletRatio);
    }
    
    // Circular transaction patterns are highly suspicious
    if (metrics.circularPatterns && metrics.circularPatterns.length > 0) {
      washTradingScore -= 0.2 * Math.min(1, metrics.circularPatterns.length / 2);
    }
    
    // Unusually high transaction frequency is suspicious
    if (metrics.transactionsPerDay > 3) {
      washTradingScore -= 0.1 * Math.min(1, (metrics.transactionsPerDay - 3) / 7);
    }
    
    // Ensure score stays between 0 and 1
    return Math.max(0, Math.min(1, washTradingScore));
  }

  /**
   * Detect potential price manipulation based on transaction patterns
   * 
   * @param transactions Array of transactions to analyze
   * @param metrics Pre-calculated transaction metrics
   * @returns Score between 0-1 where 1 is no price manipulation detected
   */
  private detectPriceManipulation(
    transactions: TrustScoreTypes.Transaction[], 
    metrics: Record<string, any>
  ): number {
    let manipulationScore = 1.0; // Start with perfect score
    
    // Check for extreme price changes in short time periods
    if (metrics.priceChanges && metrics.priceChanges.length > 0) {
      let extremeChangesCount = 0;
      
      metrics.priceChanges.forEach((change: any) => {
        // Price change > 100% in less than 24 hours is suspicious
        if (Math.abs(change.percentChange) > 100 && change.timeDiffHours < 24) {
          extremeChangesCount++;
        }
      });
      
      if (extremeChangesCount > 0) {
        manipulationScore -= 0.2 * Math.min(1, extremeChangesCount / 2);
      }
      
      // Check for price patterns that go up quickly then down quickly (pump and dump)
      let pumpAndDumpPatterns = 0;
      for (let i = 1; i < metrics.priceChanges.length - 1; i++) {
        const prevChange = metrics.priceChanges[i-1].percentChange;
        const currChange = metrics.priceChanges[i].percentChange;
        
        if (prevChange > 50 && currChange < -30) {
          pumpAndDumpPatterns++;
        }
      }
      
      if (pumpAndDumpPatterns > 0) {
        manipulationScore -= 0.3 * Math.min(1, pumpAndDumpPatterns);
      }
    }
    
    // Ensure score stays between 0 and 1
    return Math.max(0, Math.min(1, manipulationScore));
  }

  /**
   * Evaluate wallet relationships to identify connected parties
   * 
   * @param transactions Array of transactions to analyze
   * @returns Score between 0-1 where 1 is no suspicious relationships
   */
  private evaluateWalletRelationships(transactions: TrustScoreTypes.Transaction[]): number {
    let relationshipScore = 1.0; // Start with perfect score
    
    // Build a graph of wallet interactions
    const walletInteractions: Record<string, Set<string>> = {};
    
    transactions.forEach(tx => {
      if (!walletInteractions[tx.fromAddress]) {
        walletInteractions[tx.fromAddress] = new Set<string>();
      }
      walletInteractions[tx.fromAddress].add(tx.toAddress);
    });
    
    // Check for wallets that frequently trade with each other
    const frequentPairs: Array<[string, string, number]> = [];
    
    for (const [fromWallet, toWallets] of Object.entries(walletInteractions)) {
      for (const toWallet of toWallets) {
        // Count transactions between this pair
        const transactionCount = transactions.filter(
          tx => tx.fromAddress === fromWallet && tx.toAddress === toWallet
        ).length;
        
        if (transactionCount > 1) {
          frequentPairs.push([fromWallet, toWallet, transactionCount]);
        }
      }
    }
    
    // Penalize score based on frequent trading pairs
    if (frequentPairs.length > 0) {
      // Sort by transaction count (highest first)
      frequentPairs.sort((a, b) => b[2] - a[2]);
      
      // More penalty for more frequent pairs
      relationshipScore -= 0.15 * Math.min(1, frequentPairs.length / 3);
      
      // Additional penalty for very high frequency pairs
      if (frequentPairs[0][2] > 3) {
        relationshipScore -= 0.2 * Math.min(1, (frequentPairs[0][2] - 3) / 5);
      }
    }
    
    // Ensure score stays between 0 and 1
    return Math.max(0, Math.min(1, relationshipScore));
  }

  /**
   * Detect circular transaction patterns (A->B->C->A)
   * 
   * @param transactions Sorted array of transactions to analyze
   * @returns Array of detected circular patterns
   */
  private detectCircularPatterns(transactions: TrustScoreTypes.Transaction[]): any[] {
    const patterns: any[] = [];
    
    // Build a directed graph of wallet transactions
    const graph: Record<string, string[]> = {};
    
    transactions.forEach(tx => {
      if (!graph[tx.fromAddress]) {
        graph[tx.fromAddress] = [];
      }
      graph[tx.fromAddress].push(tx.toAddress);
    });
    
    // Check for cycles of length 3 or 4 (common in wash trading)
    for (const startWallet of Object.keys(graph)) {
      this.findCycles(graph, startWallet, [startWallet], new Set<string>(), patterns, 4);
    }
    
    return patterns;
  }

  /**
   * Recursive helper to find cycles in the transaction graph
   */
  private findCycles(
    graph: Record<string, string[]>,
    currentWallet: string,
    path: string[],
    visited: Set<string>,
    results: any[],
    maxDepth: number
  ): void {
    if (path.length > maxDepth) return;
    
    const neighbors = graph[currentWallet] || [];
    
    for (const neighbor of neighbors) {
      // Found a cycle
      if (neighbor === path[0] && path.length >= 3) {
        results.push([...path, neighbor]);
        continue;
      }
      
      // Avoid revisiting wallets in current path
      if (path.includes(neighbor)) continue;
      
      // Continue DFS
      this.findCycles(graph, neighbor, [...path, neighbor], visited, results, maxDepth);
    }
  }

  /**
   * Get a detailed explanation of how the transaction legitimacy factor is calculated
   * 
   * @returns A human-readable explanation of the factor calculation
   */
  public getExplanation(): string {
    return `The Transaction Legitimacy Factor evaluates the authenticity of an NFT's trading history. It analyzes transaction patterns to detect potential wash trading (artificial trading to create false volume), identifies suspicious price manipulation, and examines wallet relationships to spot connected parties. Higher scores indicate more legitimate transaction histories with no suspicious patterns. This factor accounts for 20% of the overall trust score.`;
  }

  /**
   * Calculate confidence in the transaction legitimacy score based on data completeness
   * 
   * @param inputData The NFT data used for calculation
   * @param metrics Pre-calculated transaction metrics
   * @returns An adjusted confidence value (0-1)
   */
  public calculateConfidence(inputData: TrustScoreTypes.NFTInputData, metrics?: Record<string, any>): number {
    // Start with a base confidence
    let confidence = 0.5;
    
    // No transaction history means low confidence
    if (!inputData.transactionHistory || inputData.transactionHistory.length === 0) {
      return 0.3;
    }
    
    const transactions = inputData.transactionHistory;
    
    // More transactions increase confidence
    const transactionCount = transactions.length;
    const transactionFactor = Math.min(1, transactionCount / 10); // Max out at 10 transactions
    
    // Adjust confidence based on transaction count
    confidence = confidence * 0.6 + transactionFactor * 0.4;
    
    // Age of the NFT affects confidence (newer NFTs have had less time for transactions)
    const creationDate = new Date(inputData.creationTimestamp);
    const now = new Date();
    const ageInDays = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
    const ageFactor = Math.min(1, ageInDays / 30); // Max out at 30 days
    
    // Adjust confidence based on age
    confidence = confidence * 0.7 + ageFactor * 0.3;
    
    return Math.min(1, Math.max(0.1, confidence)); // Ensure confidence is between 0.1 and 1
  }

  /**
   * Identify red flags related to transaction legitimacy
   * 
   * @param inputData The NFT data used for calculation
   * @param score The calculated transaction legitimacy score
   * @returns An array of red flags, if any
   */
  public identifyRedFlags(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.RedFlag[] {
    const redFlags: TrustScoreTypes.RedFlag[] = [];
    
    // No transaction history is a minor red flag
    if (!inputData.transactionHistory || inputData.transactionHistory.length === 0) {
      redFlags.push({
        severity: 'low',
        description: 'No transaction history available',
        evidence: 'Unable to verify transaction legitimacy due to missing transaction data.'
      });
      return redFlags;
    }
    
    const transactions = inputData.transactionHistory;
    
    // Very low score indicates serious issues
    if (score < 30) {
      redFlags.push({
        severity: 'high',
        description: 'Highly suspicious transaction patterns',
        evidence: 'Multiple indicators of potential wash trading or price manipulation detected.'
      });
    } else if (score < 50) {
      redFlags.push({
        severity: 'medium',
        description: 'Questionable transaction patterns',
        evidence: 'Some indicators of potential market manipulation detected.'
      });
    }
    
    // Few unique wallets relative to transaction count
    const uniqueWallets = new Set<string>();
    transactions.forEach(tx => {
      uniqueWallets.add(tx.fromAddress);
      uniqueWallets.add(tx.toAddress);
    });
    
    if (uniqueWallets.size < transactions.length * 0.4 && transactions.length > 3) {
      redFlags.push({
        severity: 'medium',
        description: 'Limited wallet diversity',
        evidence: `Only ${uniqueWallets.size} unique wallets involved in ${transactions.length} transactions.`
      });
    }
    
    // Check for extreme price volatility
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (let i = 1; i < sortedTransactions.length; i++) {
      const prevValue = parseFloat(sortedTransactions[i-1].value);
      const currValue = parseFloat(sortedTransactions[i].value);
      
      if (prevValue > 0 && currValue > 0) {
        const percentChange = ((currValue - prevValue) / prevValue) * 100;
        const timeDiffHours = (new Date(sortedTransactions[i].timestamp).getTime() - 
                             new Date(sortedTransactions[i-1].timestamp).getTime()) / (1000 * 60 * 60);
        
        if (Math.abs(percentChange) > 200 && timeDiffHours < 24) {
          redFlags.push({
            severity: 'medium',
            description: 'Extreme price volatility',
            evidence: `Price changed by ${percentChange.toFixed(1)}% within ${timeDiffHours.toFixed(1)} hours.`
          });
          break; // Only report one instance of extreme volatility
        }
      }
    }
    
    return redFlags;
  }

  /**
   * Identify strengths related to transaction legitimacy
   * 
   * @param inputData The NFT data used for calculation
   * @param score The calculated transaction legitimacy score
   * @returns An array of strengths, if any
   */
  public identifyStrengths(inputData: TrustScoreTypes.NFTInputData, score: number): TrustScoreTypes.Strength[] {
    const strengths: TrustScoreTypes.Strength[] = [];
    
    // No transaction history means we can't identify strengths
    if (!inputData.transactionHistory || inputData.transactionHistory.length === 0) {
      return strengths;
    }
    
    const transactions = inputData.transactionHistory;
    
    // High legitimacy score is a strength
    if (score >= 90) {
      strengths.push({
        significance: 'high',
        description: 'Highly legitimate transaction history',
        evidence: 'No suspicious patterns detected across all transactions.'
      });
    } else if (score >= 75) {
      strengths.push({
        significance: 'medium',
        description: 'Good transaction legitimacy',
        evidence: 'Minimal suspicious patterns in transaction history.'
      });
    }
    
    // Diverse set of wallets is a strength
    const uniqueWallets = new Set<string>();
    transactions.forEach(tx => {
      uniqueWallets.add(tx.fromAddress);
      uniqueWallets.add(tx.toAddress);
    });
    
    if (uniqueWallets.size > transactions.length * 0.8 && transactions.length > 3) {
      strengths.push({
        significance: 'medium',
        description: 'High wallet diversity',
        evidence: `${uniqueWallets.size} unique wallets involved in ${transactions.length} transactions.`
      });
    }
    
    // Consistent, non-volatile price growth is a strength
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    if (sortedTransactions.length >= 3) {
      let stableGrowth = true;
      let consistentDirection = true;
      let previousChange = 0;
      
      for (let i = 1; i < sortedTransactions.length; i++) {
        const prevValue = parseFloat(sortedTransactions[i-1].value);
        const currValue = parseFloat(sortedTransactions[i].value);
        
        if (prevValue > 0 && currValue > 0) {
          const percentChange = ((currValue - prevValue) / prevValue) * 100;
          
          // Check for extreme changes
          if (Math.abs(percentChange) > 100) {
            stableGrowth = false;
          }
          
          // Check for consistent direction (all positive or all negative)
          if (i > 1 && (previousChange * percentChange < 0)) {
            consistentDirection = false;
          }
          
          previousChange = percentChange;
        }
      }
      
      if (stableGrowth && consistentDirection && previousChange > 0) {
        strengths.push({
          significance: 'medium',
          description: 'Stable price appreciation',
          evidence: 'Consistent, non-volatile price growth across transactions.'
        });
      }
    }
    
    return strengths;
  }
}
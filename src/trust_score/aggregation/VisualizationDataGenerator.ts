/**
 * VisualizationDataGenerator.ts
 * 
 * Generates visualization-ready data structures for trust scores
 * to be used in UI components and dashboards.
 */

import { TrustScoreTypes } from '../types';

/**
 * Responsible for creating visualization-ready data structures from trust scores
 */
export class VisualizationDataGenerator {
  /**
   * Generate visualization data for an NFT trust score
   * 
   * @param factorScores Map of factor scores
   * @param weights Map of factor weights
   * @param overallScore The overall trust score
   * @returns Visualization-ready data structures
   */
  public generateForNFT(
    factorScores: Map<string, TrustScoreTypes.FactorScore>,
    weights: Map<string, number>,
    overallScore: number
  ): Record<string, any> {
    return {
      radarChart: this.generateRadarChartData(factorScores),
      weightedContribution: this.generateWeightedContributionData(factorScores, weights),
      scoreGauge: this.generateScoreGaugeData(overallScore),
      redFlagBreakdown: this.generateRedFlagBreakdownData(factorScores),
      strengthBreakdown: this.generateStrengthBreakdownData(factorScores),
      confidenceIndicators: this.generateConfidenceIndicatorsData(factorScores)
    };
  }

  /**
   * Generate radar chart data for visualizing factor scores
   * 
   * @param factorScores Map of factor scores
   * @returns Radar chart data structure
   */
  private generateRadarChartData(
    factorScores: Map<string, TrustScoreTypes.FactorScore>
  ): {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      confidence: number[];
    }>;
  } {
    const labels: string[] = [];
    const data: number[] = [];
    const confidence: number[] = [];
    
    // Extract data from factor scores
    for (const [factor, score] of factorScores.entries()) {
      labels.push(factor);
      data.push(score.score);
      confidence.push(score.confidence);
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Factor Scores',
          data,
          confidence
        }
      ]
    };
  }

  /**
   * Generate weighted contribution data for visualizing factor contributions
   * 
   * @param factorScores Map of factor scores
   * @param weights Map of factor weights
   * @returns Weighted contribution data structure
   */
  private generateWeightedContributionData(
    factorScores: Map<string, TrustScoreTypes.FactorScore>,
    weights: Map<string, number>
  ): {
    labels: string[];
    contributions: number[];
    weights: number[];
  } {
    const labels: string[] = [];
    const contributions: number[] = [];
    const weightValues: number[] = [];
    
    // Calculate weighted contributions
    for (const [factor, score] of factorScores.entries()) {
      const weight = weights.get(factor) || 0;
      const contribution = score.score * weight;
      
      labels.push(factor);
      contributions.push(contribution);
      weightValues.push(weight);
    }
    
    return {
      labels,
      contributions,
      weights: weightValues
    };
  }

  /**
   * Generate score gauge data for visualizing the overall score
   * 
   * @param overallScore The overall trust score
   * @returns Score gauge data structure
   */
  private generateScoreGaugeData(overallScore: number): {
    score: number;
    zones: Array<{
      min: number;
      max: number;
      label: string;
      color: string;
    }>;
  } {
    return {
      score: overallScore,
      zones: [
        { min: 0, max: 40, label: 'Low Trust', color: '#ff4d4d' },
        { min: 40, max: 60, label: 'Moderate Trust', color: '#ffcc00' },
        { min: 60, max: 75, label: 'Good Trust', color: '#66cc66' },
        { min: 75, max: 90, label: 'High Trust', color: '#33cc33' },
        { min: 90, max: 100, label: 'Excellent Trust', color: '#00b300' }
      ]
    };
  }

  /**
   * Generate red flag breakdown data for visualizing concerns
   * 
   * @param factorScores Map of factor scores
   * @returns Red flag breakdown data structure
   */
  private generateRedFlagBreakdownData(
    factorScores: Map<string, TrustScoreTypes.FactorScore>
  ): {
    byFactor: Record<string, number>;
    bySeverity: Record<string, number>;
    details: Array<{
      factor: string;
      severity: string;
      description: string;
    }>;
  } {
    const byFactor: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0
    };
    const details: Array<{
      factor: string;
      severity: string;
      description: string;
    }> = [];
    
    // Process red flags from all factors
    for (const [factor, score] of factorScores.entries()) {
      byFactor[factor] = score.redFlags.length;
      
      for (const flag of score.redFlags) {
        bySeverity[flag.severity]++;
        
        details.push({
          factor,
          severity: flag.severity,
          description: flag.description
        });
      }
    }
    
    return {
      byFactor,
      bySeverity,
      details
    };
  }

  /**
   * Generate strength breakdown data for visualizing positive aspects
   * 
   * @param factorScores Map of factor scores
   * @returns Strength breakdown data structure
   */
  private generateStrengthBreakdownData(
    factorScores: Map<string, TrustScoreTypes.FactorScore>
  ): {
    byFactor: Record<string, number>;
    bySignificance: Record<string, number>;
    details: Array<{
      factor: string;
      significance: string;
      description: string;
    }>;
  } {
    const byFactor: Record<string, number> = {};
    const bySignificance: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0
    };
    const details: Array<{
      factor: string;
      significance: string;
      description: string;
    }> = [];
    
    // Process strengths from all factors
    for (const [factor, score] of factorScores.entries()) {
      byFactor[factor] = score.strengths.length;
      
      for (const strength of score.strengths) {
        bySignificance[strength.significance]++;
        
        details.push({
          factor,
          significance: strength.significance,
          description: strength.description
        });
      }
    }
    
    return {
      byFactor,
      bySignificance,
      details
    };
  }

  /**
   * Generate confidence indicators data for visualizing confidence levels
   * 
   * @param factorScores Map of factor scores
   * @returns Confidence indicators data structure
   */
  private generateConfidenceIndicatorsData(
    factorScores: Map<string, TrustScoreTypes.FactorScore>
  ): {
    byFactor: Record<string, number>;
    average: number;
    indicators: Array<{
      factor: string;
      confidence: number;
      status: 'low' | 'medium' | 'high';
    }>;
  } {
    const byFactor: Record<string, number> = {};
    let confidenceSum = 0;
    const indicators: Array<{
      factor: string;
      confidence: number;
      status: 'low' | 'medium' | 'high';
    }> = [];
    
    // Process confidence values from all factors
    for (const [factor, score] of factorScores.entries()) {
      byFactor[factor] = score.confidence;
      confidenceSum += score.confidence;
      
      // Determine confidence status
      let status: 'low' | 'medium' | 'high';
      if (score.confidence < 0.4) {
        status = 'low';
      } else if (score.confidence < 0.7) {
        status = 'medium';
      } else {
        status = 'high';
      }
      
      indicators.push({
        factor,
        confidence: score.confidence,
        status
      });
    }
    
    // Calculate average confidence
    const average = factorScores.size > 0 ? confidenceSum / factorScores.size : 0;
    
    return {
      byFactor,
      average,
      indicators
    };
  }
}
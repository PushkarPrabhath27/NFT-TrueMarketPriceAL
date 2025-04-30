/**
 * Factor Analysis Service
 * 
 * Provides business logic for retrieving detailed factor analysis
 * for NFTs, creators, and collections.
 */

import { TrustFactorAnalyzer } from '../../analysis/TrustFactorAnalyzer';
import { RedFlagDetector } from '../../analysis/RedFlagDetector';
import { StrengthIdentifier } from '../../analysis/StrengthIdentifier';
import { ConfidenceCalculator } from '../../analysis/ConfidenceCalculator';

// Types for service responses
export interface FactorAnalysisResponse {
  tokenId?: string;
  address?: string;
  collectionId?: string;
  factors: FactorDetail[];
  redFlags: RedFlag[];
  strengths: Strength[];
  confidence: number;
  timestamp: string;
}

export interface FactorDetail {
  id: string;
  name: string;
  score: number;
  weight: number;
  confidence: number;
  explanation: string;
  comparisonToAverage?: number; // Percentage above/below average
  trend?: 'improving' | 'stable' | 'declining';
  visualizationData?: Record<string, any>;
}

export interface RedFlag {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  affectedFactors: string[];
  timestamp: string;
}

export interface Strength {
  id: string;
  significance: 'minor' | 'moderate' | 'major' | 'exceptional';
  description: string;
  evidence: string;
  affectedFactors: string[];
  timestamp: string;
}

/**
 * Service for retrieving factor analysis data
 */
export class FactorAnalysisService {
  private factorAnalyzer: TrustFactorAnalyzer;
  private redFlagDetector: RedFlagDetector;
  private strengthIdentifier: StrengthIdentifier;
  private confidenceCalculator: ConfidenceCalculator;

  constructor() {
    this.factorAnalyzer = new TrustFactorAnalyzer();
    this.redFlagDetector = new RedFlagDetector();
    this.strengthIdentifier = new StrengthIdentifier();
    this.confidenceCalculator = new ConfidenceCalculator();
  }

  /**
   * Get detailed factor analysis for a specific NFT
   * @param tokenId - NFT token ID
   * @returns Factor analysis response
   */
  public async getNftFactorAnalysis(tokenId: string): Promise<FactorAnalysisResponse | null> {
    try {
      // Get factor analysis from analyzer
      const factorAnalysis = await this.factorAnalyzer.analyzeNft(tokenId);
      
      if (!factorAnalysis) {
        return null;
      }

      // Get red flags and strengths
      const redFlags = await this.redFlagDetector.detectForNft(tokenId);
      const strengths = await this.strengthIdentifier.identifyForNft(tokenId);
      
      // Calculate overall confidence
      const confidence = this.confidenceCalculator.calculateForNft(tokenId);

      return {
        tokenId,
        factors: factorAnalysis.factors.map(factor => ({
          id: factor.id,
          name: factor.name,
          score: factor.score,
          weight: factor.weight,
          confidence: factor.confidence,
          explanation: factor.explanation,
          comparisonToAverage: factor.comparisonToAverage,
          trend: factor.trend,
          visualizationData: factor.visualizationData
        })),
        redFlags: redFlags.map(flag => ({
          id: flag.id,
          severity: flag.severity,
          description: flag.description,
          evidence: flag.evidence,
          affectedFactors: flag.affectedFactors,
          timestamp: flag.timestamp
        })),
        strengths: strengths.map(strength => ({
          id: strength.id,
          significance: strength.significance,
          description: strength.description,
          evidence: strength.evidence,
          affectedFactors: strength.affectedFactors,
          timestamp: strength.timestamp
        })),
        confidence,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting NFT factor analysis for ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed factor analysis for a specific creator
   * @param address - Creator wallet address
   * @returns Factor analysis response
   */
  public async getCreatorFactorAnalysis(address: string): Promise<FactorAnalysisResponse | null> {
    try {
      // Get factor analysis from analyzer
      const factorAnalysis = await this.factorAnalyzer.analyzeCreator(address);
      
      if (!factorAnalysis) {
        return null;
      }

      // Get red flags and strengths
      const redFlags = await this.redFlagDetector.detectForCreator(address);
      const strengths = await this.strengthIdentifier.identifyForCreator(address);
      
      // Calculate overall confidence
      const confidence = this.confidenceCalculator.calculateForCreator(address);

      return {
        address,
        factors: factorAnalysis.factors,
        redFlags,
        strengths,
        confidence,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting creator factor analysis for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed factor analysis for a specific collection
   * @param collectionId - Collection ID
   * @returns Factor analysis response
   */
  public async getCollectionFactorAnalysis(collectionId: string): Promise<FactorAnalysisResponse | null> {
    try {
      // Get factor analysis from analyzer
      const factorAnalysis = await this.factorAnalyzer.analyzeCollection(collectionId);
      
      if (!factorAnalysis) {
        return null;
      }

      // Get red flags and strengths
      const redFlags = await this.redFlagDetector.detectForCollection(collectionId);
      const strengths = await this.strengthIdentifier.identifyForCollection(collectionId);
      
      // Calculate overall confidence
      const confidence = this.confidenceCalculator.calculateForCollection(collectionId);

      return {
        collectionId,
        factors: factorAnalysis.factors,
        redFlags,
        strengths,
        confidence,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting collection factor analysis for ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific factor
   * @param factorId - Factor ID
   * @returns Factor detail
   */
  public async getFactorDetails(factorId: string): Promise<FactorDetail | null> {
    try {
      // Get factor details from analyzer
      return await this.factorAnalyzer.getFactorDetails(factorId);
    } catch (error) {
      console.error(`Error getting factor details for ${factorId}:`, error);
      throw error;
    }
  }
}
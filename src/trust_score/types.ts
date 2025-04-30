/**
 * types.ts
 * 
 * Type definitions for the Trust Score Engine.
 * This file contains all interfaces and types used throughout the trust score calculation system.
 */

export namespace TrustScoreTypes {
  /**
   * Update event types for real-time processing
   */
  export interface UpdateEvent {
    entityId: string;
    entityType: string; // 'nft', 'creator', 'collection'
    eventType: string; // 'transfer', 'sale', 'fraud_detection', etc.
    timestamp: string;
    data: Record<string, any>;
  }
  
  /**
   * User preferences for personalization
   */
  export interface UserPreferences {
    riskTolerance: 'low' | 'medium' | 'high';
    investmentGoals: string[];
    interestedFactors: string[];
    notificationPreferences?: {
      significanceThreshold: number;
      interestedRiskLevels: ('low' | 'medium' | 'high')[];
      preferredChannels: string[];
      notifyPositiveChanges: boolean;
      notifyNegativeChanges: boolean;
    };
  }
  
  /**
   * Mitigation recommendation for risk factors
   */
  export interface MitigationRecommendation {
    priority: number; // Higher number means higher priority
    description: string;
    expectedImpact: string;
    difficulty: 'easy' | 'moderate' | 'hard';
  }
  
  /**
   * Input data types for trust score calculations
   */
  export interface NFTInputData {
    // Blockchain data
    tokenId: string;
    contractAddress: string;
    creatorAddress: string;
    ownerAddress: string;
    creationTimestamp: string;
    transactionHistory: Transaction[];
    metadata: NFTMetadata;
    
    // Image analysis data
    imageSimilarityResults?: ImageSimilarityResult[];
    
    // Social and marketplace data
    socialSignals?: SocialSignal[];
    marketplaceVerifications?: MarketplaceVerification[];
    
    // Creator and collection data
    creatorHistory?: CreatorHistoryData;
    collectionData?: CollectionData;
  }

  export interface CreatorInputData {
    creatorAddress: string;
    nfts: NFTInputData[];
    creatorVerifications?: CreatorVerification[];
    socialPresence?: SocialPresence;
    projectDeliveryHistory?: ProjectDelivery[];
  }

  export interface CollectionInputData {
    collectionId: string;
    contractAddress: string;
    creatorAddress: string;
    nfts: NFTInputData[];
    floorPriceHistory?: PricePoint[];
    tradingVolumeHistory?: VolumePoint[];
    holderDistribution?: HolderDistribution;
  }

  /**
   * Transaction and blockchain related types
   */
  export interface Transaction {
    transactionHash: string;
    fromAddress: string;
    toAddress: string;
    timestamp: string;
    value: string; // In wei/lamports/etc.
    marketplace?: string;
  }

  export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    externalUrl?: string;
    attributes: NFTAttribute[];
    additionalProperties?: Record<string, any>;
  }

  export interface NFTAttribute {
    traitType: string;
    value: string | number;
    displayType?: string;
  }

  /**
   * Image analysis related types
   */
  export interface ImageSimilarityResult {
    comparedToNFT: string; // NFT ID being compared to
    similarityScore: number; // 0-1 where 1 is identical
    confidence: number; // 0-1 confidence in the result
    matchedFeatures?: string[];
    earlierCreationTimestamp?: string; // If this exists, the compared NFT was created first
  }

  /**
   * Social and marketplace related types
   */
  export interface SocialSignal {
    platform: string;
    mentionCount: number;
    sentimentScore?: number; // -1 to 1 where 1 is positive
    engagementMetrics?: EngagementMetrics;
    timestamp: string;
  }

  export interface EngagementMetrics {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
  }

  export interface MarketplaceVerification {
    marketplace: string;
    verified: boolean;
    verificationLevel?: string;
    listingStatus: 'active' | 'inactive' | 'removed';
    timestamp: string;
  }

  /**
   * Creator related types
   */
  export interface CreatorHistoryData {
    totalNFTsCreated: number;
    averageNFTQualityScore?: number;
    projectDeliveryRate?: number; // 0-1 where 1 is perfect delivery
    knownCollections: string[];
    firstCreationDate: string;
    verificationStatuses: CreatorVerification[];
  }

  export interface CreatorVerification {
    platform: string;
    verified: boolean;
    verificationDate?: string;
  }

  export interface SocialPresence {
    platforms: string[];
    followerCounts: Record<string, number>;
    engagementRates: Record<string, number>;
    accountAges: Record<string, string>; // ISO date strings
  }

  export interface ProjectDelivery {
    projectName: string;
    announcedDate: string;
    promisedDeliveryDate?: string;
    actualDeliveryDate?: string;
    completionPercentage: number; // 0-100
    communityFeedback?: number; // -1 to 1
  }

  /**
   * Collection related types
   */
  export interface CollectionData {
    name: string;
    size: number; // Total number of NFTs
    creationDate: string;
    description?: string;
    categories?: string[];
    floorPrice?: string;
    totalVolume?: string;
  }

  export interface PricePoint {
    timestamp: string;
    price: string; // In wei/lamports/etc.
  }

  export interface VolumePoint {
    timestamp: string;
    volume: string; // In wei/lamports/etc.
    numberOfTransactions: number;
  }

  export interface HolderDistribution {
    uniqueHolders: number;
    topHolderPercentage: number; // % held by top 1% of holders
    holderRetentionRate?: number; // % of holders keeping NFTs > 30 days
    whaleConcentration?: number; // % held by top 10 wallets
  }

  /**
   * Factor score and trust score types
   */
  export interface FactorScore {
    score: number; // 0-100 normalized score
    confidence: number; // 0-1 confidence in the score
    explanation: string; // Human-readable explanation
    details: Record<string, any>; // Factor-specific details
    redFlags: RedFlag[];
    strengths: Strength[];
  }

  export interface RedFlag {
    severity: 'low' | 'medium' | 'high';
    description: string;
    evidence: string;
  }

  export interface Strength {
    significance: 'low' | 'medium' | 'high';
    description: string;
    evidence: string;
  }

  export interface NFTTrustScore {
    nftId: string;
    overallScore: number; // 0-100 normalized score
    confidence: number; // 0-1 confidence in the score
    factorScores: Map<string, FactorScore>;
    explanation: string;
    timestamp: string; // ISO date string
    history?: ScoreHistoryPoint[];
  }

  export interface CreatorTrustScore {
    creatorAddress: string;
    overallScore: number; // 0-100 normalized score
    confidence: number; // 0-1 confidence in the score
    factorScores: Map<string, FactorScore>;
    explanation: string;
    timestamp: string; // ISO date string
    history?: ScoreHistoryPoint[];
  }

  export interface CollectionTrustScore {
    collectionId: string;
    overallScore: number; // 0-100 normalized score
    confidence: number; // 0-1 confidence in the score
    factorScores: Map<string, FactorScore>;
    explanation: string;
    timestamp: string; // ISO date string
    history?: ScoreHistoryPoint[];
  }

  export interface ScoreHistoryPoint {
    timestamp: string;
    score: number;
    confidence: number;
    significantChanges?: ScoreChange[];
  }

  export interface ScoreChange {
    factor: string;
    previousScore: number;
    newScore: number;
    reason: string;
  }

  export interface ScoreHistory {
    entityId: string; // NFT ID, creator address, or collection ID
    entityType: 'nft' | 'creator' | 'collection';
    history: ScoreHistoryPoint[];
  }

  /**
   * Trust factor analysis types
   */
  export interface TrustFactorAnalysis {
    entityId: string;
    entityType: 'nft' | 'creator' | 'collection';
    factorDetails: Map<string, FactorAnalysisDetail>;
    comparativeAnalysis: ComparativeAnalysis;
    redFlagSummary: RedFlagSummary;
    strengthSummary: StrengthSummary;
    confidenceAnalysis: ConfidenceAnalysis;
  }

  export interface FactorAnalysisDetail {
    factor: string;
    score: number;
    confidence: number;
    explanation: string;
    detailedBreakdown: string;
    contributingElements: ContributingElement[];
    visualizationData?: Record<string, any>;
  }

  export interface ContributingElement {
    name: string;
    impact: number; // -1 to 1 where 1 is positive impact
    description: string;
  }

  export interface ComparativeAnalysis {
    collectionAverage?: number;
    creatorAverage?: number;
    marketAverage?: number;
    percentileRanking?: number; // 0-100
  }

  export interface RedFlagSummary {
    totalFlags: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    prioritizedFlags: RedFlag[];
  }

  export interface StrengthSummary {
    totalStrengths: number;
    highSignificanceCount: number;
    mediumSignificanceCount: number;
    lowSignificanceCount: number;
    prioritizedStrengths: Strength[];
  }

  export interface ConfidenceAnalysis {
    overallConfidence: number;
    lowestConfidenceFactor: string;
    dataCompletenessScore: number; // 0-100
    recommendationsForImprovement: string[];
    summaryText: string;
    confidenceIntervals?: Record<string, { lower: number, upper: number }>;
    visualIndicators?: Record<string, any>;
  }

  /**
   * Risk assessment types
   */
  export interface RiskAssessment {
    entityId: string;
    entityType: 'nft' | 'creator' | 'collection';
    overallRiskLevel: 'low' | 'medium' | 'high';
    riskDimensions: Map<string, RiskDimension>;
    explanation: string;
    mitigationRecommendations: MitigationRecommendation[];
  }

  export interface RiskDimension {
    name: string;
    level: 'low' | 'medium' | 'high';
    score: number; // 0-100 where 0 is lowest risk
    confidence: number;
    explanation: string;
    contributingFactors: string[];
  }

  export interface MitigationRecommendation {
    priority: number; // 1-10 where 10 is highest priority
    description: string;
    expectedImpact: string;
    difficulty: 'easy' | 'moderate' | 'difficult';
  }

  /**
   * Update system types
   */
  export interface UpdateEvent {
    eventType: 'transfer' | 'sale' | 'metadata_update' | 'fraud_detection' | 'social_signal' | 'marketplace_verification';
    timestamp: string;
    entityId: string;
    entityType: 'nft' | 'creator' | 'collection';
    data: Record<string, any>;
  }
}
/**
 * Type definitions for the NFT Price Prediction Engine
 */

/**
 * NFT Category types
 */
export type NFTCategory = 'art' | 'collectible' | 'gaming' | 'metaverse' | 'utility' | 'other';

/**
 * NFT trait definition
 */
export interface Trait {
  type: string;
  value: string;
  rarityScore?: number;
}

/**
 * NFT definition
 */
export interface NFT {
  id: string;
  collectionId: string;
  tokenId: string;
  traits: Trait[];
  rarityScore: number;
  rarityRank?: number;
  lastSalePrice?: number;
  lastSaleTimestamp?: string;
}

/**
 * Sale record definition
 */
export interface SaleRecord {
  nft: NFT;
  price: number;
  timestamp: string;
  buyer: string;
  seller: string;
}

/**
 * Collection definition
 */
export interface Collection {
  id: string;
  name: string;
  nfts: NFT[];
  sales: SaleRecord[];
  floorPrice: number;
  totalVolume: number;
  category?: NFTCategory;
}

/**
 * Model prediction with confidence interval
 */
export interface ModelPrediction {
  predictedPrice: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidenceScore: number;
  modelType: string;
  comparables?: string[];
}

/**
 * Ensemble prediction with explanation
 */
export interface EnsemblePrediction extends ModelPrediction {
  modelWeights: Record<string, number>;
  individualPredictions: ModelPrediction[];
  explanationFactors: Array<{
    factor: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Model types supported by the price prediction engine
 */
export type ModelType = 'regression' | 'timeSeries' | 'comparableSales' | 'rarityBased' | 'ensemble';

/**
 * Time horizon for predictions
 */
export enum TimeHorizon {
  ONE_DAY = '1d',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d'
}

/**
 * Price range categories for evaluation
 */
export enum PriceRange {
  VERY_LOW = 'very_low',   // < 0.1 ETH
  LOW = 'low',             // 0.1 - 1 ETH
  MEDIUM = 'medium',       // 1 - 10 ETH
  HIGH = 'high',           // 10 - 100 ETH
  VERY_HIGH = 'very_high'  // > 100 ETH
}

/**
 * Configuration for the model implementation
 */
export interface ModelConfig {
  // General configuration
  enabledModels: string[];
  ensembleMethod: 'stacking' | 'averaging' | 'voting' | 'dynamic';
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  
  // Hyperparameter tuning configuration
  hyperparameterTuning: {
    enabled: boolean;
    method: 'grid_search' | 'random_search' | 'bayesian_optimization';
    crossValidation: number;
    scoringMetric: 'mae' | 'rmse' | 'mape' | 'r2';
  };
  
  // Time series specific configuration
  timeSeriesConfig: {
    forecastHorizons: number[];
    seasonalityMode: 'additive' | 'multiplicative';
    changePointPrior: number;
  };
  
  // Comparable sales specific configuration
  comparableSalesConfig: {
    maxComparables: number;
    similarityThreshold: number;
    timeDecayFactor: number;
    attributeWeights: { [key: string]: number };
  };
  
  // Rarity model specific configuration
  rarityModelConfig: {
    rarityWeightMethod: 'linear' | 'exponential' | 'logarithmic';
    timeVaryingImpact: boolean;
    trendForecastingEnabled: boolean;
  };
}

/**
 * Prediction result structure
 */
export interface PredictionResult {
  predictedPrice: number;
  confidence: number;
  modelType: ModelType;
  modelSpecificResults?: { [key: string]: any };
  timestamp: number;
}

/**
 * Model performance metrics
 */
export interface ModelPerformance {
  mae: number;  // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  r2: number;   // R-squared
}

/**
 * Processed NFT features for model input
 */
export interface NFTFeatures {
  tokenId: string;
  collectionId: string;
  numericFeatures: { [key: string]: number };
  categoricalFeatures: { [key: string]: string | number };
  timeSeriesFeatures?: { [key: string]: number[] };
  rarityFeatures?: { [key: string]: number };
  marketFeatures?: { [key: string]: number };
  timestamp: number;
}

/**
 * Configuration for the data processing pipeline
 */
export interface PipelineConfig {
  // General configuration
  featureVersion: string;
  cacheEnabled: boolean;
  parallelProcessing: boolean;
  
  // Preprocessing configuration
  outlierDetectionMethod: 'iqr' | 'zscore' | 'isolation_forest';
  outlierThreshold: number;
  normalizationMethod: 'minmax' | 'standard' | 'robust';
  missingValueStrategy: 'mean' | 'median' | 'mode' | 'constant';
  timeIntervalHandling: 'interpolation' | 'aggregation';
  
  // Feature extraction configuration
  categoricalEncodingMethod: 'onehot' | 'label' | 'target' | 'embedding';
  rarityScoreMethod: 'statistical' | 'trait_floor_diff' | 'custom';
  polynomialDegree: number;
  interactionFeatureEnabled: boolean;
  timeFeatureGranularity: 'hour' | 'day' | 'week' | 'month';
  
  // Collection feature configuration
  floorPriceWindows: number[];
  volumeMetricsEnabled: boolean;
  liquidityMeasuresEnabled: boolean;
  competitionMetricsEnabled: boolean;
  
  // Market feature configuration
  ethereumPriceEnabled: boolean;
  gasCostEnabled: boolean;
  sentimentAnalysisEnabled: boolean;
  marketCycleDetectionEnabled: boolean;
  seasonalityDetectionEnabled: boolean;
  
  // Feature selection configuration
  featureSelectionMethod: 'statistical' | 'tree_based' | 'correlation' | 'pca';
  varianceThreshold: number;
  correlationThreshold: number;
  maxFeatures: number;
  pcaComponents?: number;
}

/**
 * Raw NFT data structure
 */
export interface RawNFTData {
  tokenId: string;
  collectionId: string;
  contractAddress: string;
  blockchain: string;
  metadata: NFTMetadata;
  salesHistory: SaleRecord[];
  ownershipHistory: OwnershipRecord[];
  currentOwner: string;
  listingInfo?: ListingInfo;
}

/**
 * NFT metadata structure
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  externalUrl?: string;
  animationUrl?: string;
  backgroundColor?: string;
  // Additional metadata fields
  [key: string]: any;
}

/**
 * NFT attribute structure
 */
export interface NFTAttribute {
  traitType: string;
  value: string | number;
  displayType?: string;
  frequency?: number;
  rarityScore?: number;
}

/**
 * Sale record structure
 */
export interface SaleRecord {
  timestamp: number;
  price: number;
  currency: string;
  marketplace: string;
  buyer: string;
  seller: string;
  transactionHash: string;
  blockNumber: number;
}

/**
 * Ownership record structure
 */
export interface OwnershipRecord {
  owner: string;
  acquiredTimestamp: number;
  disposedTimestamp?: number;
  acquiredPrice?: number;
  disposedPrice?: number;
  holdingPeriod?: number;
}

/**
 * Current listing information
 */
export interface ListingInfo {
  isListed: boolean;
  price?: number;
  currency?: string;
  marketplace?: string;
  listedAt?: number;
  expiresAt?: number;
}

/**
 * Collection data structure
 */
export interface CollectionData {
  id: string;
  name: string;
  description: string;
  contractAddress: string;
  blockchain: string;
  creator: string;
  createdAt: number;
  totalSupply: number;
  floorPrice: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  averagePrice24h: number;
  averagePrice7d: number;
  averagePrice30d: number;
  salesCount24h: number;
  salesCount7d: number;
  salesCount30d: number;
  uniqueOwners: number;
  ownershipConcentration: number;
}

/**
 * Market data structure
 */
export interface MarketData {
  timestamp: number;
  ethereumPrice: number;
  gasPrice: number;
  nftMarketVolume: number;
  nftMarketSalesCount: number;
  marketSentiment: number;
  marketCyclePhase: string;
  seasonalityFactors: Record<string, number>;
}

/**
 * Processed features ready for model input
 */
export interface ProcessedFeatures {
  // Token identification
  tokenId: string;
  collectionId: string;
  
  // NFT-specific features
  attributeFeatures: Record<string, number>;
  rarityScore: number;
  polynomialFeatures: Record<string, number>;
  timeFeatures: Record<string, number>;
  ownershipFeatures: Record<string, number>;
  
  // Collection-level features
  floorPriceTrends: Record<string, number>;
  volumeMetrics: Record<string, number>;
  growthIndicators: Record<string, number>;
  liquidityMeasures: Record<string, number>;
  competitionMetrics: Record<string, number>;
  
  // Market context features
  ethereumPriceFeatures: Record<string, number>;
  gasCostFeatures: Record<string, number>;
  sentimentIndicators: Record<string, number>;
  marketCycleFeatures: Record<string, number>;
  seasonalityFeatures: Record<string, number>;
  
  // Additional metadata
  featureVersion: string;
  generatedAt: number;
}
/**
 * Data Processing and Feature Engineering Pipeline
 * 
 * This module implements a robust pipeline that transforms raw NFT data into
 * meaningful features for price prediction models.
 */

import { DataCollectionPreprocessing } from './preprocessing';
import { NFTFeatureExtraction } from './feature_extraction';
import { CollectionFeatureGeneration } from './collection_features';
import { MarketContextFeatures } from './market_features';
import { FeatureSelectionReduction } from './feature_selection';
import { PipelineConfig } from '../types';

/**
 * Main class that orchestrates the entire data processing pipeline
 */
export class DataProcessingPipeline {
  private preprocessor: DataCollectionPreprocessing;
  private featureExtractor: NFTFeatureExtraction;
  private collectionFeatureGenerator: CollectionFeatureGeneration;
  private marketFeatureGenerator: MarketContextFeatures;
  private featureSelector: FeatureSelectionReduction;
  private config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.preprocessor = new DataCollectionPreprocessing(config);
    this.featureExtractor = new NFTFeatureExtraction(config);
    this.collectionFeatureGenerator = new CollectionFeatureGeneration(config);
    this.marketFeatureGenerator = new MarketContextFeatures(config);
    this.featureSelector = new FeatureSelectionReduction(config);
  }

  /**
   * Process raw NFT data through the entire pipeline
   * @param rawData The raw NFT data to process
   * @returns Processed features ready for model input
   */
  async processData(rawData: any): Promise<any> {
    // Step 1: Preprocess the raw data
    const preprocessedData = await this.preprocessor.process(rawData);
    
    // Step 2: Extract NFT-specific features
    const nftFeatures = await this.featureExtractor.extractFeatures(preprocessedData);
    
    // Step 3: Generate collection-level features
    const collectionFeatures = await this.collectionFeatureGenerator.generateFeatures(preprocessedData);
    
    // Step 4: Generate market context features
    const marketFeatures = await this.marketFeatureGenerator.generateFeatures(preprocessedData);
    
    // Step 5: Combine all features
    const combinedFeatures = {
      ...nftFeatures,
      ...collectionFeatures,
      ...marketFeatures
    };
    
    // Step 6: Perform feature selection and dimensionality reduction
    const selectedFeatures = await this.featureSelector.selectFeatures(combinedFeatures);
    
    return selectedFeatures;
  }

  /**
   * Update the pipeline configuration
   * @param newConfig The new configuration to apply
   */
  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.preprocessor.updateConfig(this.config);
    this.featureExtractor.updateConfig(this.config);
    this.collectionFeatureGenerator.updateConfig(this.config);
    this.marketFeatureGenerator.updateConfig(this.config);
    this.featureSelector.updateConfig(this.config);
  }
}

export * from './preprocessing';
export * from './feature_extraction';
export * from './collection_features';
export * from './market_features';
export * from './feature_selection';
/**
 * Multiple Model Implementation for NFT Price Prediction
 * 
 * This module implements multiple complementary models for price prediction
 * to capture different aspects of NFT valuation.
 */

import { ModelConfig, PredictionResult, NFTFeatures, ModelType } from '../types';
import { RegressionModels } from './regression_models';
import { TimeSeriesModels } from './time_series_models';
import { ComparableSalesApproach } from './comparable_sales';
import { RarityBasedModels } from './rarity_based_models';
import { EnsembleIntegration } from './ensemble_integration';

// Export individual model implementations for direct use
export * from './regression_models';
export * from './time_series_models';
export * from './comparable_sales';
export * from './rarity_based_models';
export * from './ensemble_integration';

/**
 * Main class that orchestrates multiple model implementations and ensemble integration
 */
export class PricePredictionModels {
  private regressionModels: RegressionModels;
  private timeSeriesModels: TimeSeriesModels;
  private comparableSalesApproach: ComparableSalesApproach;
  private rarityBasedModels: RarityBasedModels;
  private ensembleIntegration: EnsembleIntegration;
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    this.regressionModels = new RegressionModels(config);
    this.timeSeriesModels = new TimeSeriesModels(config);
    this.comparableSalesApproach = new ComparableSalesApproach(config);
    this.rarityBasedModels = new RarityBasedModels(config);
    this.ensembleIntegration = new EnsembleIntegration(config);
  }

  /**
   * Generate price predictions using all available models and ensemble integration
   * @param features Processed NFT features
   * @returns Comprehensive prediction results with confidence metrics
   */
  async generatePredictions(features: NFTFeatures): Promise<PredictionResult> {
    // Get predictions from each model type
    const regressionPredictions = await this.regressionModels.predict(features);
    const timeSeriesPredictions = await this.timeSeriesModels.predict(features);
    const comparableSalesPredictions = await this.comparableSalesApproach.predict(features);
    const rarityBasedPredictions = await this.rarityBasedModels.predict(features);
    
    // Combine all predictions using ensemble integration
    const ensemblePrediction = await this.ensembleIntegration.integrateModels({
      regression: regressionPredictions,
      timeSeries: timeSeriesPredictions,
      comparableSales: comparableSalesPredictions,
      rarityBased: rarityBasedPredictions
    });
    
    return ensemblePrediction;
  }

  /**
   * Generate predictions using a specific model type
   * @param features Processed NFT features
   * @param modelType Type of model to use for prediction
   * @returns Prediction results from the specified model
   */
  async predictWithModel(features: NFTFeatures, modelType: ModelType): Promise<PredictionResult> {
    switch (modelType) {
      case 'regression':
        return await this.regressionModels.predict(features);
      case 'timeSeries':
        return await this.timeSeriesModels.predict(features);
      case 'comparableSales':
        return await this.comparableSalesApproach.predict(features);
      case 'rarityBased':
        return await this.rarityBasedModels.predict(features);
      case 'ensemble':
        return await this.generatePredictions(features);
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  /**
   * Train or retrain all models with new data
   * @param trainingData Training data for model training
   */
  async trainModels(trainingData: any): Promise<void> {
    await Promise.all([
      this.regressionModels.train(trainingData),
      this.timeSeriesModels.train(trainingData),
      this.comparableSalesApproach.train(trainingData),
      this.rarityBasedModels.train(trainingData)
    ]);
    
    // Train ensemble after individual models are trained
    await this.ensembleIntegration.train(trainingData);
  }
}
/**
 * NFT-specific Feature Extraction Module
 * 
 * This module handles the extraction of features specific to NFTs, including:
 * - Transforming categorical attributes to numerical features using appropriate encoding techniques
 * - Calculating rarity scores based on attribute distribution within collections
 * - Creating polynomial and interaction features between relevant attributes
 * - Generating time-based features (day of week, month, proximity to events)
 * - Developing features based on ownership history and holding periods
 */

import { PipelineConfig } from '../types';

/**
 * Interface for NFT feature extraction operations
 */
export interface IFeatureExtractor {
  extractFeatures(preprocessedData: any): Promise<any>;
  updateConfig(config: PipelineConfig): void;
}

/**
 * Implementation of NFT-specific feature extraction operations
 */
export class NFTFeatureExtraction implements IFeatureExtractor {
  private config: PipelineConfig;
  
  constructor(config: PipelineConfig) {
    this.config = config;
  }
  
  /**
   * Extract features from preprocessed NFT data
   * @param preprocessedData The preprocessed NFT data
   * @returns Extracted NFT-specific features
   */
  async extractFeatures(preprocessedData: any): Promise<any> {
    // Step 1: Transform categorical attributes to numerical features
    const attributeFeatures = await this.transformCategoricalAttributes(preprocessedData);
    
    // Step 2: Calculate rarity scores
    const rarityFeatures = await this.calculateRarityScores(preprocessedData);
    
    // Step 3: Create polynomial and interaction features
    const polynomialFeatures = await this.createPolynomialFeatures(attributeFeatures, rarityFeatures);
    
    // Step 4: Generate time-based features
    const timeFeatures = await this.generateTimeFeatures(preprocessedData);
    
    // Step 5: Develop ownership-based features
    const ownershipFeatures = await this.developOwnershipFeatures(preprocessedData);
    
    // Combine all features
    return {
      attributeFeatures,
      rarityFeatures,
      polynomialFeatures,
      timeFeatures,
      ownershipFeatures
    };
  }
  
  /**
   * Update the feature extraction configuration
   * @param config The new configuration to apply
   */
  updateConfig(config: PipelineConfig): void {
    this.config = config;
  }
  
  /**
   * Transform categorical attributes to numerical features
   * @param data The preprocessed data
   * @returns Numerical features derived from categorical attributes
   */
  private async transformCategoricalAttributes(data: any): Promise<any> {
    // Implementation of categorical attribute transformation
    // Based on the configured encoding method
    
    const attributes = data.metadata.attributes;
    let encodedAttributes: Record<string, number> = {};
    
    switch (this.config.categoricalEncodingMethod) {
      case 'onehot':
        encodedAttributes = this.applyOneHotEncoding(attributes);
        break;
      case 'label':
        encodedAttributes = this.applyLabelEncoding(attributes);
        break;
      case 'target':
        encodedAttributes = this.applyTargetEncoding(attributes, data.salesHistory);
        break;
      case 'embedding':
        encodedAttributes = await this.applyEmbeddingEncoding(attributes);
        break;
      default:
        encodedAttributes = this.applyOneHotEncoding(attributes);
    }
    
    return encodedAttributes;
  }
  
  /**
   * Calculate rarity scores based on attribute distribution
   * @param data The preprocessed data
   * @returns Rarity features
   */
  private async calculateRarityScores(data: any): Promise<any> {
    // Implementation of rarity score calculation
    // Based on the configured rarity score method
    
    switch (this.config.rarityScoreMethod) {
      case 'statistical':
        return this.calculateStatisticalRarity(data);
      case 'trait_floor_diff':
        return this.calculateTraitFloorDiffRarity(data);
      case 'custom':
        return this.calculateCustomRarity(data);
      default:
        return this.calculateStatisticalRarity(data);
    }
  }
  
  /**
   * Create polynomial and interaction features
   * @param attributeFeatures The attribute features
   * @param rarityFeatures The rarity features
   * @returns Polynomial and interaction features
   */
  private async createPolynomialFeatures(attributeFeatures: any, rarityFeatures: any): Promise<any> {
    // Implementation of polynomial and interaction feature creation
    // Based on the configured polynomial degree and interaction feature flag
    
    let polynomialFeatures: Record<string, number> = {};
    
    // Create polynomial features if enabled
    if (this.config.polynomialDegree > 1) {
      polynomialFeatures = {
        ...polynomialFeatures,
        ...this.generatePolynomialFeatures(attributeFeatures, this.config.polynomialDegree)
      };
    }
    
    // Create interaction features if enabled
    if (this.config.interactionFeatureEnabled) {
      polynomialFeatures = {
        ...polynomialFeatures,
        ...this.generateInteractionFeatures(attributeFeatures, rarityFeatures)
      };
    }
    
    return polynomialFeatures;
  }
  
  /**
   * Generate time-based features
   * @param data The preprocessed data
   * @returns Time-based features
   */
  private async generateTimeFeatures(data: any): Promise<any> {
    // Implementation of time-based feature generation
    // Based on the configured time feature granularity
    
    const salesHistory = data.salesHistory;
    const timeFeatures: Record<string, number> = {};
    
    // Generate time features based on the most recent sale
    if (salesHistory.length > 0) {
      const latestSale = salesHistory[salesHistory.length - 1];
      const saleDate = new Date(latestSale.timestamp);
      
      // Extract time components based on granularity
      switch (this.config.timeFeatureGranularity) {
        case 'hour':
          timeFeatures['hour_of_day'] = saleDate.getHours();
          timeFeatures['is_business_hours'] = (saleDate.getHours() >= 9 && saleDate.getHours() <= 17) ? 1 : 0;
          // Fall through to include day features
        case 'day':
          timeFeatures['day_of_week'] = saleDate.getDay();
          timeFeatures['is_weekend'] = (saleDate.getDay() === 0 || saleDate.getDay() === 6) ? 1 : 0;
          // Fall through to include week features
        case 'week':
          timeFeatures['week_of_month'] = Math.ceil(saleDate.getDate() / 7);
          // Fall through to include month features
        case 'month':
          timeFeatures['month_of_year'] = saleDate.getMonth();
          timeFeatures['is_holiday_season'] = (saleDate.getMonth() === 11 || saleDate.getMonth() === 0) ? 1 : 0;
          break;
      }
      
      // Add proximity to known events (simplified example)
      timeFeatures['days_since_last_sale'] = this.calculateDaysSinceLastSale(salesHistory);
    }
    
    return timeFeatures;
  }
  
  /**
   * Develop features based on ownership history
   * @param data The preprocessed data
   * @returns Ownership-based features
   */
  private async developOwnershipFeatures(data: any): Promise<any> {
    // Implementation of ownership-based feature development
    
    const ownershipHistory = data.ownershipHistory;
    const ownershipFeatures: Record<string, number> = {};
    
    // Calculate ownership-related features
    ownershipFeatures['total_owners'] = this.calculateTotalOwners(ownershipHistory);
    ownershipFeatures['avg_holding_period'] = this.calculateAverageHoldingPeriod(ownershipHistory);
    ownershipFeatures['ownership_concentration'] = this.calculateOwnershipConcentration(ownershipHistory);
    ownershipFeatures['flipping_frequency'] = this.calculateFlippingFrequency(ownershipHistory);
    ownershipFeatures['current_holding_period'] = this.calculateCurrentHoldingPeriod(ownershipHistory);
    
    return ownershipFeatures;
  }
  
  /**
   * Apply one-hot encoding to categorical attributes
   * @param attributes The NFT attributes
   * @returns One-hot encoded attributes
   */
  private applyOneHotEncoding(attributes: any[]): Record<string, number> {
    // Implementation of one-hot encoding
    const encoded: Record<string, number> = {};
    
    attributes.forEach(attr => {
      const key = `${attr.traitType}_${attr.value}`;
      encoded[key] = 1;
    });
    
    return encoded;
  }
  
  /**
   * Apply label encoding to categorical attributes
   * @param attributes The NFT attributes
   * @returns Label encoded attributes
   */
  private applyLabelEncoding(attributes: any[]): Record<string, number> {
    // Implementation of label encoding
    // Placeholder implementation
    const encoded: Record<string, number> = {};
    
    attributes.forEach(attr => {
      // This is a simplified implementation
      // In a real system, you would maintain a mapping of values to labels
      encoded[attr.traitType] = typeof attr.value === 'number' ? attr.value : 0;
    });
    
    return encoded;
  }
  
  /**
   * Apply target encoding to categorical attributes
   * @param attributes The NFT attributes
   * @param salesHistory The sales history for target calculation
   * @returns Target encoded attributes
   */
  private applyTargetEncoding(attributes: any[], salesHistory: any[]): Record<string, number> {
    // Implementation of target encoding
    // Placeholder implementation
    return {};
  }
  
  /**
   * Apply embedding encoding to categorical attributes
   * @param attributes The NFT attributes
   * @returns Embedding encoded attributes
   */
  private async applyEmbeddingEncoding(attributes: any[]): Promise<Record<string, number>> {
    // Implementation of embedding encoding
    // Placeholder implementation
    return {};
  }
  
  /**
   * Calculate statistical rarity scores
   * @param data The preprocessed data
   * @returns Statistical rarity features
   */
  private calculateStatisticalRarity(data: any): any {
    // Implementation of statistical rarity calculation
    // Placeholder implementation
    return {
      rarityScore: 0.5, // Placeholder value
      traitRarityScores: {}
    };
  }
  
  /**
   * Calculate trait floor difference rarity scores
   * @param data The preprocessed data
   * @returns Trait floor difference rarity features
   */
  private calculateTraitFloorDiffRarity(data: any): any {
    // Implementation of trait floor difference rarity calculation
    // Placeholder implementation
    return {
      rarityScore: 0.6, // Placeholder value
      traitFloorDiffs: {}
    };
  }
  
  /**
   * Calculate custom rarity scores
   * @param data The preprocessed data
   * @returns Custom rarity features
   */
  private calculateCustomRarity(data: any): any {
    // Implementation of custom rarity calculation
    // Placeholder implementation
    return {
      rarityScore: 0.7, // Placeholder value
      customRarityMetrics: {}
    };
  }
  
  /**
   * Generate polynomial features
   * @param features The base features
   * @param degree The polynomial degree
   * @returns Polynomial features
   */
  private generatePolynomialFeatures(features: Record<string, number>, degree: number): Record<string, number> {
    // Implementation of polynomial feature generation
    // Placeholder implementation
    const polynomialFeatures: Record<string, number> = {};
    
    // Generate squared features as an example
    if (degree >= 2) {
      Object.entries(features).forEach(([key, value]) => {
        polynomialFeatures[`${key}_squared`] = value * value;
      });
    }
    
    return polynomialFeatures;
  }
  
  /**
   * Generate interaction features
   * @param attributeFeatures The attribute features
   * @param rarityFeatures The rarity features
   * @returns Interaction features
   */
  private generateInteractionFeatures(attributeFeatures: any, rarityFeatures: any): Record<string, number> {
    // Implementation of interaction feature generation
    // Placeholder implementation
    const interactionFeatures: Record<string, number> = {};
    
    // Example: Interaction between rarity score and a specific attribute
    if (rarityFeatures.rarityScore && attributeFeatures['Background_Blue']) {
      interactionFeatures['rarity_x_blue_background'] = rarityFeatures.rarityScore * attributeFeatures['Background_Blue'];
    }
    
    return interactionFeatures;
  }
  
  /**
   * Calculate days since the last sale
   * @param salesHistory The sales history
   * @returns Days since the last sale
   */
  private calculateDaysSinceLastSale(salesHistory: any[]): number {
    // Implementation of days since last sale calculation
    if (salesHistory.length < 2) {
      return 0;
    }
    
    const lastSaleTimestamp = salesHistory[salesHistory.length - 1].timestamp;
    const previousSaleTimestamp = salesHistory[salesHistory.length - 2].timestamp;
    
    const daysDifference = (lastSaleTimestamp - previousSaleTimestamp) / (1000 * 60 * 60 * 24);
    return Math.round(daysDifference);
  }
  
  /**
   * Calculate the total number of unique owners
   * @param ownershipHistory The ownership history
   * @returns Total number of unique owners
   */
  private calculateTotalOwners(ownershipHistory: any[]): number {
    // Implementation of total owners calculation
    const uniqueOwners = new Set(ownershipHistory.map(record => record.owner));
    return uniqueOwners.size;
  }
  
  /**
   * Calculate the average holding period
   * @param ownershipHistory The ownership history
   * @returns Average holding period in days
   */
  private calculateAverageHoldingPeriod(ownershipHistory: any[]): number {
    // Implementation of average holding period calculation
    const completedPeriods = ownershipHistory.filter(record => record.disposedTimestamp);
    
    if (completedPeriods.length === 0) {
      return 0;
    }
    
    const totalHoldingDays = completedPeriods.reduce((sum, record) => {
      const holdingPeriodMs = record.disposedTimestamp - record.acquiredTimestamp;
      const holdingPeriodDays = holdingPeriodMs / (1000 * 60 * 60 * 24);
      return sum + holdingPeriodDays;
    }, 0);
    
    return totalHoldingDays / completedPeriods.length;
  }
  
  /**
   * Calculate ownership concentration
   * @param ownershipHistory The ownership history
   * @returns Ownership concentration metric
   */
  private calculateOwnershipConcentration(ownershipHistory: any[]): number {
    // Implementation of ownership concentration calculation
    // Placeholder implementation
    return 0.5; // Placeholder value
  }
  
  /**
   * Calculate flipping frequency
   * @param ownershipHistory The ownership history
   * @returns Flipping frequency metric
   */
  private calculateFlippingFrequency(ownershipHistory: any[]): number {
    // Implementation of flipping frequency calculation
    // Placeholder implementation
    return 0.3; // Placeholder value
  }
  
  /**
   * Calculate current holding period
   * @param ownershipHistory The ownership history
   * @returns Current holding period in days
   */
  private calculateCurrentHoldingPeriod(ownershipHistory: any[]): number {
    // Implementation of current holding period calculation
    if (ownershipHistory.length === 0) {
      return 0;
    }
    
    // Get the most recent ownership record
    const currentOwnership = ownershipHistory[ownershipHistory.length - 1];
    
    // If the NFT has been disposed, return 0
    if (currentOwnership.disposedTimestamp) {
      return 0;
    }
    
    // Calculate the holding period from acquisition to now
    const now = Date.now();
    const holdingPeriodMs = now - currentOwnership.acquiredTimestamp;
    const holdingPeriodDays = holdingPeriodMs / (1000 * 60 * 60 * 24);
    
    return Math.round(holdingPeriodDays);
  }
}
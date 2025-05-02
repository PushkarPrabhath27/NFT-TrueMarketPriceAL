/**
 * MarketConditionEventSource.ts
 * 
 * Implements the Market Condition Monitoring component of the Real-Time Update System.
 * Responsible for detecting market changes such as floor price movements, volume anomalies,
 * market-wide trend shifts, similar NFT sales, and creator portfolio performance changes.
 */

import { EventEmitter } from 'events';
import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the market condition event source
 */
export interface MarketConditionEventSourceConfig {
  // API endpoints for market data providers
  apiEndpoints: Record<string, string>;
  // API keys for market data providers
  apiKeys: Record<string, string>;
  // Polling interval in milliseconds
  pollingInterval: number;
  // Maximum number of retries for failed API calls
  maxRetries: number;
  // Backoff multiplier for retry delays
  backoffMultiplier: number;
  // Significance thresholds for different metrics
  significanceThresholds: {
    floorPrice: number; // Percentage change
    volume: number; // Standard deviations
    trend: number; // Percentage change
    similarSales: number; // Percentage difference
    creatorPortfolio: number; // Percentage change
  };
  // Enabled market data providers
  enabledProviders: {
    opensea: boolean;
    rarible: boolean;
    nftx: boolean;
    blur: boolean;
  };
  // Enabled detection types
  enabledDetectionTypes: {
    floorPriceMovements: boolean;
    volumeAnomalies: boolean;
    trendShifts: boolean;
    similarNftSales: boolean;
    creatorPortfolioChanges: boolean;
  };
}

/**
 * Represents market data for an entity
 */
interface MarketData {
  entityId: string;
  entityType: string;
  provider: string;
  floorPrice: number;
  volume24h: number;
  volumeHistory: number[];
  salesCount24h: number;
  averagePrice24h: number;
  trendIndicator: number; // -1 to 1 (bearish to bullish)
  lastUpdated: number;
}

/**
 * Manages market condition monitoring and emits events when relevant changes occur
 */
export class MarketConditionEventSource extends EventEmitter {
  private config: MarketConditionEventSourceConfig;
  private isRunning: boolean = false;
  private pollingInterval?: NodeJS.Timeout;
  private lastData: Map<string, MarketData> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  
  /**
   * Initialize the Market Condition Event Source
   * 
   * @param config Configuration for the market condition event source
   */
  constructor(config: MarketConditionEventSourceConfig) {
    super();
    this.config = this.getDefaultConfig(config);
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<MarketConditionEventSourceConfig>): MarketConditionEventSourceConfig {
    return {
      apiEndpoints: {
        opensea: 'https://api.opensea.io/api/v2',
        rarible: 'https://api.rarible.org/v0.1',
        nftx: 'https://api.nftx.io/v1',
        blur: 'https://api.blur.io/v1',
        ...config.apiEndpoints
      },
      apiKeys: {
        ...config.apiKeys
      },
      pollingInterval: 300000, // 5 minutes
      maxRetries: 3,
      backoffMultiplier: 2,
      significanceThresholds: {
        floorPrice: 10, // 10% change
        volume: 2, // 2 standard deviations
        trend: 15, // 15% change
        similarSales: 20, // 20% difference
        creatorPortfolio: 15, // 15% change
        ...config.significanceThresholds
      },
      enabledProviders: {
        opensea: true,
        rarible: true,
        nftx: true,
        blur: true,
        ...config.enabledProviders
      },
      enabledDetectionTypes: {
        floorPriceMovements: true,
        volumeAnomalies: true,
        trendShifts: true,
        similarNftSales: true,
        creatorPortfolioChanges: true,
        ...config.enabledDetectionTypes
      },
      ...config
    };
  }
  
  /**
   * Start monitoring market conditions
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // Perform initial data fetch
    this.fetchAllMarketData();
    
    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.fetchAllMarketData();
    }, this.config.pollingInterval);
    
    this.emit('started');
  }
  
  /**
   * Fetch market data from all enabled providers
   */
  private async fetchAllMarketData(): Promise<void> {
    try {
      const fetchPromises: Promise<void>[] = [];
      
      // Fetch data from each enabled provider
      if (this.config.enabledProviders.opensea) {
        fetchPromises.push(this.fetchProviderData('opensea'));
      }
      
      if (this.config.enabledProviders.rarible) {
        fetchPromises.push(this.fetchProviderData('rarible'));
      }
      
      if (this.config.enabledProviders.nftx) {
        fetchPromises.push(this.fetchProviderData('nftx'));
      }
      
      if (this.config.enabledProviders.blur) {
        fetchPromises.push(this.fetchProviderData('blur'));
      }
      
      // Wait for all fetches to complete
      await Promise.allSettled(fetchPromises);
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      this.emit('error', { source: 'fetchAllMarketData', error });
    }
  }
  
  /**
   * Fetch market data from a specific provider
   * 
   * @param provider The provider to fetch data from
   */
  private async fetchProviderData(provider: string): Promise<void> {
    try {
      // This would typically call the provider's API
      // For this implementation, we'll simulate data fetching
      console.log(`Fetching market data from ${provider}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate fetched data
      const entities = this.getRelevantEntities();
      
      for (const entity of entities) {
        const newData = this.simulateMarketData(entity.id, entity.type, provider);
        const entityKey = `${entity.type}-${entity.id}-${provider}`;
        
        // Get previous data if available
        const previousData = this.lastData.get(entityKey);
        
        // Store new data
        this.lastData.set(entityKey, newData);
        
        // Reset retry attempts on success
        this.retryAttempts.delete(entityKey);
        
        // Check for significant changes if we have previous data
        if (previousData) {
          this.detectSignificantChanges(previousData, newData);
        }
      }
    } catch (error) {
      console.error(`Error fetching data from ${provider}:`, error);
      
      // Handle retry logic
      const retryKey = `provider-${provider}`;
      const attempts = (this.retryAttempts.get(retryKey) || 0) + 1;
      
      if (attempts <= this.config.maxRetries) {
        this.retryAttempts.set(retryKey, attempts);
        
        // Schedule retry with exponential backoff
        const backoffDelay = Math.pow(this.config.backoffMultiplier, attempts) * 1000;
        
        setTimeout(() => {
          this.fetchProviderData(provider);
        }, backoffDelay);
        
        this.emit('retryScheduled', { provider, attempts, delay: backoffDelay });
      } else {
        this.emit('error', { source: `fetchProviderData-${provider}`, error, attempts });
      }
    }
  }
  
  /**
   * Get a list of relevant entities to monitor
   * 
   * @returns List of entities to monitor
   */
  private getRelevantEntities(): Array<{ id: string, type: string }> {
    // This would typically come from a database or configuration
    // For this implementation, we'll return a static list
    return [
      { id: 'collection1', type: 'collection' },
      { id: 'collection2', type: 'collection' },
      { id: 'creator1', type: 'creator' }
    ];
  }
  
  /**
   * Simulate market data for an entity
   * 
   * @param entityId The entity ID
   * @param entityType The entity type
   * @param provider The market data provider
   * @returns Simulated market data
   */
  private simulateMarketData(entityId: string, entityType: string, provider: string): MarketData {
    // Get previous data if available
    const entityKey = `${entityType}-${entityId}-${provider}`;
    const previousData = this.lastData.get(entityKey);
    
    // Base values
    const baseValues = {
      floorPrice: 1.0,
      volume24h: 100,
      volumeHistory: [80, 90, 100, 110, 120],
      salesCount24h: 20,
      averagePrice24h: 1.5,
      trendIndicator: 0.2
    };
    
    // If we have previous data, use it as the base with some variation
    // Otherwise, use the default base values
    const base = previousData || {
      entityId,
      entityType,
      provider,
      ...baseValues,
      lastUpdated: Date.now() - 86400000 // 1 day ago
    };
    
    // Add some random variation
    return {
      entityId,
      entityType,
      provider,
      floorPrice: Math.max(0.01, base.floorPrice * (1 + (Math.random() * 0.3 - 0.15))), // ±15%
      volume24h: Math.max(0, base.volume24h * (1 + (Math.random() * 0.4 - 0.2))), // ±20%
      volumeHistory: [...base.volumeHistory.slice(1), base.volume24h],
      salesCount24h: Math.max(0, Math.round(base.salesCount24h * (1 + (Math.random() * 0.4 - 0.2)))), // ±20%
      averagePrice24h: Math.max(0.01, base.averagePrice24h * (1 + (Math.random() * 0.3 - 0.15))), // ±15%
      trendIndicator: Math.max(-1, Math.min(1, base.trendIndicator + (Math.random() * 0.4 - 0.2))), // ±0.2
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Detect significant changes in market data
   * 
   * @param previousData Previous market data
   * @param newData New market data
   */
  private detectSignificantChanges(previousData: MarketData, newData: MarketData): void {
    // Check for floor price movements
    if (this.config.enabledDetectionTypes.floorPriceMovements) {
      const floorPriceChange = this.calculatePercentageChange(previousData.floorPrice, newData.floorPrice);
      
      if (Math.abs(floorPriceChange) >= this.config.significanceThresholds.floorPrice) {
        const updateEvent: TrustScoreTypes.UpdateEvent = {
          eventType: 'market_floor_price_change',
          entityId: newData.entityId,
          entityType: newData.entityType,
          timestamp: newData.lastUpdated,
          data: {
            provider: newData.provider,
            previousPrice: previousData.floorPrice,
            newPrice: newData.floorPrice,
            percentageChange: floorPriceChange,
            timeframe: newData.lastUpdated - previousData.lastUpdated
          },
          priority: 7 // Medium-high priority
        };
        
        this.emit('event', updateEvent);
      }
    }
    
    // Check for volume anomalies
    if (this.config.enabledDetectionTypes.volumeAnomalies) {
      // Calculate standard deviation of volume history
      const volumeHistory = newData.volumeHistory;
      const mean = volumeHistory.reduce((sum, vol) => sum + vol, 0) / volumeHistory.length;
      const variance = volumeHistory.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumeHistory.length;
      const stdDev = Math.sqrt(variance);
      
      // Calculate how many standard deviations the current volume is from the mean
      const volumeDeviation = Math.abs(newData.volume24h - mean) / stdDev;
      
      if (volumeDeviation >= this.config.significanceThresholds.volume) {
        const updateEvent: TrustScoreTypes.UpdateEvent = {
          eventType: 'market_volume_anomaly',
          entityId: newData.entityId,
          entityType: newData.entityType,
          timestamp: newData.lastUpdated,
          data: {
            provider: newData.provider,
            currentVolume: newData.volume24h,
            averageVolume: mean,
            standardDeviation: stdDev,
            standardDeviations: volumeDeviation,
            direction: newData.volume24h > mean ? 'increase' : 'decrease'
          },
          priority: 6 // Medium priority
        };
        
        this.emit('event', updateEvent);
      }
    }
    
    // Check for trend shifts
    if (this.config.enabledDetectionTypes.trendShifts) {
      const trendChange = (newData.trendIndicator - previousData.trendIndicator) * 100; // Convert to percentage
      
      if (Math.abs(trendChange) >= this.config.significanceThresholds.trend) {
        const updateEvent: TrustScoreTypes.UpdateEvent = {
          eventType: 'market_trend_shift',
          entityId: newData.entityId,
          entityType: newData.entityType,
          timestamp: newData.lastUpdated,
          data: {
            provider: newData.provider,
            previousTrend: previousData.trendIndicator,
            newTrend: newData.trendIndicator,
            percentageChange: trendChange,
            direction: trendChange > 0 ? 'bullish' : 'bearish'
          },
          priority: 5 // Medium priority
        };
        
        this.emit('event', updateEvent);
      }
    }
    
    // Similar NFT sales and creator portfolio changes would be implemented similarly
    // but require more complex data relationships that are beyond this simulation
  }
  
  /**
   * Calculate percentage change between two values
   * 
   * @param oldValue The old value
   * @param newValue The new value
   * @returns The percentage change
   */
  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    
    return ((newValue - oldValue) / oldValue) * 100;
  }
  
  /**
   * Stop monitoring market conditions
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Clear polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
    
    this.emit('stopped');
  }
  
  /**
   * Get the current status of the market condition event source
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      monitoredEntities: this.lastData.size,
      enabledProviders: this.config.enabledProviders,
      enabledDetectionTypes: this.config.enabledDetectionTypes,
      lastUpdateTime: Math.max(...Array.from(this.lastData.values()).map(data => data.lastUpdated), 0)
    };
  }
}
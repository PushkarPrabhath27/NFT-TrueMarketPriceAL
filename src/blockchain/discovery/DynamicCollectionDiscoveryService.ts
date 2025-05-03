/**
 * DynamicCollectionDiscoveryService.ts
 * Implements dynamic discovery and prioritization of NFT collections based on trading volume
 * and other metrics to ensure the system focuses on the most relevant collections.
 */

import { EventEmitter } from 'events';
import { ContractDiscoveryService, NFTContract } from './ContractDiscoveryService';
import { COLLECTION_DISCOVERY_CONFIG } from './config/DataExtractionTargets';

/**
 * Collection metrics used for prioritization
 */
export interface CollectionMetrics {
  address: string;
  networkId: string;
  dailyVolume: number; // in ETH
  totalVolume: number; // in ETH
  floorPrice?: number; // in ETH
  holderCount?: number;
  transactionCount: number;
  createdAt: Date;
  lastActive: Date;
  discoveredAt: Date;
  priorityScore: number;
}

/**
 * Collection discovery events
 */
export enum DiscoveryEvents {
  COLLECTION_DISCOVERED = 'collection:discovered',
  COLLECTION_PRIORITIZED = 'collection:prioritized',
  COLLECTION_DEPRIORITIZED = 'collection:deprioritized',
  DISCOVERY_COMPLETED = 'discovery:completed',
  DISCOVERY_ERROR = 'discovery:error'
}

/**
 * Dynamic Collection Discovery Service
 * 
 * Discovers and prioritizes NFT collections based on trading volume and other metrics
 * to ensure the system focuses on the most relevant collections.
 */
export class DynamicCollectionDiscoveryService extends EventEmitter {
  private contractDiscovery: ContractDiscoveryService;
  private collectionMetrics: Map<string, CollectionMetrics>; // key: networkId:address
  private activeCollections: Set<string>; // key: networkId:address
  private discoveryInterval?: NodeJS.Timeout;
  private config: typeof COLLECTION_DISCOVERY_CONFIG;
  
  /**
   * Creates a new DynamicCollectionDiscoveryService
   * @param contractDiscovery The contract discovery service
   * @param customConfig Optional custom configuration
   */
  constructor(
    contractDiscovery: ContractDiscoveryService,
    customConfig?: Partial<typeof COLLECTION_DISCOVERY_CONFIG>
  ) {
    super();
    this.contractDiscovery = contractDiscovery;
    this.collectionMetrics = new Map();
    this.activeCollections = new Set();
    this.config = { ...COLLECTION_DISCOVERY_CONFIG, ...customConfig };
    
    // Set up event listeners for contract discovery
    this.setupEventListeners();
  }
  
  /**
   * Sets up event listeners for contract discovery
   */
  private setupEventListeners(): void {
    // Listen for new contracts discovered by the contract discovery service
    this.contractDiscovery.on('contract:discovered', (contract: NFTContract) => {
      this.processDiscoveredContract(contract);
    });
  }
  
  /**
   * Initializes the discovery service with popular collections
   */
  public async initialize(): Promise<void> {
    // Add popular collections from configuration
    for (const [networkId, collections] of Object.entries(this.config.popularCollections)) {
      for (const collection of collections) {
        const key = `${networkId}:${collection.address}`;
        
        // Create initial metrics for popular collection
        const metrics: CollectionMetrics = {
          address: collection.address,
          networkId,
          dailyVolume: 0, // Will be updated when data is fetched
          totalVolume: 0, // Will be updated when data is fetched
          transactionCount: 0,
          createdAt: new Date(),
          lastActive: new Date(),
          discoveredAt: new Date(),
          priorityScore: this.calculateInitialPriorityScore(collection.priority || 5)
        };
        
        this.collectionMetrics.set(key, metrics);
        this.activeCollections.add(key);
        
        // Emit discovery event
        this.emit(DiscoveryEvents.COLLECTION_DISCOVERED, {
          networkId,
          address: collection.address,
          name: collection.name,
          source: 'configuration'
        });
      }
    }
    
    // Start periodic discovery
    this.startPeriodicDiscovery();
  }
  
  /**
   * Starts periodic discovery of new collections
   */
  private startPeriodicDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
    
    this.discoveryInterval = setInterval(
      () => this.performDiscoveryUpdate(),
      this.config.dynamicDiscovery.updateInterval
    );
    
    // Perform initial discovery
    this.performDiscoveryUpdate();
  }
  
  /**
   * Performs a discovery update to find new collections
   */
  private async performDiscoveryUpdate(): Promise<void> {
    try {
      // Fetch data from configured data sources
      for (const dataSource of this.config.dynamicDiscovery.dataSources) {
        try {
          const collections = await this.fetchCollectionsFromDataSource(dataSource);
          this.processDiscoveredCollections(collections, dataSource.name);
        } catch (error) {
          console.error(`Error fetching collections from ${dataSource.name}:`, error);
          this.emit(DiscoveryEvents.DISCOVERY_ERROR, {
            dataSource: dataSource.name,
            error
          });
        }
      }
      
      // Update collection priorities based on latest metrics
      this.updateCollectionPriorities();
      
      this.emit(DiscoveryEvents.DISCOVERY_COMPLETED, {
        timestamp: new Date(),
        activeCollections: this.activeCollections.size,
        totalCollections: this.collectionMetrics.size
      });
    } catch (error) {
      console.error('Error performing discovery update:', error);
      this.emit(DiscoveryEvents.DISCOVERY_ERROR, {
        error
      });
    }
  }
  
  /**
   * Fetches collections from a data source
   * @param dataSource The data source configuration
   * @returns Array of discovered collections
   */
  private async fetchCollectionsFromDataSource(dataSource: any): Promise<any[]> {
    // This is a placeholder for the actual implementation
    // In a real implementation, this would fetch data from the specified API endpoint
    
    // For now, return mock data
    return [
      {
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        networkId: 'ethereum',
        name: `Collection ${Math.floor(Math.random() * 1000)}`,
        dailyVolume: Math.random() * 10,
        totalVolume: Math.random() * 100,
        floorPrice: Math.random() * 1,
        holderCount: Math.floor(Math.random() * 10000),
        transactionCount: Math.floor(Math.random() * 5000)
      }
    ];
  }
  
  /**
   * Processes collections discovered from a data source
   * @param collections The discovered collections
   * @param source The data source name
   */
  private processDiscoveredCollections(collections: any[], source: string): void {
    for (const collection of collections) {
      const { address, networkId, dailyVolume, totalVolume } = collection;
      
      // Skip collections below volume threshold
      if (dailyVolume < this.config.dynamicDiscovery.volumeThreshold) {
        continue;
      }
      
      const key = `${networkId}:${address}`;
      
      // Check if collection is already known
      if (this.collectionMetrics.has(key)) {
        // Update existing metrics
        const metrics = this.collectionMetrics.get(key)!;
        metrics.dailyVolume = dailyVolume;
        metrics.totalVolume = totalVolume;
        metrics.floorPrice = collection.floorPrice;
        metrics.holderCount = collection.holderCount;
        metrics.transactionCount = collection.transactionCount;
        metrics.lastActive = new Date();
        
        this.collectionMetrics.set(key, metrics);
      } else {
        // Create new metrics
        const metrics: CollectionMetrics = {
          address,
          networkId,
          dailyVolume,
          totalVolume,
          floorPrice: collection.floorPrice,
          holderCount: collection.holderCount,
          transactionCount: collection.transactionCount,
          createdAt: new Date(),
          lastActive: new Date(),
          discoveredAt: new Date(),
          priorityScore: this.calculateInitialPriorityScore(3) // Default medium priority
        };
        
        this.collectionMetrics.set(key, metrics);
        
        // Emit discovery event
        this.emit(DiscoveryEvents.COLLECTION_DISCOVERED, {
          networkId,
          address,
          name: collection.name,
          source
        });
      }
    }
  }
  
  /**
   * Processes a contract discovered by the contract discovery service
   * @param contract The discovered contract
   */
  private processDiscoveredContract(contract: NFTContract): void {
    const { address, standard } = contract;
    const networkId = 'ethereum'; // This would be determined from the contract in a real implementation
    
    const key = `${networkId}:${address}`;
    
    // Check if collection is already known
    if (!this.collectionMetrics.has(key)) {
      // Create new metrics with default values
      const metrics: CollectionMetrics = {
        address,
        networkId,
        dailyVolume: 0,
        totalVolume: 0,
        transactionCount: 0,
        createdAt: new Date(),
        lastActive: new Date(),
        discoveredAt: new Date(),
        priorityScore: this.calculateInitialPriorityScore(4) // Default lower-medium priority
      };
      
      this.collectionMetrics.set(key, metrics);
      
      // Emit discovery event
      this.emit(DiscoveryEvents.COLLECTION_DISCOVERED, {
        networkId,
        address,
        standard,
        source: 'contract-discovery'
      });
    }
  }
  
  /**
   * Updates collection priorities based on latest metrics
   */
  private updateCollectionPriorities(): void {
    // Calculate priority scores for all collections
    for (const [key, metrics] of this.collectionMetrics.entries()) {
      metrics.priorityScore = this.calculatePriorityScore(metrics);
      this.collectionMetrics.set(key, metrics);
    }
    
    // Sort collections by priority score
    const sortedCollections = Array.from(this.collectionMetrics.entries())
      .sort((a, b) => b[1].priorityScore - a[1].priorityScore);
    
    // Update active collections based on max limit
    const newActiveCollections = new Set<string>();
    
    for (let i = 0; i < Math.min(sortedCollections.length, this.config.dynamicDiscovery.maxActiveCollections); i++) {
      const [key, metrics] = sortedCollections[i];
      newActiveCollections.add(key);
    }
    
    // Find collections that were activated
    for (const key of newActiveCollections) {
      if (!this.activeCollections.has(key)) {
        const metrics = this.collectionMetrics.get(key)!;
        
        this.emit(DiscoveryEvents.COLLECTION_PRIORITIZED, {
          networkId: metrics.networkId,
          address: metrics.address,
          priorityScore: metrics.priorityScore
        });
      }
    }
    
    // Find collections that were deactivated
    for (const key of this.activeCollections) {
      if (!newActiveCollections.has(key)) {
        const metrics = this.collectionMetrics.get(key)!;
        
        this.emit(DiscoveryEvents.COLLECTION_DEPRIORITIZED, {
          networkId: metrics.networkId,
          address: metrics.address,
          priorityScore: metrics.priorityScore
        });
      }
    }
    
    // Update active collections
    this.activeCollections = newActiveCollections;
  }
  
  /**
   * Calculates the initial priority score for a collection
   * @param basePriority The base priority level (1-5, where 1 is highest)
   * @returns The calculated priority score
   */
  private calculateInitialPriorityScore(basePriority: number): number {
    // Convert priority level to a score (higher is better)
    return 100 - (basePriority * 20);
  }
  
  /**
   * Calculates the priority score for a collection based on its metrics
   * @param metrics The collection metrics
   * @returns The calculated priority score
   */
  private calculatePriorityScore(metrics: CollectionMetrics): number {
    const { dailyVolume, totalVolume, holderCount, transactionCount, createdAt } = metrics;
    
    // Calculate age in days
    const ageInDays = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Base score components
    let score = 0;
    
    // Volume component (0-40 points)
    if (dailyVolume >= this.config.prioritizationCriteria.minDailyVolume) {
      score += Math.min(dailyVolume * 10, 20); // Up to 20 points for daily volume
    }
    
    if (totalVolume >= this.config.prioritizationCriteria.minTotalVolume) {
      score += Math.min(totalVolume, 20); // Up to 20 points for total volume
    }
    
    // Holder count component (0-20 points)
    if (holderCount && holderCount >= this.config.prioritizationCriteria.minHolders) {
      score += Math.min(holderCount / 100, 20); // Up to 20 points for holders
    }
    
    // Transaction count component (0-20 points)
    if (transactionCount >= this.config.prioritizationCriteria.minTransactions) {
      score += Math.min(transactionCount / 100, 20); // Up to 20 points for transactions
    }
    
    // Age component (0-10 points)
    if (ageInDays >= this.config.prioritizationCriteria.minAge) {
      score += Math.min(ageInDays / 10, 10); // Up to 10 points for age
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(score, 100));
  }
  
  /**
   * Gets all active collections
   * @returns Array of active collection metrics
   */
  public getActiveCollections(): CollectionMetrics[] {
    const result: CollectionMetrics[] = [];
    
    for (const key of this.activeCollections) {
      const metrics = this.collectionMetrics.get(key);
      if (metrics) {
        result.push(metrics);
      }
    }
    
    return result;
  }
  
  /**
   * Gets metrics for a specific collection
   * @param networkId The network identifier
   * @param address The collection address
   * @returns The collection metrics or undefined if not found
   */
  public getCollectionMetrics(networkId: string, address: string): CollectionMetrics | undefined {
    return this.collectionMetrics.get(`${networkId}:${address}`);
  }
  
  /**
   * Checks if a collection is active
   * @param networkId The network identifier
   * @param address The collection address
   * @returns True if the collection is active
   */
  public isCollectionActive(networkId: string, address: string): boolean {
    return this.activeCollections.has(`${networkId}:${address}`);
  }
  
  /**
   * Manually adds a collection to be monitored
   * @param networkId The network identifier
   * @param address The collection address
   * @param priority Optional priority level (1-5, where 1 is highest)
   * @returns True if the collection was added, false if it already exists
   */
  public addCollection(networkId: string, address: string, priority: number = 2): boolean {
    const key = `${networkId}:${address}`;
    
    if (this.collectionMetrics.has(key)) {
      return false; // Already exists
    }
    
    // Create new metrics with default values
    const metrics: CollectionMetrics = {
      address,
      networkId,
      dailyVolume: 0,
      totalVolume: 0,
      transactionCount: 0,
      createdAt: new Date(),
      lastActive: new Date(),
      discoveredAt: new Date(),
      priorityScore: this.calculateInitialPriorityScore(priority)
    };
    
    this.collectionMetrics.set(key, metrics);
    this.activeCollections.add(key);
    
    // Emit discovery event
    this.emit(DiscoveryEvents.COLLECTION_DISCOVERED, {
      networkId,
      address,
      source: 'manual'
    });
    
    return true;
  }
  
  /**
   * Stops the discovery service
   */
  public stop(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = undefined;
    }
  }
  
  /**
   * Disposes of resources
   */
  public dispose(): void {
    this.stop();
    this.removeAllListeners();
  }
}
/**
 * NetworkAwareDiscoveryService.ts
 * Extends DynamicCollectionDiscoveryService with network-aware discovery capabilities
 * and enhanced connection management.
 */

import { EventEmitter } from 'events';
import { EnhancedConnectionManager } from '../connection/EnhancedConnectionManager';
import { DynamicCollectionDiscoveryService, CollectionMetrics, DiscoveryEvents } from './DynamicCollectionDiscoveryService';
import { ContractDiscoveryService, NFTContract } from './ContractDiscoveryService';
import { COLLECTION_DISCOVERY_CONFIG } from './config/DataExtractionTargets';

/**
 * Network-specific collection metrics
 */
export interface NetworkCollectionMetrics extends CollectionMetrics {
  networkHealth: number; // 0-100 score based on network reliability
  providerLatency: number; // Average response time in ms
  lastSyncBlock: number; // Last block number synced
  syncStatus: 'synced' | 'syncing' | 'failed';
}

/**
 * Network-aware discovery service events
 */
export enum NetworkDiscoveryEvents {
  NETWORK_SYNC_STARTED = 'network:sync:started',
  NETWORK_SYNC_COMPLETED = 'network:sync:completed',
  NETWORK_SYNC_FAILED = 'network:sync:failed',
  PROVIDER_SWITCHED = 'network:provider:switched',
  RATE_LIMIT_EXCEEDED = 'network:rate:exceeded'
}

/**
 * Network-aware collection discovery service
 * Enhances the base discovery service with network-specific features
 */
export class NetworkAwareDiscoveryService extends EventEmitter {
  private discoveryServices: Map<string, DynamicCollectionDiscoveryService>;
  private connectionManager: EnhancedConnectionManager;
  private networkMetrics: Map<string, NetworkCollectionMetrics[]>;
  private syncIntervals: Map<string, NodeJS.Timeout>;
  private config: typeof COLLECTION_DISCOVERY_CONFIG;

  /**
   * Creates a new NetworkAwareDiscoveryService
   * @param connectionManager The enhanced connection manager
   * @param customConfig Optional custom configuration
   */
  constructor(
    connectionManager: EnhancedConnectionManager,
    customConfig?: Partial<typeof COLLECTION_DISCOVERY_CONFIG>
  ) {
    super();
    this.connectionManager = connectionManager;
    this.discoveryServices = new Map();
    this.networkMetrics = new Map();
    this.syncIntervals = new Map();
    this.config = { ...COLLECTION_DISCOVERY_CONFIG, ...customConfig };

    this.setupConnectionListeners();
  }

  /**
   * Sets up listeners for connection manager events
   */
  private setupConnectionListeners(): void {
    // Handle provider switches
    this.connectionManager.on('provider:switched', ({ networkId, providerUrl }) => {
      this.emit(NetworkDiscoveryEvents.PROVIDER_SWITCHED, { networkId, providerUrl });
      this.restartNetworkSync(networkId);
    });

    // Handle network disconnections
    this.connectionManager.on('network:disconnected', ({ networkId }) => {
      this.pauseNetworkSync(networkId);
    });

    // Handle network reconnections
    this.connectionManager.on('network:connected', ({ networkId }) => {
      this.resumeNetworkSync(networkId);
    });
  }

  /**
   * Initializes discovery for all supported networks
   */
  public async initialize(): Promise<void> {
    const networks = this.connectionManager.getAllNetworkStatuses();

    for (const [networkId, status] of networks.entries()) {
      if (status.isConnected) {
        await this.initializeNetwork(networkId);
      }
    }
  }

  /**
   * Initializes discovery for a specific network
   * @param networkId The network identifier
   */
  private async initializeNetwork(networkId: string): Promise<void> {
    try {
      // Create contract discovery service for the network
      const contractDiscovery = new ContractDiscoveryService(
        await this.connectionManager.getProvider(networkId),
        {
          blockConfirmations: 12,
          scanBatchSize: 1000,
          retryAttempts: 3,
          retryDelay: 1000
        }
      );

      // Create discovery service for the network
      const discoveryService = new DynamicCollectionDiscoveryService(
        contractDiscovery,
        this.config
      );

      // Store the service
      this.discoveryServices.set(networkId, discoveryService);

      // Initialize the service
      await discoveryService.initialize();

      // Start periodic sync
      this.startNetworkSync(networkId);

      // Forward relevant events
      this.forwardDiscoveryEvents(networkId, discoveryService);
    } catch (error) {
      console.error(`Error initializing network ${networkId}:`, error);
      this.emit(NetworkDiscoveryEvents.NETWORK_SYNC_FAILED, {
        networkId,
        error
      });
    }
  }

  /**
   * Starts periodic sync for a network
   * @param networkId The network identifier
   */
  private startNetworkSync(networkId: string): void {
    if (this.syncIntervals.has(networkId)) {
      clearInterval(this.syncIntervals.get(networkId)!);
    }

    const interval = setInterval(
      () => this.syncNetwork(networkId),
      this.config.dynamicDiscovery.updateInterval
    );

    this.syncIntervals.set(networkId, interval);
    this.syncNetwork(networkId); // Perform initial sync
  }

  /**
   * Syncs collection data for a specific network
   * @param networkId The network identifier
   */
  private async syncNetwork(networkId: string): Promise<void> {
    const discoveryService = this.discoveryServices.get(networkId);
    if (!discoveryService) return;

    try {
      this.emit(NetworkDiscoveryEvents.NETWORK_SYNC_STARTED, { networkId });

      // Get network health metrics
      const networkStatus = this.connectionManager.getNetworkStatus(networkId);
      const networkHealth = this.calculateNetworkHealth(networkStatus);

      // Update collection metrics with network information
      const collections = discoveryService.getActiveCollections();
      const updatedMetrics: NetworkCollectionMetrics[] = collections.map(metrics => ({
        ...metrics,
        networkHealth,
        providerLatency: networkStatus.activeProvider?.health.responseTime || 0,
        lastSyncBlock: 0, // This would be updated with actual block number
        syncStatus: 'synced'
      }));

      this.networkMetrics.set(networkId, updatedMetrics);

      this.emit(NetworkDiscoveryEvents.NETWORK_SYNC_COMPLETED, {
        networkId,
        collectionsCount: collections.length,
        networkHealth
      });
    } catch (error) {
      console.error(`Error syncing network ${networkId}:`, error);
      this.emit(NetworkDiscoveryEvents.NETWORK_SYNC_FAILED, {
        networkId,
        error
      });
    }
  }

  /**
   * Calculates network health score based on provider metrics
   * @param status The network status
   * @returns Network health score (0-100)
   */
  private calculateNetworkHealth(status: any): number {
    if (!status.activeProvider) return 0;

    const {
      responseTime,
      errorRate,
      consecutiveFailures
    } = status.activeProvider.health;

    // Calculate health score components
    const latencyScore = Math.max(0, 100 - (responseTime / 100)); // Penalize high latency
    const errorScore = Math.max(0, 100 - (errorRate * 100)); // Penalize high error rates
    const reliabilityScore = Math.max(0, 100 - (consecutiveFailures * 20)); // Penalize failures

    // Weighted average of components
    return Math.floor(
      (latencyScore * 0.3) +
      (errorScore * 0.4) +
      (reliabilityScore * 0.3)
    );
  }

  /**
   * Forwards relevant events from a discovery service
   * @param networkId The network identifier
   * @param service The discovery service
   */
  private forwardDiscoveryEvents(
    networkId: string,
    service: DynamicCollectionDiscoveryService
  ): void {
    // Forward collection discovery events with network context
    service.on(DiscoveryEvents.COLLECTION_DISCOVERED, (data) => {
      this.emit(DiscoveryEvents.COLLECTION_DISCOVERED, {
        ...data,
        networkId
      });
    });

    // Forward other relevant events
    service.on(DiscoveryEvents.DISCOVERY_ERROR, (data) => {
      this.emit(DiscoveryEvents.DISCOVERY_ERROR, {
        ...data,
        networkId
      });
    });
  }

  /**
   * Pauses sync for a network
   * @param networkId The network identifier
   */
  private pauseNetworkSync(networkId: string): void {
    const interval = this.syncIntervals.get(networkId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(networkId);
    }
  }

  /**
   * Resumes sync for a network
   * @param networkId The network identifier
   */
  private resumeNetworkSync(networkId: string): void {
    this.startNetworkSync(networkId);
  }

  /**
   * Restarts sync for a network
   * @param networkId The network identifier
   */
  private restartNetworkSync(networkId: string): void {
    this.pauseNetworkSync(networkId);
    this.resumeNetworkSync(networkId);
  }

  /**
   * Gets network-aware metrics for a collection
   * @param networkId The network identifier
   * @param address The collection address
   * @returns The collection metrics with network information
   */
  public getNetworkCollectionMetrics(
    networkId: string,
    address: string
  ): NetworkCollectionMetrics | undefined {
    const networkMetrics = this.networkMetrics.get(networkId);
    if (!networkMetrics) return undefined;

    return networkMetrics.find(metrics => metrics.address === address);
  }

  /**
   * Gets all active collections for a network
   * @param networkId The network identifier
   * @returns Array of network-aware collection metrics
   */
  public getNetworkActiveCollections(networkId: string): NetworkCollectionMetrics[] {
    return this.networkMetrics.get(networkId) || [];
  }

  /**
   * Stops all discovery services
   */
  public stop(): void {
    for (const [networkId, interval] of this.syncIntervals.entries()) {
      clearInterval(interval);
      const service = this.discoveryServices.get(networkId);
      if (service) {
        service.stop();
      }
    }

    this.syncIntervals.clear();
  }

  /**
   * Disposes of resources
   */
  public dispose(): void {
    this.stop();
    for (const service of this.discoveryServices.values()) {
      service.dispose();
    }
    this.discoveryServices.clear();
    this.networkMetrics.clear();
    this.removeAllListeners();
  }
}
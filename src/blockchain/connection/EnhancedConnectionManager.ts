/**
 * EnhancedConnectionManager.ts
 * Comprehensive connection manager that integrates health monitoring and rate limiting
 * for reliable blockchain data extraction
 */

import { EventEmitter } from 'events';
import { BLOCKCHAIN_NETWORKS, HEALTH_MONITORING_CONFIG, RATE_LIMITING_CONFIG } from './config/BlockchainNetworkConfig';
import { NetworkConfig, ProviderEndpoint } from './interfaces/ConnectionConfig';
import { ConnectionHealthMonitor, HealthMonitorEvents, ProviderHealth } from './monitoring/ConnectionHealthMonitor';
import { RateLimiter, RequestPriority } from './rate/RateLimiter';

/**
 * Connection status for a blockchain network
 */
export interface NetworkConnectionStatus {
  networkId: string;
  networkName: string;
  isConnected: boolean;
  activeProvider?: {
    url: string;
    health: ProviderHealth;
  };
  availableProviders: {
    url: string;
    health: ProviderHealth;
    priority: number;
  }[];
  lastError?: Error;
  lastSwitchTime?: Date;
}

/**
 * Enhanced Connection Manager Events
 */
export enum ConnectionManagerEvents {
  PROVIDER_SWITCHED = 'provider:switched',
  NETWORK_CONNECTED = 'network:connected',
  NETWORK_DISCONNECTED = 'network:disconnected',
  CONNECTION_ERROR = 'connection:error',
  RATE_LIMIT_EXCEEDED = 'rate:exceeded',
  HEALTH_DEGRADED = 'health:degraded'
}

/**
 * Enhanced Connection Manager
 * 
 * Manages blockchain connections with automatic failover, health monitoring,
 * and rate limiting to ensure reliable data extraction.
 */
export class EnhancedConnectionManager extends EventEmitter {
  private networks: Map<string, NetworkConfig>;
  private activeProviders: Map<string, ProviderEndpoint>;
  private healthMonitor: ConnectionHealthMonitor;
  private rateLimiter: RateLimiter;
  private providers: Map<string, any>; // Actual provider instances
  
  /**
   * Creates a new EnhancedConnectionManager
   */
  constructor() {
    super();
    this.networks = new Map();
    this.activeProviders = new Map();
    this.providers = new Map();
    
    // Initialize health monitor and rate limiter
    this.healthMonitor = new ConnectionHealthMonitor();
    this.rateLimiter = new RateLimiter();
    
    // Set up event listeners for health monitor
    this.setupHealthMonitorListeners();
    
    // Load network configurations
    this.loadNetworkConfigurations();
  }
  
  /**
   * Sets up event listeners for the health monitor
   */
  private setupHealthMonitorListeners(): void {
    // Handle provider failure events
    this.healthMonitor.on(HealthMonitorEvents.PROVIDER_FAILED, async (data) => {
      const { networkId, providerUrl } = data;
      
      // Check if this is the active provider
      const activeProvider = this.activeProviders.get(networkId);
      if (activeProvider && activeProvider.url === providerUrl) {
        // Switch to a healthy provider
        await this.switchToHealthyProvider(networkId);
      }
    });
    
    // Handle provider degraded events
    this.healthMonitor.on(HealthMonitorEvents.PROVIDER_DEGRADED, (data) => {
      const { networkId, providerUrl } = data;
      
      this.emit(ConnectionManagerEvents.HEALTH_DEGRADED, {
        networkId,
        providerUrl,
        message: `Provider ${providerUrl} for network ${networkId} is experiencing degraded performance`
      });
    });
    
    // Handle provider recovered events
    this.healthMonitor.on(HealthMonitorEvents.PROVIDER_RECOVERED, (data) => {
      // No action needed, but could be used for logging or metrics
    });
  }
  
  /**
   * Loads network configurations from the config file
   */
  private loadNetworkConfigurations(): void {
    // Load networks from configuration
    for (const [networkId, config] of Object.entries(BLOCKCHAIN_NETWORKS)) {
      this.networks.set(networkId, config);
    }
  }
  
  /**
   * Initializes connections for all configured networks
   */
  public async initializeConnections(): Promise<void> {
    const initPromises: Promise<void>[] = [];
    
    for (const networkId of this.networks.keys()) {
      initPromises.push(this.connectToNetwork(networkId));
    }
    
    await Promise.all(initPromises);
  }
  
  /**
   * Connects to a specific blockchain network
   * @param networkId The network identifier
   */
  public async connectToNetwork(networkId: string): Promise<void> {
    const networkConfig = this.networks.get(networkId);
    if (!networkConfig) {
      throw new Error(`Network configuration not found for ${networkId}`);
    }
    
    // Register all providers with health monitor and rate limiter
    for (const provider of networkConfig.providers) {
      this.healthMonitor.registerProvider(networkId, provider);
      this.rateLimiter.registerProvider(
        networkId,
        provider.url,
        provider.maxRequestsPerMinute || 60 // Default to 60 requests per minute
      );
    }
    
    // Connect to the highest priority provider
    await this.switchToHealthyProvider(networkId);
    
    this.emit(ConnectionManagerEvents.NETWORK_CONNECTED, {
      networkId,
      networkName: networkConfig.networkName
    });
  }
  
  /**
   * Switches to a healthy provider for a network
   * @param networkId The network identifier
   */
  private async switchToHealthyProvider(networkId: string): Promise<void> {
    const networkConfig = this.networks.get(networkId);
    if (!networkConfig) {
      throw new Error(`Network configuration not found for ${networkId}`);
    }
    
    // Get all providers sorted by priority
    const sortedProviders = [...networkConfig.providers].sort((a, b) => a.priority - b.priority);
    
    // Find the first healthy provider
    for (const provider of sortedProviders) {
      const health = this.healthMonitor.getProviderHealth(networkId, provider.url);
      
      // Skip unhealthy providers
      if (!health || !health.isHealthy) {
        continue;
      }
      
      try {
        // Create actual provider instance
        const providerInstance = await this.createProviderInstance(networkId, provider);
        
        // Store provider instance
        const providerKey = `${networkId}:${provider.url}`;
        this.providers.set(providerKey, providerInstance);
        
        // Update active provider
        this.activeProviders.set(networkId, provider);
        
        // Emit provider switched event
        this.emit(ConnectionManagerEvents.PROVIDER_SWITCHED, {
          networkId,
          networkName: networkConfig.networkName,
          providerUrl: provider.url,
          timestamp: new Date()
        });
        
        return;
      } catch (error) {
        // Failed to create provider instance, try next one
        console.error(`Failed to create provider instance for ${provider.url}:`, error);
      }
    }
    
    // If we get here, all providers are unhealthy
    this.emit(ConnectionManagerEvents.NETWORK_DISCONNECTED, {
      networkId,
      networkName: networkConfig.networkName,
      error: new Error(`No healthy providers available for network ${networkId}`)
    });
    
    throw new Error(`No healthy providers available for network ${networkId}`);
  }
  
  /**
   * Creates a provider instance for a specific network and provider
   * @param networkId The network identifier
   * @param provider The provider endpoint
   * @returns The provider instance
   */
  private async createProviderInstance(networkId: string, provider: ProviderEndpoint): Promise<any> {
    // This is a placeholder for the actual implementation
    // In a real implementation, this would create the appropriate provider instance
    // based on the network type (Ethereum, Polygon, Solana, etc.)
    
    // For now, just return a mock provider
    return {
      networkId,
      url: provider.url,
      isConnected: true,
      // Add methods that would be available on the actual provider
      getBlockNumber: async () => Math.floor(Math.random() * 1000000),
      getBalance: async (address: string) => Math.floor(Math.random() * 1000000000),
      // ... other methods
    };
  }
  
  /**
   * Executes a request against the active provider for a network
   * @param networkId The network identifier
   * @param requestFn Function that executes the request given a provider
   * @param priority Request priority
   * @returns The request result
   */
  public async executeRequest<T>(
    networkId: string,
    requestFn: (provider: any) => Promise<T>,
    priority: RequestPriority = RequestPriority.MEDIUM
  ): Promise<T> {
    const activeProvider = this.activeProviders.get(networkId);
    if (!activeProvider) {
      throw new Error(`No active provider for network ${networkId}`);
    }
    
    const providerKey = `${networkId}:${activeProvider.url}`;
    const provider = this.providers.get(providerKey);
    
    if (!provider) {
      throw new Error(`Provider instance not found for ${activeProvider.url}`);
    }
    
    // Schedule the request with the rate limiter
    return this.rateLimiter.scheduleRequest(
      networkId,
      activeProvider.url,
      () => requestFn(provider),
      priority
    );
  }
  
  /**
   * Gets the connection status for a network
   * @param networkId The network identifier
   * @returns The network connection status
   */
  public getNetworkStatus(networkId: string): NetworkConnectionStatus {
    const networkConfig = this.networks.get(networkId);
    if (!networkConfig) {
      throw new Error(`Network configuration not found for ${networkId}`);
    }
    
    const activeProvider = this.activeProviders.get(networkId);
    const isConnected = !!activeProvider;
    
    // Get health status for all providers
    const availableProviders = networkConfig.providers.map(provider => {
      const health = this.healthMonitor.getProviderHealth(networkId, provider.url) || {
        providerUrl: provider.url,
        isHealthy: false,
        lastChecked: new Date(),
        responseTime: 0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        errorRate: 0,
        status: 'FAILED'
      };
      
      return {
        url: provider.url,
        health,
        priority: provider.priority
      };
    });
    
    const status: NetworkConnectionStatus = {
      networkId,
      networkName: networkConfig.networkName,
      isConnected,
      availableProviders
    };
    
    // Add active provider details if connected
    if (isConnected && activeProvider) {
      const health = this.healthMonitor.getProviderHealth(networkId, activeProvider.url)!;
      status.activeProvider = {
        url: activeProvider.url,
        health
      };
    }
    
    return status;
  }
  
  /**
   * Gets the status for all networks
   * @returns Map of network statuses
   */
  public getAllNetworkStatuses(): Map<string, NetworkConnectionStatus> {
    const statuses = new Map<string, NetworkConnectionStatus>();
    
    for (const networkId of this.networks.keys()) {
      try {
        const status = this.getNetworkStatus(networkId);
        statuses.set(networkId, status);
      } catch (error) {
        console.error(`Error getting status for network ${networkId}:`, error);
      }
    }
    
    return statuses;
  }
  
  /**
   * Disconnects from a specific network
   * @param networkId The network identifier
   */
  public disconnectFromNetwork(networkId: string): void {
    const networkConfig = this.networks.get(networkId);
    if (!networkConfig) {
      return; // Network not found, nothing to disconnect
    }
    
    // Stop health monitoring for all providers
    for (const provider of networkConfig.providers) {
      this.healthMonitor.stopMonitoring(networkId, provider.url);
      
      // Clear rate limiter queue
      this.rateLimiter.clearQueue(networkId, provider.url, 'Network disconnected');
      
      // Remove provider instance
      const providerKey = `${networkId}:${provider.url}`;
      this.providers.delete(providerKey);
    }
    
    // Remove active provider
    this.activeProviders.delete(networkId);
    
    this.emit(ConnectionManagerEvents.NETWORK_DISCONNECTED, {
      networkId,
      networkName: networkConfig.networkName
    });
  }
  
  /**
   * Disconnects from all networks
   */
  public disconnectAll(): void {
    for (const networkId of this.networks.keys()) {
      this.disconnectFromNetwork(networkId);
    }
  }
  
  /**
   * Cleans up resources when the manager is no longer needed
   */
  public dispose(): void {
    this.disconnectAll();
    this.healthMonitor.stopAllMonitoring();
    this.removeAllListeners();
  }
}
import { EventEmitter } from 'events';
import NetworkMonitor from './NetworkMonitor';
import CircuitBreaker from './CircuitBreaker';

interface ConnectionConfig {
  chainId: string;
  rpcUrl: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    initialRetryDelay: number;
    maxRetryDelay: number;
  };
}

interface ConnectionStatus {
  chainId: string;
  isConnected: boolean;
  lastError?: Error;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  networkStats?: {
    responseTime: number;
    errorRate: number;
    congestionLevel: 'low' | 'medium' | 'high';
    consecutiveFailures: number;
    lastFailureTime?: Date;
    recoveryAttempts: number;
  };
  lastReorgEvent?: {
    oldBlock: string;
    newBlock: string;
    depth: number;
    timestamp: Date;
  };
}

class ConnectionManager extends EventEmitter {
  private connections: Map<string, any>;
  private networkMonitor: NetworkMonitor;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private configs: Map<string, ConnectionConfig>;

  constructor() {
    super();
    this.connections = new Map();
    this.networkMonitor = new NetworkMonitor();
    this.circuitBreakers = new Map();
    this.configs = new Map();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.networkMonitor.on('statusUpdate', ({ chainId, stats }) => {
      this.emit('networkStatusUpdate', { chainId, stats });
      this.handleNetworkStatusChange(chainId, stats);
    });

    this.networkMonitor.on('chainReorg', (reorgEvent) => {
      this.emit('chainReorg', reorgEvent);
      this.handleChainReorg(reorgEvent);
    });

    this.networkMonitor.subscribeToAlerts((alert) => {
      this.handleNetworkAlert(alert);
    });
  }

  public async addConnection(config: ConnectionConfig): Promise<void> {
    const { chainId, rpcUrl, timeout = 30000, retryConfig } = config;

    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      ...retryConfig
    });

    this.circuitBreakers.set(chainId, circuitBreaker);
    this.configs.set(chainId, config);

    try {
      await this.connectWithRetry(chainId, rpcUrl, timeout);
    } catch (error) {
      this.emit('connectionError', { chainId, error });
      throw error;
    }
  }

  private async connectWithRetry(chainId: string, rpcUrl: string, timeout: number): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(chainId)!;
    const config = this.configs.get(chainId)!;
    let retryCount = 0;
    const maxRetries = config.retryConfig?.maxRetries || 3;

    while (retryCount < maxRetries) {
      try {
        await circuitBreaker.execute(
          async () => {
            const startTime = Date.now();
            try {
              // Implement actual blockchain connection logic here
              const connection = await this.createConnection(rpcUrl, timeout);
              this.connections.set(chainId, connection);

              const responseTime = Date.now() - startTime;
              this.networkMonitor.trackResponseTime(chainId, responseTime);

              this.emit('connected', { chainId });
              return;
            } catch (error) {
              this.networkMonitor.trackError(chainId);
              throw error;
            }
          },
          async () => {
            // Try alternative RPC endpoint if available
            const alternativeEndpoint = await this.findAlternativeEndpoint(chainId);
            if (alternativeEndpoint) {
              return this.createConnection(alternativeEndpoint, timeout);
            }
            throw new Error(`Failed to connect to ${chainId} - no alternative endpoints available`);
          }
        );
        break; // Connection successful, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to connect to ${chainId} after ${maxRetries} attempts`);
        }
        // Exponential backoff
        const delay = Math.min(
          (config.retryConfig?.initialRetryDelay || 1000) * Math.pow(2, retryCount),
          config.retryConfig?.maxRetryDelay || 30000
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async createConnection(rpcUrl: string, timeout: number): Promise<any> {
    // Placeholder for actual blockchain connection implementation
    // This should be implemented based on the specific blockchain client library being used
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate connection success
        resolve({ connected: true });
      }, Math.random() * 1000); // Simulate variable connection time
    });
  }

  public async executeRequest<T>(
    chainId: string,
    request: () => Promise<T>
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(chainId);
    if (!circuitBreaker) {
      throw new Error(`No circuit breaker found for chain ${chainId}`);
    }

    const startTime = Date.now();
    try {
      const result = await circuitBreaker.execute(
        async () => {
          const response = await request();
          const responseTime = Date.now() - startTime;
          this.networkMonitor.trackResponseTime(chainId, responseTime);
          return response;
        },
        async () => {
          throw new Error(`Request failed for chain ${chainId}`);
        }
      );

      return result;
    } catch (error) {
      this.networkMonitor.trackError(chainId);
      throw error;
    }
  }

  public getConnectionStatus(chainId: string): ConnectionStatus {
    const connection = this.connections.get(chainId);
    const circuitBreaker = this.circuitBreakers.get(chainId);
    const networkStats = this.networkMonitor.getNetworkStats(chainId);

    return {
      chainId,
      isConnected: !!connection,
      circuitBreakerState: circuitBreaker?.getState() || 'CLOSED',
      networkStats: networkStats ? {
        responseTime: networkStats.responseTime,
        errorRate: networkStats.errorRate,
        congestionLevel: networkStats.congestionLevel
      } : undefined
    };
  }

  private async findAlternativeEndpoint(chainId: string): Promise<string | null> {
    // Implement logic to find alternative RPC endpoint
    // This could involve maintaining a list of backup endpoints or service discovery
    return null;
  }

  private handleNetworkStatusChange(chainId: string, stats: any): void {
    if (stats.status === 'failing' && stats.consecutiveFailures >= 3) {
      this.attemptRecovery(chainId);
    }
  }

  private handleChainReorg(reorgEvent: any): void {
    const { chainId, depth } = reorgEvent;
    if (depth > 3) { // Deep reorg threshold
      this.emit('deepReorg', reorgEvent);
      this.attemptRecovery(chainId);
    }
  }

  private handleNetworkAlert(alert: any): void {
    switch (alert.type) {
      case 'failure':
        this.emit('networkFailure', alert);
        this.attemptRecovery(alert.chainId);
        break;
      case 'degraded':
        this.emit('networkDegraded', alert);
        break;
      case 'recovery':
        this.emit('networkRecovered', alert);
        break;
      case 'reorg':
        this.emit('chainReorganization', alert);
        break;
    }
  }

  private async attemptRecovery(chainId: string): Promise<void> {
    const connection = this.connections.get(chainId);
    if (!connection) return;

    try {
      // Reset circuit breaker and attempt reconnection
      this.circuitBreakers.get(chainId)?.reset();
      await this.disconnect(chainId);
      await this.connectWithRetry(
        chainId,
        this.configs.get(chainId)!.rpcUrl,
        this.configs.get(chainId)!.timeout || 30000
      );
    } catch (error) {
      this.emit('recoveryFailed', { chainId, error });
    }
  }

  public async disconnect(chainId: string): Promise<void> {
    const connection = this.connections.get(chainId);
    if (connection) {
      try {
        // Implement actual disconnection logic here
        await this.gracefulDisconnect(connection);
        this.connections.delete(chainId);
        this.circuitBreakers.get(chainId)?.reset();
        this.emit('disconnected', { chainId });
      } catch (error) {
        this.emit('disconnectionError', { chainId, error });
        throw error;
      }
    }
  }

  private async gracefulDisconnect(connection: any): Promise<void> {
    try {
      // Wait for any pending requests to complete (timeout after 5 seconds)
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, 5000)),
        this.waitForPendingRequests(connection)
      ]);

      // Close the connection
      if (typeof connection.close === 'function') {
        await connection.close();
      } else if (typeof connection.disconnect === 'function') {
        await connection.disconnect();
      } else if (typeof connection.terminate === 'function') {
        await connection.terminate();
      }

      // Clear any remaining resources
      if (connection.removeAllListeners) {
        connection.removeAllListeners();
      }
    } catch (error) {
      throw new Error(`Failed to gracefully disconnect: ${error.message}`);
    }
  }

  private async waitForPendingRequests(connection: any): Promise<void> {
    // Check if the connection has a method to track pending requests
    if (typeof connection.getPendingRequests === 'function') {
      const pendingRequests = await connection.getPendingRequests();
      await Promise.all(pendingRequests);
    }
  }

  public async disconnectAll(): Promise<void> {
    const chainIds = Array.from(this.connections.keys());
    await Promise.all(chainIds.map(chainId => this.disconnect(chainId)));
  }
}

export default ConnectionManager;
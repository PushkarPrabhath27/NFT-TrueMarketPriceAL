import { EventEmitter } from 'events';

interface NetworkStats {
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  status: 'healthy' | 'degraded' | 'failing';
  congestionLevel: 'low' | 'medium' | 'high';
  consecutiveFailures: number;
  lastFailureTime?: Date;
  recoveryAttempts: number;
}

interface ChainReorgEvent {
  chainId: string;
  oldBlock: string;
  newBlock: string;
  depth: number;
  timestamp: Date;
}

class NetworkMonitor extends EventEmitter {
  private stats: Map<string, NetworkStats>;
  private readonly checkInterval: number;
  private readonly errorThreshold: number;
  private readonly responseTimeThreshold: number;
  private reorgHistory: Map<string, ChainReorgEvent[]>;

  private readonly maxConsecutiveFailures: number;
  private readonly recoveryThreshold: number;
  private alertSubscribers: Set<(alert: NetworkAlert) => void>;

  constructor(
    checkIntervalMs = 30000,
    errorThreshold = 0.1,
    responseTimeThreshold = 5000,
    maxConsecutiveFailures = 3,
    recoveryThreshold = 2
  ) {
    super();
    this.stats = new Map();
    this.reorgHistory = new Map();
    this.checkInterval = checkIntervalMs;
    this.errorThreshold = errorThreshold;
    this.responseTimeThreshold = responseTimeThreshold;
    this.maxConsecutiveFailures = maxConsecutiveFailures;
    this.recoveryThreshold = recoveryThreshold;
    this.alertSubscribers = new Set();
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    setInterval(() => this.checkNetworkHealth(), this.checkInterval);
  }

  public trackResponseTime(chainId: string, responseTime: number): void {
    const currentStats = this.getOrCreateStats(chainId);
    currentStats.responseTime = responseTime;
    currentStats.lastChecked = new Date();
    this.updateNetworkStatus(chainId, currentStats);
  }

  public trackError(chainId: string): void {
    const currentStats = this.getOrCreateStats(chainId);
    currentStats.errorRate = (currentStats.errorRate + 1) / 2; // Rolling average
    currentStats.lastChecked = new Date();
    this.updateNetworkStatus(chainId, currentStats);
  }

  public detectChainReorg(chainId: string, oldBlock: string, newBlock: string, depth: number): void {
    const reorgEvent: ChainReorgEvent = {
      chainId,
      oldBlock,
      newBlock,
      depth,
      timestamp: new Date()
    };

    const chainReorgs = this.reorgHistory.get(chainId) || [];
    chainReorgs.push(reorgEvent);
    this.reorgHistory.set(chainId, chainReorgs);

    this.emit('chainReorg', reorgEvent);
  }

  public getNetworkStats(chainId: string): NetworkStats | undefined {
    return this.stats.get(chainId);
  }

  public getReorgHistory(chainId: string): ChainReorgEvent[] {
    return this.reorgHistory.get(chainId) || [];
  }

  private getOrCreateStats(chainId: string): NetworkStats {
    if (!this.stats.has(chainId)) {
      this.stats.set(chainId, {
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date(),
        status: 'healthy',
        congestionLevel: 'low',
        consecutiveFailures: 0,
        recoveryAttempts: 0
      });
    }
    return this.stats.get(chainId)!;
  }

interface NetworkAlert {
  type: 'failure' | 'degraded' | 'recovery' | 'reorg';
  chainId: string;
  message: string;
  timestamp: Date;
  stats: NetworkStats;
}

  public subscribeToAlerts(callback: (alert: NetworkAlert) => void): void {
    this.alertSubscribers.add(callback);
  }

  public unsubscribeFromAlerts(callback: (alert: NetworkAlert) => void): void {
    this.alertSubscribers.delete(callback);
  }

  private emitAlert(alert: NetworkAlert): void {
    this.alertSubscribers.forEach(callback => callback(alert));
  }

  private updateNetworkStatus(chainId: string, stats: NetworkStats): void {
    const previousStatus = stats.status;
    
    // Update status based on error rate and response time
    if (stats.errorRate >= this.errorThreshold || stats.responseTime >= this.responseTimeThreshold) {
      stats.status = 'failing';
      stats.consecutiveFailures++;
      stats.lastFailureTime = new Date();
      
      if (stats.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.emitAlert({
          type: 'failure',
          chainId,
          message: `Network ${chainId} has failed ${stats.consecutiveFailures} times consecutively`,
          timestamp: new Date(),
          stats
        });
      }
    } else if (stats.errorRate >= this.errorThreshold / 2 || stats.responseTime >= this.responseTimeThreshold / 2) {
      stats.status = 'degraded';
      this.emitAlert({
        type: 'degraded',
        chainId,
        message: `Network ${chainId} performance is degraded`,
        timestamp: new Date(),
        stats
      });
    } else {
      stats.status = 'healthy';
      if (previousStatus !== 'healthy') {
        stats.recoveryAttempts++;
        if (stats.recoveryAttempts >= this.recoveryThreshold) {
          this.emitAlert({
            type: 'recovery',
            chainId,
            message: `Network ${chainId} has recovered after ${stats.consecutiveFailures} failures`,
            timestamp: new Date(),
            stats
          });
          stats.consecutiveFailures = 0;
          stats.recoveryAttempts = 0;
        }
      }
    }

    // Update congestion level
    if (stats.responseTime >= this.responseTimeThreshold) {
      stats.congestionLevel = 'high';
    } else if (stats.responseTime >= this.responseTimeThreshold / 2) {
      stats.congestionLevel = 'medium';
    } else {
      stats.congestionLevel = 'low';
    }

    this.emit('statusUpdate', { chainId, stats });
  }

  private checkNetworkHealth(): void {
    for (const [chainId, stats] of this.stats) {
      const timeSinceLastCheck = Date.now() - stats.lastChecked.getTime();
      const previousStatus = stats.status;

      // Check for stale connections
      if (timeSinceLastCheck > this.checkInterval * 2) {
        stats.status = 'failing';
        stats.consecutiveFailures++;
        stats.lastFailureTime = new Date();

        this.emitAlert({
          type: 'failure',
          chainId,
          message: `Network ${chainId} connection is stale - no updates for ${Math.floor(timeSinceLastCheck / 1000)}s`,
          timestamp: new Date(),
          stats
        });
      }

      // Check for high error rates
      if (stats.errorRate > this.errorThreshold) {
        stats.status = 'failing';
        stats.consecutiveFailures++;
        stats.lastFailureTime = new Date();
      }

      // Check for high response times
      if (stats.responseTime > this.responseTimeThreshold) {
        if (stats.status !== 'failing') {
          stats.status = 'degraded';
          this.emitAlert({
            type: 'degraded',
            chainId,
            message: `Network ${chainId} is experiencing high latency`,
            timestamp: new Date(),
            stats
          });
        }
      }

      // Check for recovery
      if (stats.status === 'healthy' && previousStatus !== 'healthy') {
        stats.recoveryAttempts++;
        if (stats.recoveryAttempts >= this.recoveryThreshold) {
          this.emitAlert({
            type: 'recovery',
            chainId,
            message: `Network ${chainId} has recovered`,
            timestamp: new Date(),
            stats
          });
          stats.consecutiveFailures = 0;
          stats.recoveryAttempts = 0;
        }
      }

      // Update network status
      this.emit('statusUpdate', { chainId, stats });
    }
  }
}

export default NetworkMonitor;
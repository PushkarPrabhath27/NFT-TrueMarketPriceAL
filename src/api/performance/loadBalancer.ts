/**
 * NFT TrustScore API Load Balancer
 * 
 * This module implements load balancing and scaling capabilities for the NFT TrustScore API,
 * including request distribution, health checks, and auto-scaling triggers.
 */

import { EventEmitter } from 'events';
import { config } from '../config';

// Instance health status
export enum InstanceStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  STARTING = 'starting',
  STOPPING = 'stopping',
  TERMINATED = 'terminated'
}

// Instance interface
export interface Instance {
  id: string;
  host: string;
  port: number;
  status: InstanceStatus;
  healthScore: number;
  lastHealthCheck: Date;
  metrics: InstanceMetrics;
}

// Instance metrics
export interface InstanceMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
}

// Load balancing algorithms
export enum LoadBalancingAlgorithm {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  WEIGHTED_RESPONSE_TIME = 'weighted_response_time',
  CONSISTENT_HASHING = 'consistent_hashing'
}

/**
 * Load Balancer for distributing API requests across multiple instances
 */
export class LoadBalancer extends EventEmitter {
  private static instance: LoadBalancer;
  private instances: Map<string, Instance>;
  private algorithm: LoadBalancingAlgorithm;
  private healthCheckInterval: NodeJS.Timeout;
  private roundRobinCounter: number;
  
  private constructor() {
    super();
    this.instances = new Map();
    this.algorithm = config.loadBalancer.algorithm || LoadBalancingAlgorithm.ROUND_ROBIN;
    this.roundRobinCounter = 0;
    
    // Start health checks
    this.startHealthChecks();
  }
  
  /**
   * Get the singleton instance of LoadBalancer
   */
  public static getInstance(): LoadBalancer {
    if (!LoadBalancer.instance) {
      LoadBalancer.instance = new LoadBalancer();
    }
    return LoadBalancer.instance;
  }
  
  /**
   * Register a new instance with the load balancer
   */
  public registerInstance(host: string, port: number): Instance {
    const instance: Instance = {
      id: `${host}:${port}`,
      host,
      port,
      status: InstanceStatus.STARTING,
      healthScore: 100,
      lastHealthCheck: new Date(),
      metrics: {
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        activeConnections: 0
      }
    };
    
    this.instances.set(instance.id, instance);
    this.emit('instance:registered', instance);
    
    return instance;
  }
  
  /**
   * Remove an instance from the load balancer
   */
  public deregisterInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;
    
    instance.status = InstanceStatus.STOPPING;
    this.emit('instance:deregistering', instance);
    
    setTimeout(() => {
      this.instances.delete(instanceId);
      this.emit('instance:deregistered', instance);
    }, config.loadBalancer.drainTimeoutMs || 5000);
    
    return true;
  }
  
  /**
   * Get the next instance for request routing based on the selected algorithm
   */
  public getNextInstance(): Instance | null {
    const healthyInstances = Array.from(this.instances.values())
      .filter(instance => instance.status === InstanceStatus.HEALTHY);
    
    if (healthyInstances.length === 0) {
      return null;
    }
    
    switch (this.algorithm) {
      case LoadBalancingAlgorithm.ROUND_ROBIN:
        return this.getRoundRobinInstance(healthyInstances);
      
      case LoadBalancingAlgorithm.LEAST_CONNECTIONS:
        return this.getLeastConnectionsInstance(healthyInstances);
      
      case LoadBalancingAlgorithm.WEIGHTED_RESPONSE_TIME:
        return this.getWeightedResponseTimeInstance(healthyInstances);
      
      case LoadBalancingAlgorithm.CONSISTENT_HASHING:
        return this.getConsistentHashingInstance(healthyInstances);
      
      default:
        return this.getRoundRobinInstance(healthyInstances);
    }
  }
  
  /**
   * Update instance metrics
   */
  public updateInstanceMetrics(instanceId: string, metrics: Partial<InstanceMetrics>): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    
    instance.metrics = {
      ...instance.metrics,
      ...metrics
    };
    
    instance.lastHealthCheck = new Date();
    this.instances.set(instanceId, instance);
    
    // Check for auto-scaling triggers
    this.checkScalingTriggers(instance);
  }
  
  /**
   * Get all registered instances
   */
  public getInstances(): Instance[] {
    return Array.from(this.instances.values());
  }
  
  /**
   * Get instance by ID
   */
  public getInstance(instanceId: string): Instance | null {
    return this.instances.get(instanceId) || null;
  }
  
  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(
      () => this.performHealthChecks(),
      config.loadBalancer.healthCheckIntervalMs || 10000
    );
  }
  
  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    for (const instance of this.instances.values()) {
      try {
        const response = await fetch(`http://${instance.host}:${instance.port}/health`);
        
        if (response.ok) {
          instance.status = InstanceStatus.HEALTHY;
          instance.healthScore = 100;
        } else {
          this.handleUnhealthyInstance(instance);
        }
      } catch (error) {
        this.handleUnhealthyInstance(instance);
      }
      
      instance.lastHealthCheck = new Date();
      this.instances.set(instance.id, instance);
    }
  }
  
  /**
   * Handle unhealthy instance
   */
  private handleUnhealthyInstance(instance: Instance): void {
    instance.healthScore = Math.max(0, instance.healthScore - 25);
    
    if (instance.healthScore === 0) {
      instance.status = InstanceStatus.UNHEALTHY;
      this.emit('instance:unhealthy', instance);
    }
  }
  
  /**
   * Check for auto-scaling triggers based on instance metrics
   */
  private checkScalingTriggers(instance: Instance): void {
    const triggers = config.loadBalancer.scalingTriggers;
    if (!triggers) return;
    
    // Check CPU usage trigger
    if (instance.metrics.cpuUsage > triggers.cpuThreshold) {
      this.emit('scaling:cpu_threshold_exceeded', instance);
    }
    
    // Check memory usage trigger
    if (instance.metrics.memoryUsage > triggers.memoryThreshold) {
      this.emit('scaling:memory_threshold_exceeded', instance);
    }
    
    // Check request rate trigger
    if (instance.metrics.requestCount > triggers.requestRateThreshold) {
      this.emit('scaling:request_rate_threshold_exceeded', instance);
    }
    
    // Check error rate trigger
    const errorRate = instance.metrics.errorCount / instance.metrics.requestCount;
    if (errorRate > triggers.errorRateThreshold) {
      this.emit('scaling:error_rate_threshold_exceeded', instance);
    }
  }
  
  /**
   * Get next instance using round-robin algorithm
   */
  private getRoundRobinInstance(instances: Instance[]): Instance {
    const instance = instances[this.roundRobinCounter % instances.length];
    this.roundRobinCounter++;
    return instance;
  }
  
  /**
   * Get instance with least active connections
   */
  private getLeastConnectionsInstance(instances: Instance[]): Instance {
    return instances.reduce((min, instance) => 
      instance.metrics.activeConnections < min.metrics.activeConnections ? instance : min
    );
  }
  
  /**
   * Get instance based on weighted response time
   */
  private getWeightedResponseTimeInstance(instances: Instance[]): Instance {
    return instances.reduce((best, instance) => {
      const weight = 1 / (instance.metrics.avgResponseTime * instance.metrics.activeConnections);
      const bestWeight = 1 / (best.metrics.avgResponseTime * best.metrics.activeConnections);
      return weight > bestWeight ? instance : best;
    });
  }
  
  /**
   * Get instance using consistent hashing
   */
  private getConsistentHashingInstance(instances: Instance[]): Instance {
    // Simple hash-based selection for demonstration
    // In production, implement a proper consistent hashing algorithm
    const hash = Math.floor(Math.random() * instances.length);
    return instances[hash];
  }
}

// Export singleton instance
export const loadBalancer = LoadBalancer.getInstance();
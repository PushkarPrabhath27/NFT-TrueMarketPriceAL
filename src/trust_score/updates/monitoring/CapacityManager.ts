/**
 * Capacity Management System for Real-Time Update Engine
 * 
 * This module implements scaling capabilities and efficiency optimizations
 * to ensure the real-time update system operates efficiently under varying loads.
 */

import { EventEmitter } from 'events';
import { RealTimeUpdateEngine } from '../RealTimeUpdateEngine';
import { ProcessingQueueManager } from '../event_processing/ProcessingQueueManager';
import { PerformanceMonitor, Metric } from './PerformanceMonitor';

export interface ScalingRule {
  metricName: string;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriodMs: number;
  lastScalingActionTimestamp?: number;
  minCapacity: number;
  maxCapacity: number;
  scaleIncrementSize: number;
}

export interface ResourceAllocation {
  processingUnits: number;
  memoryMB: number;
  concurrencyLevel: number;
}

export interface OptimizationStrategy {
  name: string;
  condition: (metrics: Metric[]) => boolean;
  action: () => Promise<void>;
  cooldownPeriodMs: number;
  lastExecutionTimestamp?: number;
}

/**
 * Capacity Manager for the Real-Time Update System
 * 
 * Manages system capacity, implements auto-scaling, and provides efficiency optimizations.
 */
export class CapacityManager extends EventEmitter {
  private scalingRules: ScalingRule[] = [];
  private optimizationStrategies: OptimizationStrategy[] = [];
  private currentAllocation: ResourceAllocation;
  private capacityCheckInterval: NodeJS.Timeout | null = null;
  private loadShedding: boolean = false;
  private loadSheddingThreshold: number = 90; // percent
  private scheduledCapacityChanges: Array<{
    timestamp: number;
    allocation: Partial<ResourceAllocation>;
  }> = [];
  
  constructor(
    private updateEngine: RealTimeUpdateEngine,
    private queueManager: ProcessingQueueManager,
    private performanceMonitor: PerformanceMonitor,
    private checkIntervalMs: number = 30000, // 30 seconds default
    initialAllocation: ResourceAllocation = {
      processingUnits: 4,
      memoryMB: 1024,
      concurrencyLevel: 8
    }
  ) {
    super();
    this.currentAllocation = initialAllocation;
    this.initializeScalingRules();
    this.initializeOptimizationStrategies();
  }

  /**
   * Initialize default scaling rules
   */
  private initializeScalingRules(): void {
    // CPU utilization-based scaling
    this.scalingRules.push({
      metricName: 'cpu_utilization',
      scaleUpThreshold: 75, // Scale up when CPU > 75%
      scaleDownThreshold: 30, // Scale down when CPU < 30%
      cooldownPeriodMs: 300000, // 5 minutes
      minCapacity: 2,
      maxCapacity: 16,
      scaleIncrementSize: 2
    });
    
    // Queue depth-based scaling
    this.scalingRules.push({
      metricName: 'queue_depth',
      scaleUpThreshold: 1000, // Scale up when queue depth > 1000
      scaleDownThreshold: 100, // Scale down when queue depth < 100
      cooldownPeriodMs: 180000, // 3 minutes
      minCapacity: 2,
      maxCapacity: 16,
      scaleIncrementSize: 2
    });
    
    // Event ingestion rate-based scaling
    this.scalingRules.push({
      metricName: 'event_ingestion_rate',
      scaleUpThreshold: 500, // Scale up when ingestion rate > 500 events/sec
      scaleDownThreshold: 100, // Scale down when ingestion rate < 100 events/sec
      cooldownPeriodMs: 240000, // 4 minutes
      minCapacity: 2,
      maxCapacity: 16,
      scaleIncrementSize: 2
    });
  }

  /**
   * Initialize optimization strategies
   */
  private initializeOptimizationStrategies(): void {
    // Batch processing enhancement
    this.optimizationStrategies.push({
      name: 'batch_processing_enhancement',
      condition: (metrics) => {
        const queueDepth = metrics.find(m => m.name === 'queue_depth');
        return queueDepth ? queueDepth.value > 500 : false;
      },
      action: async () => {
        console.log('Enhancing batch processing');
        // In a real implementation, this would adjust batch sizes
        // For demonstration, we'll simulate the action
        this.queueManager.setBatchSize(Math.min(this.queueManager.getBatchSize() + 5, 50));
        this.emit('optimization_applied', { strategy: 'batch_processing_enhancement' });
      },
      cooldownPeriodMs: 120000 // 2 minutes
    });
    
    // Cache strategy refinement
    this.optimizationStrategies.push({
      name: 'cache_strategy_refinement',
      condition: (metrics) => {
        const latency = metrics.find(m => m.name === 'end_to_end_latency');
        return latency ? latency.value > 10000 : false; // Latency > 10 seconds
      },
      action: async () => {
        console.log('Refining cache strategy');
        // In a real implementation, this would adjust cache TTLs or preloading
        // For demonstration, we'll simulate the action
        this.emit('optimization_applied', { strategy: 'cache_strategy_refinement' });
      },
      cooldownPeriodMs: 300000 // 5 minutes
    });
    
    // Resource utilization balancing
    this.optimizationStrategies.push({
      name: 'resource_utilization_balancing',
      condition: (metrics) => {
        const cpu = metrics.find(m => m.name === 'cpu_utilization');
        const memory = metrics.find(m => m.name === 'memory_utilization');
        return (cpu && memory) ? (cpu.value > 80 && memory.value < 40) : false;
      },
      action: async () => {
        console.log('Balancing resource utilization');
        // In a real implementation, this would adjust resource allocation
        // For demonstration, we'll simulate the action
        this.emit('optimization_applied', { strategy: 'resource_utilization_balancing' });
      },
      cooldownPeriodMs: 180000 // 3 minutes
    });
    
    // Processing algorithm optimization
    this.optimizationStrategies.push({
      name: 'processing_algorithm_optimization',
      condition: (metrics) => {
        const throughput = metrics.find(m => m.name === 'queue_throughput');
        return throughput ? throughput.value < 100 : false; // Low throughput
      },
      action: async () => {
        console.log('Optimizing processing algorithms');
        // In a real implementation, this would switch to more efficient algorithms
        // For demonstration, we'll simulate the action
        this.emit('optimization_applied', { strategy: 'processing_algorithm_optimization' });
      },
      cooldownPeriodMs: 600000 // 10 minutes
    });
  }

  /**
   * Start capacity management
   */
  public start(): void {
    // Register for performance metrics
    this.performanceMonitor.on('metrics_snapshot', this.onMetricsSnapshot.bind(this));
    
    // Start periodic capacity checks
    this.capacityCheckInterval = setInterval(() => {
      this.checkScheduledCapacityChanges();
    }, this.checkIntervalMs);
    
    console.log('Capacity management started');
  }

  /**
   * Stop capacity management
   */
  public stop(): void {
    // Unregister from performance metrics
    this.performanceMonitor.off('metrics_snapshot', this.onMetricsSnapshot.bind(this));
    
    // Stop periodic capacity checks
    if (this.capacityCheckInterval) {
      clearInterval(this.capacityCheckInterval);
      this.capacityCheckInterval = null;
    }
    
    console.log('Capacity management stopped');
  }

  /**
   * Handle metrics snapshot event
   */
  private onMetricsSnapshot(snapshot: { metrics: Metric[] }): void {
    // Check if we need to apply auto-scaling
    this.checkAutoScaling(snapshot.metrics);
    
    // Check if we need to apply load shedding
    this.checkLoadShedding(snapshot.metrics);
    
    // Check if we need to apply optimization strategies
    this.checkOptimizationStrategies(snapshot.metrics);
  }

  /**
   * Check if auto-scaling should be applied based on current metrics
   */
  private checkAutoScaling(metrics: Metric[]): void {
    const now = Date.now();
    
    for (const rule of this.scalingRules) {
      // Skip if we're in cooldown period
      if (rule.lastScalingActionTimestamp && 
          (now - rule.lastScalingActionTimestamp) < rule.cooldownPeriodMs) {
        continue;
      }
      
      // Find the relevant metric
      const metric = metrics.find(m => m.name === rule.metricName);
      if (!metric) continue;
      
      // Check if we need to scale up
      if (metric.value > rule.scaleUpThreshold && 
          this.currentAllocation.processingUnits < rule.maxCapacity) {
        
        const newCapacity = Math.min(
          this.currentAllocation.processingUnits + rule.scaleIncrementSize,
          rule.maxCapacity
        );
        
        this.scaleCapacity(newCapacity, 'up', rule.metricName, metric.value);
        rule.lastScalingActionTimestamp = now;
        break; // Only apply one scaling action at a time
      }
      
      // Check if we need to scale down
      else if (metric.value < rule.scaleDownThreshold && 
               this.currentAllocation.processingUnits > rule.minCapacity) {
        
        const newCapacity = Math.max(
          this.currentAllocation.processingUnits - rule.scaleIncrementSize,
          rule.minCapacity
        );
        
        this.scaleCapacity(newCapacity, 'down', rule.metricName, metric.value);
        rule.lastScalingActionTimestamp = now;
        break; // Only apply one scaling action at a time
      }
    }
  }

  /**
   * Scale system capacity up or down
   */
  private scaleCapacity(
    newProcessingUnits: number, 
    direction: 'up' | 'down', 
    triggerMetric: string, 
    metricValue: number
  ): void {
    const oldCapacity = this.currentAllocation.processingUnits;
    
    // Update allocation
    this.currentAllocation.processingUnits = newProcessingUnits;
    
    // Scale memory proportionally
    this.currentAllocation.memoryMB = Math.floor(
      (this.currentAllocation.memoryMB / oldCapacity) * newProcessingUnits
    );
    
    // Scale concurrency level
    this.currentAllocation.concurrencyLevel = Math.floor(
      (this.currentAllocation.concurrencyLevel / oldCapacity) * newProcessingUnits
    );
    
    // In a real implementation, this would actually allocate/deallocate resources
    console.log(`Scaling ${direction} from ${oldCapacity} to ${newProcessingUnits} processing units`);
    console.log(`New allocation: ${JSON.stringify(this.currentAllocation)}`);
    
    // Apply the new capacity to the system
    this.applyCapacityToSystem();
    
    // Emit scaling event
    this.emit('capacity_scaled', {
      direction,
      oldCapacity,
      newCapacity: newProcessingUnits,
      triggerMetric,
      metricValue,
      timestamp: Date.now()
    });
  }

  /**
   * Apply capacity changes to the actual system
   */
  private applyCapacityToSystem(): void {
    // In a real implementation, this would configure the system with new capacity
    // For demonstration, we'll simulate applying the changes
    
    // Update concurrency settings in queue manager
    this.queueManager.setConcurrencyLevel(this.currentAllocation.concurrencyLevel);
    
    // Update memory allocation (simulated)
    console.log(`Memory allocation updated to ${this.currentAllocation.memoryMB}MB`);
    
    // Update processing units (simulated)
    console.log(`Processing units updated to ${this.currentAllocation.processingUnits}`);
  }

  /**
   * Check if load shedding should be applied based on current metrics
   */
  private checkLoadShedding(metrics: Metric[]): void {
    // Check CPU and memory utilization
    const cpuMetric = metrics.find(m => m.name === 'cpu_utilization');
    const memoryMetric = metrics.find(m => m.name === 'memory_utilization');
    
    if (!cpuMetric || !memoryMetric) return;
    
    const highLoad = cpuMetric.value > this.loadSheddingThreshold || 
                     memoryMetric.value > this.loadSheddingThreshold;
    
    // If high load and not already shedding, start load shedding
    if (highLoad && !this.loadShedding) {
      this.startLoadShedding();
    }
    // If not high load and currently shedding, stop load shedding
    else if (!highLoad && this.loadShedding) {
      this.stopLoadShedding();
    }
  }

  /**
   * Start load shedding to handle traffic spikes
   */
  private startLoadShedding(): void {
    this.loadShedding = true;
    
    // In a real implementation, this would implement strategies like:
    // - Rejecting low-priority events
    // - Increasing batching aggressively
    // - Deferring non-critical processing
    
    console.log('Load shedding activated due to high system load');
    
    // Apply load shedding to queue manager
    this.queueManager.setPriorityThreshold('medium'); // Only process medium priority and above
    
    // Emit load shedding event
    this.emit('load_shedding_started', {
      timestamp: Date.now(),
      reason: 'High system load'
    });
  }

  /**
   * Stop load shedding when system load returns to normal
   */
  private stopLoadShedding(): void {
    this.loadShedding = false;
    
    console.log('Load shedding deactivated, system load has normalized');
    
    // Remove load shedding from queue manager
    this.queueManager.setPriorityThreshold('low'); // Process all priorities
    
    // Emit load shedding stopped event
    this.emit('load_shedding_stopped', {
      timestamp: Date.now()
    });
  }

  /**
   * Check if optimization strategies should be applied
   */
  private checkOptimizationStrategies(metrics: Metric[]): void {
    const now = Date.now();
    
    for (const strategy of this.optimizationStrategies) {
      // Skip if we're in cooldown period
      if (strategy.lastExecutionTimestamp && 
          (now - strategy.lastExecutionTimestamp) < strategy.cooldownPeriodMs) {
        continue;
      }
      
      // Check if the strategy condition is met
      if (strategy.condition(metrics)) {
        // Execute the strategy
        strategy.action().catch(error => {
          console.error(`Error executing optimization strategy ${strategy.name}:`, error);
        });
        
        // Update last execution timestamp
        strategy.lastExecutionTimestamp = now;
      }
    }
  }

  /**
   * Schedule a capacity change for a future time
   */
  public scheduleCapacityChange(
    timestamp: number,
    allocation: Partial<ResourceAllocation>
  ): void {
    this.scheduledCapacityChanges.push({ timestamp, allocation });
    console.log(`Scheduled capacity change for ${new Date(timestamp).toISOString()}`);
    
    // Sort by timestamp
    this.scheduledCapacityChanges.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Check for and apply any scheduled capacity changes
   */
  private checkScheduledCapacityChanges(): void {
    const now = Date.now();
    let applied = false;
    
    // Find and apply any scheduled changes that are due
    while (this.scheduledCapacityChanges.length > 0 && 
           this.scheduledCapacityChanges[0].timestamp <= now) {
      
      const change = this.scheduledCapacityChanges.shift()!;
      
      // Apply the scheduled change
      const newAllocation = { ...this.currentAllocation, ...change.allocation };
      
      console.log(`Applying scheduled capacity change: ${JSON.stringify(newAllocation)}`);
      
      // Update current allocation
      this.currentAllocation = newAllocation;
      
      // Apply to system
      this.applyCapacityToSystem();
      
      // Emit event
      this.emit('scheduled_capacity_applied', {
        timestamp: now,
        newAllocation
      });
      
      applied = true;
    }
    
    if (applied) {
      // If we applied changes, check if we need to adjust auto-scaling rules
      this.adjustAutoScalingRules();
    }
  }

  /**
   * Adjust auto-scaling rules based on current allocation
   */
  private adjustAutoScalingRules(): void {
    // Ensure min/max capacity constraints are respected
    for (const rule of this.scalingRules) {
      if (this.currentAllocation.processingUnits <= rule.minCapacity) {
        // We're at or below min capacity, prevent further scaling down
        rule.scaleDownThreshold = 0;
      } else if (this.currentAllocation.processingUnits >= rule.maxCapacity) {
        // We're at or above max capacity, prevent further scaling up
        rule.scaleUpThreshold = Number.MAX_VALUE;
      } else {
        // Reset to default thresholds
        // In a real implementation, these would be the original values
        if (rule.metricName === 'cpu_utilization') {
          rule.scaleUpThreshold = 75;
          rule.scaleDownThreshold = 30;
        } else if (rule.metricName === 'queue_depth') {
          rule.scaleUpThreshold = 1000;
          rule.scaleDownThreshold = 100;
        } else if (rule.metricName === 'event_ingestion_rate') {
          rule.scaleUpThreshold = 500;
          rule.scaleDownThreshold = 100;
        }
      }
    }
  }

  /**
   * Set the load shedding threshold
   */
  public setLoadSheddingThreshold(threshold: number): void {
    this.loadSheddingThreshold = threshold;
  }

  /**
   * Add a custom scaling rule
   */
  public addScalingRule(rule: ScalingRule): void {
    this.scalingRules.push(rule);
  }

  /**
   * Add a custom optimization strategy
   */
  public addOptimizationStrategy(strategy: OptimizationStrategy): void {
    this.optimizationStrategies.push(strategy);
  }

  /**
   * Get current resource allocation
   */
  public getCurrentAllocation(): ResourceAllocation {
    return { ...this.currentAllocation };
  }

  /**
   * Get all scaling rules
   */
  public getScalingRules(): ScalingRule[] {
    return [...this.scalingRules];
  }

  /**
   * Get all optimization strategies
   */
  public getOptimizationStrategies(): OptimizationStrategy[] {
    return [...this.optimizationStrategies];
  }

  /**
   * Get scheduled capacity changes
   */
  public getScheduledCapacityChanges(): Array<{
    timestamp: number;
    allocation: Partial<ResourceAllocation>;
  }> {
    return [...this.scheduledCapacityChanges];
  }
}
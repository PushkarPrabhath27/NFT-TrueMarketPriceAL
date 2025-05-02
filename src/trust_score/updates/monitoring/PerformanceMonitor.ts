/**
 * Performance Monitoring System for Real-Time Update Engine
 * 
 * This module implements comprehensive metrics collection and visualization
 * capabilities to monitor the performance of the real-time update system.
 */

import { EventEmitter } from 'events';
import { RealTimeUpdateEngine } from '../RealTimeUpdateEngine';
import { ProcessingQueueManager } from '../event_processing/ProcessingQueueManager';
import { EventClassifier } from '../event_processing/EventClassifier';

// Define metric types for type safety
export type MetricName = 
  | 'event_ingestion_rate'
  | 'event_ingestion_latency'
  | 'queue_depth'
  | 'queue_throughput'
  | 'update_calculation_time'
  | 'end_to_end_latency'
  | 'cpu_utilization'
  | 'memory_utilization'
  | 'network_utilization';

export type MetricValue = number;
export type MetricTimestamp = number;

export interface Metric {
  name: MetricName;
  value: MetricValue;
  timestamp: MetricTimestamp;
  labels?: Record<string, string>;
}

export interface Alert {
  metricName: MetricName;
  threshold: MetricValue;
  currentValue: MetricValue;
  timestamp: MetricTimestamp;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface PerformanceSnapshot {
  metrics: Metric[];
  timestamp: MetricTimestamp;
}

/**
 * Performance Monitor for the Real-Time Update System
 * 
 * Collects, analyzes, and visualizes performance metrics for the system.
 */
export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<MetricName, Metric[]> = new Map();
  private thresholds: Map<MetricName, { warning: number; critical: number }> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;
  private anomalyDetectionEnabled: boolean = true;
  private trendAnalysisWindow: number = 3600000; // 1 hour in milliseconds
  
  constructor(
    private updateEngine: RealTimeUpdateEngine,
    private queueManager: ProcessingQueueManager,
    private eventClassifier: EventClassifier,
    private collectionFrequencyMs: number = 5000, // 5 seconds default
    private retentionPeriodMs: number = 86400000, // 24 hours default
  ) {
    super();
    this.initializeThresholds();
  }

  /**
   * Initialize default threshold values for metrics
   */
  private initializeThresholds(): void {
    this.thresholds.set('event_ingestion_rate', { warning: 1000, critical: 5000 });
    this.thresholds.set('event_ingestion_latency', { warning: 500, critical: 2000 }); // ms
    this.thresholds.set('queue_depth', { warning: 1000, critical: 5000 });
    this.thresholds.set('queue_throughput', { warning: 100, critical: 50 }); // events/sec
    this.thresholds.set('update_calculation_time', { warning: 1000, critical: 5000 }); // ms
    this.thresholds.set('end_to_end_latency', { warning: 30000, critical: 60000 }); // ms
    this.thresholds.set('cpu_utilization', { warning: 70, critical: 90 }); // percent
    this.thresholds.set('memory_utilization', { warning: 70, critical: 90 }); // percent
    this.thresholds.set('network_utilization', { warning: 70, critical: 90 }); // percent
  }

  /**
   * Start collecting metrics at the specified interval
   */
  public start(): void {
    if (this.collectionInterval) {
      return; // Already started
    }

    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
      this.cleanupOldMetrics();
      this.detectAnomalies();
      this.analyzeTrends();
    }, this.collectionFrequencyMs);

    // Register event listeners for real-time metric collection
    this.registerEventListeners();
    
    console.log('Performance monitoring started');
  }

  /**
   * Stop collecting metrics
   */
  public stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    // Unregister event listeners
    this.unregisterEventListeners();
    
    console.log('Performance monitoring stopped');
  }

  /**
   * Register event listeners for real-time metric collection
   */
  private registerEventListeners(): void {
    // Listen for event processing start/end to calculate latency
    this.updateEngine.on('event_received', this.onEventReceived.bind(this));
    this.updateEngine.on('update_completed', this.onUpdateCompleted.bind(this));
    this.queueManager.on('event_enqueued', this.onEventEnqueued.bind(this));
    this.queueManager.on('event_dequeued', this.onEventDequeued.bind(this));
  }

  /**
   * Unregister event listeners
   */
  private unregisterEventListeners(): void {
    this.updateEngine.off('event_received', this.onEventReceived.bind(this));
    this.updateEngine.off('update_completed', this.onUpdateCompleted.bind(this));
    this.queueManager.off('event_enqueued', this.onEventEnqueued.bind(this));
    this.queueManager.off('event_dequeued', this.onEventDequeued.bind(this));
  }

  /**
   * Event handler for when an event is received
   */
  private onEventReceived(eventData: any): void {
    const now = Date.now();
    this.recordMetric('event_ingestion_rate', 1, { event_type: eventData.type });
    
    // Store the timestamp for latency calculation
    if (eventData.id) {
      this.updateEngine.setMetadata(eventData.id, 'received_timestamp', now);
    }
  }

  /**
   * Event handler for when an update is completed
   */
  private onUpdateCompleted(eventData: any): void {
    const now = Date.now();
    if (eventData.id) {
      const receivedTimestamp = this.updateEngine.getMetadata(eventData.id, 'received_timestamp');
      if (receivedTimestamp) {
        const latency = now - receivedTimestamp;
        this.recordMetric('end_to_end_latency', latency, { event_type: eventData.type });
      }
    }
  }

  /**
   * Event handler for when an event is enqueued
   */
  private onEventEnqueued(eventData: any): void {
    this.recordMetric('queue_depth', this.queueManager.getQueueDepth());
  }

  /**
   * Event handler for when an event is dequeued
   */
  private onEventDequeued(eventData: any): void {
    this.recordMetric('queue_depth', this.queueManager.getQueueDepth());
    this.recordMetric('queue_throughput', 1);
  }

  /**
   * Collect all metrics at the current point in time
   */
  private collectMetrics(): void {
    const now = Date.now();
    
    // Collect system resource metrics
    this.collectResourceMetrics();
    
    // Emit a snapshot event with all current metrics
    const snapshot: PerformanceSnapshot = {
      metrics: this.getLatestMetrics(),
      timestamp: now
    };
    
    this.emit('metrics_snapshot', snapshot);
  }

  /**
   * Collect system resource metrics (CPU, memory, network)
   */
  private collectResourceMetrics(): void {
    // In a real implementation, this would use system monitoring libraries
    // For demonstration, we'll use placeholder values
    
    // Simulate CPU utilization (random value between 10-90%)
    const cpuUtilization = 10 + Math.random() * 80;
    this.recordMetric('cpu_utilization', cpuUtilization);
    
    // Simulate memory utilization (random value between 20-85%)
    const memoryUtilization = 20 + Math.random() * 65;
    this.recordMetric('memory_utilization', memoryUtilization);
    
    // Simulate network utilization (random value between 5-70%)
    const networkUtilization = 5 + Math.random() * 65;
    this.recordMetric('network_utilization', networkUtilization);
  }

  /**
   * Record a metric value
   */
  public recordMetric(name: MetricName, value: MetricValue, labels: Record<string, string> = {}): void {
    const timestamp = Date.now();
    const metric: Metric = { name, value, timestamp, labels };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);
    
    // Check for threshold violations
    this.checkThresholds(metric);
    
    // Emit metric event
    this.emit('metric_recorded', metric);
  }

  /**
   * Check if a metric exceeds defined thresholds
   */
  private checkThresholds(metric: Metric): void {
    const thresholds = this.thresholds.get(metric.name);
    if (!thresholds) return;
    
    let severity: Alert['severity'] | null = null;
    
    // For most metrics, alert when value exceeds threshold
    // For throughput metrics, alert when value falls below threshold
    const isThroughputMetric = metric.name === 'queue_throughput';
    
    if (isThroughputMetric) {
      if (metric.value < thresholds.critical) {
        severity = 'critical';
      } else if (metric.value < thresholds.warning) {
        severity = 'warning';
      }
    } else {
      if (metric.value > thresholds.critical) {
        severity = 'critical';
      } else if (metric.value > thresholds.warning) {
        severity = 'warning';
      }
    }
    
    if (severity) {
      const alert: Alert = {
        metricName: metric.name,
        threshold: isThroughputMetric 
          ? (severity === 'critical' ? thresholds.critical : thresholds.warning)
          : (severity === 'critical' ? thresholds.critical : thresholds.warning),
        currentValue: metric.value,
        timestamp: metric.timestamp,
        severity,
        message: `${metric.name} ${isThroughputMetric ? 'below' : 'exceeded'} ${severity} threshold`
      };
      
      this.emit('alert', alert);
    }
  }

  /**
   * Get the latest value for each metric
   */
  public getLatestMetrics(): Metric[] {
    const latest: Metric[] = [];
    
    for (const [name, metricArray] of this.metrics.entries()) {
      if (metricArray.length > 0) {
        latest.push(metricArray[metricArray.length - 1]);
      }
    }
    
    return latest;
  }

  /**
   * Get historical values for a specific metric
   */
  public getMetricHistory(name: MetricName, timeRangeMs: number = 3600000): Metric[] {
    const metricArray = this.metrics.get(name) || [];
    const cutoffTime = Date.now() - timeRangeMs;
    
    return metricArray.filter(metric => metric.timestamp >= cutoffTime);
  }

  /**
   * Clean up metrics older than the retention period
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.retentionPeriodMs;
    
    for (const [name, metricArray] of this.metrics.entries()) {
      const newArray = metricArray.filter(metric => metric.timestamp >= cutoffTime);
      this.metrics.set(name, newArray);
    }
  }

  /**
   * Detect anomalies in metric patterns
   */
  private detectAnomalies(): void {
    if (!this.anomalyDetectionEnabled) return;
    
    for (const [name, metricArray] of this.metrics.entries()) {
      if (metricArray.length < 10) continue; // Need enough data points
      
      // Get recent metrics for analysis
      const recentMetrics = metricArray.slice(-10);
      const values = recentMetrics.map(m => m.value);
      
      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      // Check if the latest value is an anomaly (> 3 standard deviations from mean)
      const latestValue = values[values.length - 1];
      if (Math.abs(latestValue - mean) > 3 * stdDev) {
        const alert: Alert = {
          metricName: name,
          threshold: mean + (latestValue > mean ? 3 : -3) * stdDev,
          currentValue: latestValue,
          timestamp: Date.now(),
          severity: 'warning',
          message: `Anomaly detected in ${name}: value ${latestValue} deviates significantly from mean ${mean.toFixed(2)}`
        };
        
        this.emit('anomaly_detected', alert);
      }
    }
  }

  /**
   * Analyze trends in metrics over time
   */
  private analyzeTrends(): void {
    for (const [name, metricArray] of this.metrics.entries()) {
      // Need enough data points spanning the analysis window
      if (metricArray.length < 5) continue;
      
      const now = Date.now();
      const windowStart = now - this.trendAnalysisWindow;
      
      // Filter metrics within the analysis window
      const windowMetrics = metricArray.filter(m => m.timestamp >= windowStart);
      if (windowMetrics.length < 5) continue;
      
      // Perform linear regression to detect trend
      const points = windowMetrics.map(m => ({ x: m.timestamp, y: m.value }));
      const trend = this.calculateLinearRegression(points);
      
      // If slope indicates significant trend, emit event
      if (Math.abs(trend.slope) > 0.01) { // Threshold for significant trend
        const trendDirection = trend.slope > 0 ? 'increasing' : 'decreasing';
        
        this.emit('trend_detected', {
          metricName: name,
          direction: trendDirection,
          slope: trend.slope,
          startValue: windowMetrics[0].value,
          currentValue: windowMetrics[windowMetrics.length - 1].value,
          startTime: windowMetrics[0].timestamp,
          endTime: windowMetrics[windowMetrics.length - 1].timestamp,
          message: `${name} shows ${trendDirection} trend over the last ${(this.trendAnalysisWindow / 60000).toFixed(0)} minutes`
        });
      }
    }
  }

  /**
   * Calculate linear regression for a set of points
   */
  private calculateLinearRegression(points: { x: number, y: number }[]): { slope: number, intercept: number } {
    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (const point of points) {
      // Normalize x values to avoid numerical issues
      const x = (point.x - points[0].x) / 1000; // Convert to seconds from first point
      const y = point.y;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  /**
   * Set a custom threshold for a metric
   */
  public setThreshold(metric: MetricName, warning: number, critical: number): void {
    this.thresholds.set(metric, { warning, critical });
  }

  /**
   * Enable or disable anomaly detection
   */
  public setAnomalyDetection(enabled: boolean): void {
    this.anomalyDetectionEnabled = enabled;
  }

  /**
   * Set the window size for trend analysis
   */
  public setTrendAnalysisWindow(windowMs: number): void {
    this.trendAnalysisWindow = windowMs;
  }
}
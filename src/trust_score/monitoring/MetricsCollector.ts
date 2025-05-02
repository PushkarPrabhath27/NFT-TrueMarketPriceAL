/**
 * MetricsCollector.ts
 * 
 * This file implements a metrics collection interface for the NFT TrustScore system.
 * It provides methods for recording various types of metrics like counters, gauges, and histograms.
 */

/**
 * Metrics collector for system-wide metrics
 */
export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  /**
   * Increments a counter metric
   */
  incrementCounter(name: string, value: number = 1): void {
    const currentValue = this.counters.get(name) || 0;
    this.counters.set(name, currentValue + value);
  }
  
  /**
   * Records a gauge metric
   */
  recordGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }
  
  /**
   * Records a histogram metric
   */
  recordHistogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
  }
  
  /**
   * Gets the current value of a counter
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  /**
   * Gets the current value of a gauge
   */
  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }
  
  /**
   * Gets the values of a histogram
   */
  getHistogram(name: string): number[] {
    return this.histograms.get(name) || [];
  }
  
  /**
   * Gets all metrics as a JSON object
   */
  getAllMetrics(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms)
    };
  }
  
  /**
   * Resets all metrics
   */
  resetMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}
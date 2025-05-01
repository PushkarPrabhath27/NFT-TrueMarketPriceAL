import { ModelVersion, DriftMetrics, RetrainingTrigger, ModelAlert } from '../types';
import { OnlinePerformanceMonitor } from './OnlinePerformanceMonitor';

interface RetrainingConfig {
  accuracyThreshold: number;
  driftThreshold: number;
  minDataPoints: number;
  scheduledInterval: number; // in milliseconds
}

export class AutomaticRetrainingManager {
  private readonly config: RetrainingConfig;
  private readonly performanceMonitor: OnlinePerformanceMonitor;
  private lastRetrainTime: Map<string, Date>;
  private dataPointCount: Map<string, number>;

  constructor(config: RetrainingConfig, performanceMonitor: OnlinePerformanceMonitor) {
    this.config = config;
    this.performanceMonitor = performanceMonitor;
    this.lastRetrainTime = new Map();
    this.dataPointCount = new Map();
  }

  checkAccuracyBasedTrigger(modelId: string, currentAccuracy: number): RetrainingTrigger | null {
    if (currentAccuracy < this.config.accuracyThreshold) {
      return {
        type: 'ACCURACY',
        modelId,
        metric: currentAccuracy,
        threshold: this.config.accuracyThreshold,
        timestamp: new Date()
      };
    }
    return null;
  }

  checkDriftBasedTrigger(modelId: string, driftMetrics: DriftMetrics): RetrainingTrigger | null {
    if (driftMetrics.hasDrift && this.isDriftSignificant(driftMetrics.metrics)) {
      return {
        type: 'DRIFT',
        modelId,
        metric: driftMetrics.metrics,
        threshold: this.config.driftThreshold,
        timestamp: new Date()
      };
    }
    return null;
  }

  checkScheduledRetraining(modelId: string): RetrainingTrigger | null {
    const lastRetrain = this.lastRetrainTime.get(modelId);
    if (!lastRetrain) return null;

    const timeSinceLastRetrain = Date.now() - lastRetrain.getTime();
    if (timeSinceLastRetrain >= this.config.scheduledInterval) {
      return {
        type: 'SCHEDULED',
        modelId,
        metric: timeSinceLastRetrain,
        threshold: this.config.scheduledInterval,
        timestamp: new Date()
      };
    }
    return null;
  }

  checkDataVolumeTrigger(modelId: string): RetrainingTrigger | null {
    const currentCount = this.dataPointCount.get(modelId) || 0;
    if (currentCount >= this.config.minDataPoints) {
      return {
        type: 'DATA_VOLUME',
        modelId,
        metric: currentCount,
        threshold: this.config.minDataPoints,
        timestamp: new Date()
      };
    }
    return null;
  }

  async evaluateRetrainingNeeds(modelId: string): Promise<RetrainingTrigger[]> {
    const triggers: RetrainingTrigger[] = [];
    
    try {
      // Check all potential triggers
      const degradationAlert = await this.performanceMonitor.checkModelDegradation(modelId);
      if (degradationAlert) {
        const accuracyTrigger = this.checkAccuracyBasedTrigger(modelId, degradationAlert.metrics.accuracy);
        if (accuracyTrigger) triggers.push(accuracyTrigger);
      }

      const driftMetrics = await this.performanceMonitor.detectDrift(modelId, {});
      const driftTrigger = this.checkDriftBasedTrigger(modelId, driftMetrics);
      if (driftTrigger) triggers.push(driftTrigger);

      const scheduledTrigger = this.checkScheduledRetraining(modelId);
      if (scheduledTrigger) triggers.push(scheduledTrigger);

      const volumeTrigger = this.checkDataVolumeTrigger(modelId);
      if (volumeTrigger) triggers.push(volumeTrigger);

      return triggers;
    } catch (error) {
      console.error('Retraining needs evaluation failed:', error);
      throw error;
    }
  }

  updateDataPointCount(modelId: string, count: number): void {
    this.dataPointCount.set(modelId, count);
  }

  recordRetraining(modelId: string): void {
    this.lastRetrainTime.set(modelId, new Date());
    this.dataPointCount.set(modelId, 0); // Reset count after retraining
  }

  private isDriftSignificant(metrics: any): boolean {
    // Implementation for evaluating if drift exceeds threshold
    return false;
  }
}
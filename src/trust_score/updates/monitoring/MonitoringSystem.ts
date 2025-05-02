/**
 * System Monitoring and Management for Real-Time Update Engine
 * 
 * This module integrates all monitoring and management components to provide
 * comprehensive capabilities for ensuring the real-time update system operates
 * efficiently and reliably.
 */

import { EventEmitter } from 'events';
import { RealTimeUpdateEngine } from '../RealTimeUpdateEngine';
import { ProcessingQueueManager } from '../event_processing/ProcessingQueueManager';
import { EventClassifier } from '../event_processing/EventClassifier';
import { PerformanceMonitor, Metric, Alert, PerformanceSnapshot } from './PerformanceMonitor';
import { ErrorHandler, ErrorRecord, ErrorCategory, ErrorSeverity } from './ErrorHandler';
import { CapacityManager, ResourceAllocation, ScalingRule, OptimizationStrategy } from './CapacityManager';

export interface MonitoringSystemConfig {
  performanceMonitoring: {
    collectionFrequencyMs: number;
    retentionPeriodMs: number;
  };
  errorHandling: {
    retentionPeriodMs: number;
  };
  capacityManagement: {
    checkIntervalMs: number;
    initialAllocation: ResourceAllocation;
  };
}

/**
 * Monitoring System for the Real-Time Update Engine
 * 
 * Integrates performance monitoring, error handling, and capacity management
 * to provide comprehensive monitoring and management capabilities.
 */
export class MonitoringSystem extends EventEmitter {
  private performanceMonitor: PerformanceMonitor;
  private errorHandler: ErrorHandler;
  private capacityManager: CapacityManager;
  private isRunning: boolean = false;
  
  constructor(
    private updateEngine: RealTimeUpdateEngine,
    private queueManager: ProcessingQueueManager,
    private eventClassifier: EventClassifier,
    private config: MonitoringSystemConfig = {
      performanceMonitoring: {
        collectionFrequencyMs: 5000, // 5 seconds
        retentionPeriodMs: 86400000, // 24 hours
      },
      errorHandling: {
        retentionPeriodMs: 604800000, // 7 days
      },
      capacityManagement: {
        checkIntervalMs: 30000, // 30 seconds
        initialAllocation: {
          processingUnits: 4,
          memoryMB: 1024,
          concurrencyLevel: 8
        }
      }
    }
  ) {
    super();
    
    // Initialize components
    this.performanceMonitor = new PerformanceMonitor(
      updateEngine,
      queueManager,
      eventClassifier,
      config.performanceMonitoring.collectionFrequencyMs,
      config.performanceMonitoring.retentionPeriodMs
    );
    
    this.errorHandler = new ErrorHandler(
      updateEngine,
      queueManager,
      config.errorHandling.retentionPeriodMs
    );
    
    this.capacityManager = new CapacityManager(
      updateEngine,
      queueManager,
      this.performanceMonitor,
      config.capacityManagement.checkIntervalMs,
      config.capacityManagement.initialAllocation
    );
    
    // Register for events from components
    this.registerComponentEventListeners();
  }

  /**
   * Register for events from monitoring components
   */
  private registerComponentEventListeners(): void {
    // Performance monitor events
    this.performanceMonitor.on('metrics_snapshot', (snapshot) => {
      this.emit('metrics_snapshot', snapshot);
    });
    
    this.performanceMonitor.on('alert', (alert) => {
      this.emit('performance_alert', alert);
    });
    
    this.performanceMonitor.on('anomaly_detected', (anomaly) => {
      this.emit('anomaly_detected', anomaly);
    });
    
    this.performanceMonitor.on('trend_detected', (trend) => {
      this.emit('trend_detected', trend);
    });
    
    // Error handler events
    this.errorHandler.on('error_recorded', (error) => {
      this.emit('error_recorded', error);
    });
    
    this.errorHandler.on('error_resolved', (error) => {
      this.emit('error_resolved', error);
    });
    
    this.errorHandler.on('error_retry', (error) => {
      this.emit('error_retry', error);
    });
    
    this.errorHandler.on('fallback_applied', (data) => {
      this.emit('fallback_applied', data);
    });
    
    // Capacity manager events
    this.capacityManager.on('capacity_scaled', (data) => {
      this.emit('capacity_scaled', data);
    });
    
    this.capacityManager.on('load_shedding_started', (data) => {
      this.emit('load_shedding_started', data);
    });
    
    this.capacityManager.on('load_shedding_stopped', (data) => {
      this.emit('load_shedding_stopped', data);
    });
    
    this.capacityManager.on('optimization_applied', (data) => {
      this.emit('optimization_applied', data);
    });
    
    this.capacityManager.on('scheduled_capacity_applied', (data) => {
      this.emit('scheduled_capacity_applied', data);
    });
  }

  /**
   * Start the monitoring system
   */
  public start(): void {
    if (this.isRunning) return;
    
    // Start all components
    this.performanceMonitor.start();
    this.errorHandler.start();
    this.capacityManager.start();
    
    this.isRunning = true;
    console.log('Monitoring system started');
    
    this.emit('monitoring_started', {
      timestamp: Date.now(),
      components: ['performance_monitor', 'error_handler', 'capacity_manager']
    });
  }

  /**
   * Stop the monitoring system
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    // Stop all components
    this.performanceMonitor.stop();
    this.errorHandler.stop();
    this.capacityManager.stop();
    
    this.isRunning = false;
    console.log('Monitoring system stopped');
    
    this.emit('monitoring_stopped', {
      timestamp: Date.now()
    });
  }

  /**
   * Get the performance monitor instance
   */
  public getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Get the error handler instance
   */
  public getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get the capacity manager instance
   */
  public getCapacityManager(): CapacityManager {
    return this.capacityManager;
  }

  /**
   * Get a comprehensive system status report
   */
  public async getSystemStatusReport(): Promise<{
    timestamp: number;
    performance: {
      latestMetrics: Metric[];
      alerts: Alert[];
    };
    errors: {
      stats: {
        totalErrors: number;
        unresolvedErrors: number;
        errorsByCategory: Record<ErrorCategory, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
        resolutionRate: number;
      };
      recentErrors: ErrorRecord[];
    };
    capacity: {
      currentAllocation: ResourceAllocation;
      loadShedding: boolean;
      scheduledChanges: Array<{
        timestamp: number;
        allocation: Partial<ResourceAllocation>;
      }>;
    };
    systemState: {
      consistent: boolean;
      issues: string[];
    };
  }> {
    // Get performance data
    const latestMetrics = this.performanceMonitor.getLatestMetrics();
    
    // Get error data
    const errorStats = this.errorHandler.getErrorStats();
    const recentErrors = this.errorHandler.getErrors({ timeRangeMs: 3600000 }); // Last hour
    
    // Get capacity data
    const currentAllocation = this.capacityManager.getCurrentAllocation();
    const scheduledChanges = this.capacityManager.getScheduledCapacityChanges();
    
    // Check system state consistency
    const systemState = await this.errorHandler.verifySystemState();
    
    return {
      timestamp: Date.now(),
      performance: {
        latestMetrics,
        alerts: [], // In a real implementation, this would track recent alerts
      },
      errors: {
        stats: errorStats,
        recentErrors,
      },
      capacity: {
        currentAllocation,
        loadShedding: false, // In a real implementation, this would be the actual state
        scheduledChanges,
      },
      systemState,
    };
  }

  /**
   * Create a dashboard visualization URL
   * In a real implementation, this would generate a URL to a dashboard
   */
  public getDashboardUrl(): string {
    return `/monitoring/dashboard?system=real_time_update_engine&timestamp=${Date.now()}`;
  }

  /**
   * Handle a manual intervention request
   */
  public async handleManualIntervention(action: string, params: Record<string, any>): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    try {
      switch (action) {
        case 'retry_error':
          if (!params.errorId) {
            return { success: false, message: 'Error ID is required' };
          }
          await this.errorHandler.manualRetry(params.errorId);
          return { success: true, message: `Error ${params.errorId} retry initiated` };
          
        case 'scale_capacity':
          if (!params.processingUnits) {
            return { success: false, message: 'Processing units parameter is required' };
          }
          const newAllocation: Partial<ResourceAllocation> = {
            processingUnits: params.processingUnits,
            memoryMB: params.memoryMB,
            concurrencyLevel: params.concurrencyLevel
          };
          this.capacityManager.scheduleCapacityChange(Date.now(), newAllocation);
          return { success: true, message: 'Capacity change scheduled' };
          
        case 'verify_system_state':
          const stateVerification = await this.errorHandler.verifySystemState();
          return { 
            success: true, 
            message: stateVerification.consistent ? 'System state is consistent' : 'System state has issues',
            result: stateVerification
          };
          
        default:
          return { success: false, message: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error executing action ${action}: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}
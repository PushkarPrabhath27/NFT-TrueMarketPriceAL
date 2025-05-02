/**
 * Error Handling and Recovery System for Real-Time Update Engine
 * 
 * This module implements comprehensive error management and operational tools
 * to ensure the real-time update system operates reliably even when errors occur.
 */

import { EventEmitter } from 'events';
import { RealTimeUpdateEngine } from '../RealTimeUpdateEngine';
import { ProcessingQueueManager } from '../event_processing/ProcessingQueueManager';

// Define error types for type safety
export type ErrorCategory = 
  | 'connection_error'
  | 'processing_error'
  | 'data_error'
  | 'system_error'
  | 'timeout_error'
  | 'validation_error'
  | 'dependency_error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorRecord {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  timestamp: number;
  eventId?: string;
  context?: Record<string, any>;
  retryCount?: number;
  resolved?: boolean;
  resolvedTimestamp?: number;
  resolutionStrategy?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

export interface FallbackStrategy {
  name: string;
  condition: (error: ErrorRecord) => boolean;
  action: (error: ErrorRecord) => Promise<void>;
}

/**
 * Error Handler for the Real-Time Update System
 * 
 * Manages errors, implements retry policies, and provides recovery mechanisms.
 */
export class ErrorHandler extends EventEmitter {
  private errors: Map<string, ErrorRecord> = new Map();
  private retryPolicies: Map<ErrorCategory, RetryPolicy> = new Map();
  private fallbackStrategies: FallbackStrategy[] = [];
  private retryQueue: Map<string, NodeJS.Timeout> = new Map();
  private errorCounter: Record<ErrorCategory, number> = {
    connection_error: 0,
    processing_error: 0,
    data_error: 0,
    system_error: 0,
    timeout_error: 0,
    validation_error: 0,
    dependency_error: 0
  };
  
  constructor(
    private updateEngine: RealTimeUpdateEngine,
    private queueManager: ProcessingQueueManager,
    private retentionPeriodMs: number = 604800000, // 7 days default
  ) {
    super();
    this.initializeRetryPolicies();
    this.initializeFallbackStrategies();
  }

  /**
   * Initialize default retry policies for different error categories
   */
  private initializeRetryPolicies(): void {
    // Connection errors: More retries with exponential backoff
    this.retryPolicies.set('connection_error', {
      maxRetries: 5,
      initialDelayMs: 1000,
      backoffFactor: 2,
      maxDelayMs: 60000 // 1 minute
    });
    
    // Processing errors: Fewer retries with less aggressive backoff
    this.retryPolicies.set('processing_error', {
      maxRetries: 3,
      initialDelayMs: 2000,
      backoffFactor: 1.5,
      maxDelayMs: 30000 // 30 seconds
    });
    
    // Data errors: Limited retries as they may be persistent
    this.retryPolicies.set('data_error', {
      maxRetries: 2,
      initialDelayMs: 3000,
      backoffFactor: 1.5,
      maxDelayMs: 15000 // 15 seconds
    });
    
    // System errors: More aggressive retry strategy
    this.retryPolicies.set('system_error', {
      maxRetries: 4,
      initialDelayMs: 5000,
      backoffFactor: 2,
      maxDelayMs: 120000 // 2 minutes
    });
    
    // Timeout errors: Quick initial retry, then back off
    this.retryPolicies.set('timeout_error', {
      maxRetries: 3,
      initialDelayMs: 500,
      backoffFactor: 3,
      maxDelayMs: 30000 // 30 seconds
    });
    
    // Validation errors: Limited retries as they're likely persistent
    this.retryPolicies.set('validation_error', {
      maxRetries: 1,
      initialDelayMs: 1000,
      backoffFactor: 1,
      maxDelayMs: 1000 // 1 second
    });
    
    // Dependency errors: Moderate retries with backoff
    this.retryPolicies.set('dependency_error', {
      maxRetries: 4,
      initialDelayMs: 2000,
      backoffFactor: 1.5,
      maxDelayMs: 45000 // 45 seconds
    });
  }

  /**
   * Initialize fallback strategies for different error scenarios
   */
  private initializeFallbackStrategies(): void {
    // Strategy for persistent connection errors
    this.fallbackStrategies.push({
      name: 'alternative_connection',
      condition: (error) => {
        return error.category === 'connection_error' && 
               (error.retryCount || 0) >= (this.retryPolicies.get('connection_error')?.maxRetries || 0);
      },
      action: async (error) => {
        console.log(`Attempting alternative connection for error: ${error.id}`);
        // In a real implementation, this would switch to an alternative connection
        // For demonstration, we'll just mark it as resolved
        await this.resolveError(error.id, 'Used alternative connection');
      }
    });
    
    // Strategy for data processing errors
    this.fallbackStrategies.push({
      name: 'simplified_processing',
      condition: (error) => {
        return error.category === 'processing_error' && 
               (error.retryCount || 0) >= (this.retryPolicies.get('processing_error')?.maxRetries || 0);
      },
      action: async (error) => {
        console.log(`Using simplified processing for error: ${error.id}`);
        // In a real implementation, this would use a simplified processing path
        // For demonstration, we'll just mark it as resolved
        await this.resolveError(error.id, 'Used simplified processing');
      }
    });
    
    // Strategy for system resource errors
    this.fallbackStrategies.push({
      name: 'resource_optimization',
      condition: (error) => {
        return error.category === 'system_error' && 
               error.message.includes('resource');
      },
      action: async (error) => {
        console.log(`Optimizing resources for error: ${error.id}`);
        // In a real implementation, this would free up resources
        // For demonstration, we'll just mark it as resolved
        await this.resolveError(error.id, 'Optimized resources');
      }
    });
  }

  /**
   * Start the error handler
   */
  public start(): void {
    // Register event listeners
    this.registerEventListeners();
    
    // Start periodic cleanup of old errors
    setInterval(() => {
      this.cleanupOldErrors();
    }, 3600000); // Clean up every hour
    
    console.log('Error handling system started');
  }

  /**
   * Stop the error handler
   */
  public stop(): void {
    // Unregister event listeners
    this.unregisterEventListeners();
    
    // Clear all pending retries
    for (const [errorId, timeout] of this.retryQueue.entries()) {
      clearTimeout(timeout);
      this.retryQueue.delete(errorId);
    }
    
    console.log('Error handling system stopped');
  }

  /**
   * Register event listeners
   */
  private registerEventListeners(): void {
    this.updateEngine.on('error', this.handleError.bind(this));
    this.queueManager.on('processing_error', this.handleError.bind(this));
  }

  /**
   * Unregister event listeners
   */
  private unregisterEventListeners(): void {
    this.updateEngine.off('error', this.handleError.bind(this));
    this.queueManager.off('processing_error', this.handleError.bind(this));
  }

  /**
   * Handle an error from any part of the system
   */
  public handleError(error: Error, context: Record<string, any> = {}): string {
    // Generate a unique ID for this error
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine error category and severity
    const category = this.categorizeError(error, context);
    const severity = this.determineSeverity(error, category, context);
    
    // Create error record
    const errorRecord: ErrorRecord = {
      id: errorId,
      category,
      severity,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      eventId: context.eventId,
      context,
      retryCount: 0,
      resolved: false
    };
    
    // Store the error
    this.errors.set(errorId, errorRecord);
    
    // Update error counter
    this.errorCounter[category]++;
    
    // Emit error event
    this.emit('error_recorded', errorRecord);
    
    // Determine if we should retry
    this.scheduleRetryIfNeeded(errorRecord);
    
    // Check if we need to apply a fallback strategy
    this.applyFallbackIfNeeded(errorRecord);
    
    // Log the error
    console.error(`Error [${errorId}] [${category}] [${severity}]: ${error.message}`);
    
    return errorId;
  }

  /**
   * Categorize an error based on its type and context
   */
  private categorizeError(error: Error, context: Record<string, any>): ErrorCategory {
    // In a real implementation, this would use more sophisticated logic
    // For demonstration, we'll use a simple approach based on error message
    
    const message = error.message.toLowerCase();
    
    if (message.includes('connection') || message.includes('network') || message.includes('timeout')) {
      return 'connection_error';
    } else if (message.includes('process') || message.includes('handler')) {
      return 'processing_error';
    } else if (message.includes('data') || message.includes('parse') || message.includes('format')) {
      return 'data_error';
    } else if (message.includes('system') || message.includes('resource') || message.includes('memory')) {
      return 'system_error';
    } else if (message.includes('timeout') || message.includes('expired')) {
      return 'timeout_error';
    } else if (message.includes('valid') || message.includes('schema') || message.includes('type')) {
      return 'validation_error';
    } else if (message.includes('depend') || message.includes('service') || message.includes('external')) {
      return 'dependency_error';
    }
    
    // Default to processing error if we can't determine the category
    return 'processing_error';
  }

  /**
   * Determine the severity of an error
   */
  private determineSeverity(error: Error, category: ErrorCategory, context: Record<string, any>): ErrorSeverity {
    // In a real implementation, this would use more sophisticated logic
    // For demonstration, we'll use a simple approach
    
    // Critical severity for system errors or high-priority events
    if (category === 'system_error' || context.priority === 'high') {
      return 'critical';
    }
    
    // High severity for connection errors or errors affecting multiple entities
    if (category === 'connection_error' || (context.affectedEntities && context.affectedEntities.length > 10)) {
      return 'high';
    }
    
    // Medium severity for processing and data errors
    if (category === 'processing_error' || category === 'data_error') {
      return 'medium';
    }
    
    // Low severity for everything else
    return 'low';
  }

  /**
   * Schedule a retry for an error if appropriate
   */
  private scheduleRetryIfNeeded(errorRecord: ErrorRecord): void {
    const policy = this.retryPolicies.get(errorRecord.category);
    if (!policy) return;
    
    const retryCount = errorRecord.retryCount || 0;
    
    // Check if we've exceeded max retries
    if (retryCount >= policy.maxRetries) {
      console.log(`Error ${errorRecord.id} has exceeded max retries (${policy.maxRetries})`);
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      policy.initialDelayMs * Math.pow(policy.backoffFactor, retryCount),
      policy.maxDelayMs
    );
    
    console.log(`Scheduling retry for error ${errorRecord.id} in ${delay}ms (attempt ${retryCount + 1}/${policy.maxRetries})`);
    
    // Schedule the retry
    const timeout = setTimeout(() => {
      this.retryError(errorRecord.id);
    }, delay);
    
    this.retryQueue.set(errorRecord.id, timeout);
  }

  /**
   * Retry processing for an error
   */
  private async retryError(errorId: string): Promise<void> {
    const errorRecord = this.errors.get(errorId);
    if (!errorRecord || errorRecord.resolved) return;
    
    console.log(`Retrying error ${errorId}`);
    
    // Update retry count
    errorRecord.retryCount = (errorRecord.retryCount || 0) + 1;
    this.errors.set(errorId, errorRecord);
    
    // Remove from retry queue
    this.retryQueue.delete(errorId);
    
    // Emit retry event
    this.emit('error_retry', errorRecord);
    
    try {
      // In a real implementation, this would retry the original operation
      // For demonstration, we'll simulate success or failure
      const success = Math.random() > 0.3; // 70% chance of success
      
      if (success) {
        await this.resolveError(errorId, 'Retry successful');
      } else {
        console.log(`Retry failed for error ${errorId}`);
        // Schedule another retry if needed
        this.scheduleRetryIfNeeded(errorRecord);
      }
    } catch (retryError) {
      console.error(`Error during retry for ${errorId}:`, retryError);
      // Schedule another retry if needed
      this.scheduleRetryIfNeeded(errorRecord);
    }
  }

  /**
   * Apply a fallback strategy if appropriate
   */
  private async applyFallbackIfNeeded(errorRecord: ErrorRecord): Promise<void> {
    for (const strategy of this.fallbackStrategies) {
      if (strategy.condition(errorRecord)) {
        console.log(`Applying fallback strategy '${strategy.name}' for error ${errorRecord.id}`);
        
        try {
          await strategy.action(errorRecord);
          this.emit('fallback_applied', {
            errorId: errorRecord.id,
            strategy: strategy.name
          });
        } catch (fallbackError) {
          console.error(`Error applying fallback strategy for ${errorRecord.id}:`, fallbackError);
        }
        
        break; // Only apply the first matching strategy
      }
    }
  }

  /**
   * Mark an error as resolved
   */
  public async resolveError(errorId: string, resolutionStrategy: string): Promise<void> {
    const errorRecord = this.errors.get(errorId);
    if (!errorRecord || errorRecord.resolved) return;
    
    // Update error record
    errorRecord.resolved = true;
    errorRecord.resolvedTimestamp = Date.now();
    errorRecord.resolutionStrategy = resolutionStrategy;
    this.errors.set(errorId, errorRecord);
    
    // Cancel any pending retries
    if (this.retryQueue.has(errorId)) {
      clearTimeout(this.retryQueue.get(errorId)!);
      this.retryQueue.delete(errorId);
    }
    
    // Emit resolution event
    this.emit('error_resolved', errorRecord);
    
    console.log(`Error ${errorId} resolved: ${resolutionStrategy}`);
  }

  /**
   * Get all errors matching specified filters
   */
  public getErrors(filters: {
    resolved?: boolean;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    timeRangeMs?: number;
  } = {}): ErrorRecord[] {
    const result: ErrorRecord[] = [];
    const now = Date.now();
    
    for (const error of this.errors.values()) {
      // Apply resolved filter
      if (filters.resolved !== undefined && error.resolved !== filters.resolved) {
        continue;
      }
      
      // Apply category filter
      if (filters.category && error.category !== filters.category) {
        continue;
      }
      
      // Apply severity filter
      if (filters.severity && error.severity !== filters.severity) {
        continue;
      }
      
      // Apply time range filter
      if (filters.timeRangeMs && (now - error.timestamp) > filters.timeRangeMs) {
        continue;
      }
      
      result.push(error);
    }
    
    // Sort by timestamp (newest first)
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    unresolvedErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    resolutionRate: number;
  } {
    let totalErrors = 0;
    let unresolvedErrors = 0;
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    for (const error of this.errors.values()) {
      totalErrors++;
      if (!error.resolved) {
        unresolvedErrors++;
      }
      errorsBySeverity[error.severity]++;
    }
    
    const resolutionRate = totalErrors > 0 ? (totalErrors - unresolvedErrors) / totalErrors : 1;
    
    return {
      totalErrors,
      unresolvedErrors,
      errorsByCategory: { ...this.errorCounter },
      errorsBySeverity,
      resolutionRate
    };
  }

  /**
   * Clean up old resolved errors
   */
  private cleanupOldErrors(): void {
    const cutoffTime = Date.now() - this.retentionPeriodMs;
    
    for (const [errorId, error] of this.errors.entries()) {
      // Only remove resolved errors that are older than the retention period
      if (error.resolved && error.timestamp < cutoffTime) {
        this.errors.delete(errorId);
      }
    }
  }

  /**
   * Add a custom retry policy for an error category
   */
  public addRetryPolicy(category: ErrorCategory, policy: RetryPolicy): void {
    this.retryPolicies.set(category, policy);
  }

  /**
   * Add a custom fallback strategy
   */
  public addFallbackStrategy(strategy: FallbackStrategy): void {
    this.fallbackStrategies.push(strategy);
  }

  /**
   * Manually trigger a retry for an error
   */
  public manualRetry(errorId: string): Promise<void> {
    return this.retryError(errorId);
  }

  /**
   * Get detailed information about a specific error
   */
  public getErrorDetails(errorId: string): ErrorRecord | undefined {
    return this.errors.get(errorId);
  }

  /**
   * Verify system state consistency
   */
  public async verifySystemState(): Promise<{
    consistent: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // In a real implementation, this would perform various checks
    // For demonstration, we'll simulate some checks
    
    // Check for queue consistency
    const queueDepth = this.queueManager.getQueueDepth();
    if (queueDepth < 0) {
      issues.push('Queue depth is negative, indicating a potential inconsistency');
    }
    
    // Check for orphaned errors (errors with no corresponding event)
    for (const error of this.errors.values()) {
      if (error.eventId && !error.resolved) {
        // In a real implementation, we would check if the event exists
        // For demonstration, we'll simulate a check
        const eventExists = Math.random() > 0.1; // 90% chance the event exists
        
        if (!eventExists) {
          issues.push(`Error ${error.id} references non-existent event ${error.eventId}`);
        }
      }
    }
    
    return {
      consistent: issues.length === 0,
      issues
    };
  }
}
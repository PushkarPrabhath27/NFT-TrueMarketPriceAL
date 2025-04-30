/**
 * TechnicalInfrastructure.ts
 * 
 * Implements the technical infrastructure that integrates all components
 * of the Trust Score Engine according to the technical considerations.
 * This module serves as the central integration point for data storage,
 * processing architecture, performance optimization, and security features.
 */

import { TimeSeriesDatabase } from '../../storage/TimeSeriesDatabase';
import { DocumentStorage } from '../../storage/DocumentStorage';
import { EventProcessor } from '../events/EventProcessor';
import { PerformanceOptimizer } from '../performance/PerformanceOptimizer';
import { SecurityManager } from '../security/SecurityManager';
import { SuccessMetricsMonitor } from '../metrics/SuccessMetricsMonitor';
import { TrustScoreEngine } from '../TrustScoreEngine';
import { TrustScoreUpdateManager } from '../updates/TrustScoreUpdateManager';

/**
 * Configuration options for the technical infrastructure
 */
export interface TechnicalInfrastructureConfig {
  // Whether to enable all components
  enableAll: boolean;
  // Component-specific configurations
  timeSeriesDb?: Partial<Parameters<typeof TimeSeriesDatabase>[0]>;
  documentStorage?: Partial<Parameters<typeof DocumentStorage>[0]>;
  eventProcessor?: Partial<Parameters<typeof EventProcessor>[1]>;
  performanceOptimizer?: Partial<Parameters<typeof PerformanceOptimizer>[0]>;
  securityManager?: Partial<Parameters<typeof SecurityManager>[0]>;
  successMetricsMonitor?: Partial<Parameters<typeof SuccessMetricsMonitor>[0]>;
}

/**
 * Technical infrastructure that integrates all components of the Trust Score Engine
 */
export class TechnicalInfrastructure {
  private trustScoreEngine: TrustScoreEngine;
  private timeSeriesDb: TimeSeriesDatabase;
  private documentStorage: DocumentStorage;
  private updateManager: TrustScoreUpdateManager;
  private eventProcessor: EventProcessor;
  private performanceOptimizer: PerformanceOptimizer;
  private securityManager: SecurityManager;
  private successMetricsMonitor: SuccessMetricsMonitor;
  private config: TechnicalInfrastructureConfig;
  
  /**
   * Initialize the technical infrastructure with all components
   * 
   * @param config Configuration options for the infrastructure
   */
  constructor(config?: Partial<TechnicalInfrastructureConfig>) {
    // Default configuration
    this.config = {
      enableAll: true,
      ...config
    };
    
    // Initialize components
    this.initializeComponents();
  }
  
  /**
   * Initialize all components of the technical infrastructure
   */
  private initializeComponents(): void {
    console.log('Initializing Trust Score Engine technical infrastructure...');
    
    // Initialize storage components
    this.timeSeriesDb = new TimeSeriesDatabase(this.config.timeSeriesDb);
    this.documentStorage = new DocumentStorage(this.config.documentStorage);
    
    // Initialize core engine
    this.trustScoreEngine = new TrustScoreEngine();
    
    // Initialize update manager
    this.updateManager = new TrustScoreUpdateManager(this.trustScoreEngine);
    
    // Initialize event processor
    this.eventProcessor = new EventProcessor(this.updateManager, this.config.eventProcessor);
    
    // Initialize performance optimizer
    this.performanceOptimizer = new PerformanceOptimizer(this.config.performanceOptimizer);
    
    // Initialize security manager
    this.securityManager = new SecurityManager(this.config.securityManager);
    
    // Initialize success metrics monitor
    this.successMetricsMonitor = new SuccessMetricsMonitor(this.config.successMetricsMonitor);
    
    console.log('Trust Score Engine technical infrastructure initialized successfully.');
  }
  
  /**
   * Get the trust score engine instance
   * 
   * @returns Trust score engine instance
   */
  public getTrustScoreEngine(): TrustScoreEngine {
    return this.trustScoreEngine;
  }
  
  /**
   * Get the time-series database instance
   * 
   * @returns Time-series database instance
   */
  public getTimeSeriesDb(): TimeSeriesDatabase {
    return this.timeSeriesDb;
  }
  
  /**
   * Get the document storage instance
   * 
   * @returns Document storage instance
   */
  public getDocumentStorage(): DocumentStorage {
    return this.documentStorage;
  }
  
  /**
   * Get the update manager instance
   * 
   * @returns Update manager instance
   */
  public getUpdateManager(): TrustScoreUpdateManager {
    return this.updateManager;
  }
  
  /**
   * Get the event processor instance
   * 
   * @returns Event processor instance
   */
  public getEventProcessor(): EventProcessor {
    return this.eventProcessor;
  }
  
  /**
   * Get the performance optimizer instance
   * 
   * @returns Performance optimizer instance
   */
  public getPerformanceOptimizer(): PerformanceOptimizer {
    return this.performanceOptimizer;
  }
  
  /**
   * Get the security manager instance
   * 
   * @returns Security manager instance
   */
  public getSecurityManager(): SecurityManager {
    return this.securityManager;
  }
  
  /**
   * Get the success metrics monitor instance
   * 
   * @returns Success metrics monitor instance
   */
  public getSuccessMetricsMonitor(): SuccessMetricsMonitor {
    return this.successMetricsMonitor;
  }
  
  /**
   * Process a trust score calculation with all technical considerations applied
   * 
   * @param nftId NFT ID
   * @param inputData Input data for trust score calculation
   * @param context Request context for security checks
   * @returns Trust score result
   */
  public async processTrustScoreCalculation(nftId: string, inputData: any, context: any): Promise<any> {
    // Create request context for security
    const requestContext = this.securityManager.createRequestContext(context);
    
    // Check security
    if (!this.securityManager.checkRateLimit(requestContext)) {
      throw new Error('Rate limit exceeded');
    }
    
    // Validate request
    const validationResult = this.securityManager.validateRequest(requestContext, inputData);
    if (!validationResult.valid) {
      throw new Error(`Invalid request: ${validationResult.errors?.join(', ')}`);
    }
    
    // Check access
    if (!this.securityManager.checkAccess(requestContext, 'nft', 'read')) {
      throw new Error('Access denied');
    }
    
    // Log audit event
    this.securityManager.logAuditEvent('access', requestContext, 'Trust score calculation', { nftId });
    
    // Start performance monitoring
    const startTime = Date.now();
    
    try {
      // Use performance optimizer to handle the operation
      const result = await this.performanceOptimizer.optimizeOperation(
        `trust_score:${nftId}`,
        async () => {
          // Calculate trust score
          const trustScore = await this.trustScoreEngine.calculateNFTTrustScore(nftId, inputData);
          
          // Store in document storage
          await this.documentStorage.storeNFTTrustScore(nftId, trustScore);
          
          // Store history point in time-series database
          const historyPoint = {
            timestamp: trustScore.timestamp,
            score: trustScore.overallScore,
            confidence: trustScore.confidence
          };
          await this.timeSeriesDb.storeNFTScorePoint(nftId, historyPoint);
          
          return trustScore;
        }
      );
      
      // Record API response time for metrics
      const responseTime = Date.now() - startTime;
      this.successMetricsMonitor.recordApiResponseTime(responseTime);
      
      return result;
    } catch (error) {
      // Log error
      this.securityManager.logAuditEvent('error', requestContext, 'Trust score calculation failed', { 
        nftId, 
        error: error.message 
      });
      
      throw error;
    }
  }
  
  /**
   * Process an update event with all technical considerations applied
   * 
   * @param event Update event
   * @returns Processing result
   */
  public async processUpdateEvent(event: any): Promise<void> {
    // Start performance monitoring
    const startTime = Date.now();
    
    try {
      // Forward to event processor
      await this.eventProcessor.processEvent(event);
      
      // Record update latency for metrics
      const updateLatency = Date.now() - startTime;
      this.successMetricsMonitor.recordUpdateLatency(updateLatency);
    } catch (error) {
      console.error('Error processing update event:', error);
      throw error;
    }
  }
  
  /**
   * Generate a success metrics report
   * 
   * @returns Success metrics report
   */
  public generateSuccessMetricsReport(): any {
    return this.successMetricsMonitor.generateReport();
  }
  
  /**
   * Check if all success metrics targets are being met
   * 
   * @returns Whether all targets are being met
   */
  public areAllSuccessTargetsMet(): boolean {
    return this.successMetricsMonitor.areAllTargetsMet();
  }
  
  /**
   * Get unmet success metrics targets
   * 
   * @returns Array of unmet targets
   */
  public getUnmetSuccessTargets(): string[] {
    return this.successMetricsMonitor.getUnmetTargets();
  }
  
  /**
   * Get current performance metrics
   * 
   * @returns Performance metrics
   */
  public getPerformanceMetrics(): any {
    return this.performanceOptimizer.getMetrics();
  }
  
  /**
   * Get event processing statistics
   * 
   * @returns Event processing statistics
   */
  public getEventProcessingStats(): any {
    return this.eventProcessor.getStats();
  }
  
  /**
   * Get recent audit log entries
   * 
   * @param limit Maximum number of entries to return
   * @param filter Optional filter for event types
   * @returns Recent audit log entries
   */
  public getRecentAuditLog(limit?: number, filter?: string[]): any[] {
    return this.securityManager.getRecentAuditLog(limit, filter);
  }
}
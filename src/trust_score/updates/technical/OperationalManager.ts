/**
 * OperationalManager.ts
 * 
 * This file implements the Operational Considerations component of the NFT TrustScore
 * real-time update system, handling blue/green deployment, logging strategy,
 * configuration management, disaster recovery, and security monitoring.
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../monitoring/Logger';
import { MetricsCollector } from '../../monitoring/MetricsCollector';
import { ConfigManager } from '../../config/ConfigManager';

/**
 * Deployment environment types
 */
export enum DeploymentEnvironment {
  BLUE = 'blue',
  GREEN = 'green',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * Deployment status types
 */
export enum DeploymentStatus {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  DRAINING = 'draining',
  INACTIVE = 'inactive',
  FAILED = 'failed'
}

/**
 * Blue/Green deployment manager for zero-downtime updates
 */
export class BlueGreenDeploymentManager {
  private currentEnvironment: DeploymentEnvironment;
  private environmentStatus: Map<DeploymentEnvironment, DeploymentStatus> = new Map();
  private deploymentTimestamps: Map<DeploymentEnvironment, number> = new Map();
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(logger: Logger, metrics: MetricsCollector) {
    this.logger = logger;
    this.metrics = metrics;
    
    // Initialize with blue as active by default
    this.currentEnvironment = DeploymentEnvironment.BLUE;
    this.environmentStatus.set(DeploymentEnvironment.BLUE, DeploymentStatus.ACTIVE);
    this.environmentStatus.set(DeploymentEnvironment.GREEN, DeploymentStatus.INACTIVE);
    this.deploymentTimestamps.set(DeploymentEnvironment.BLUE, Date.now());
    
    this.logger.info(`Blue/Green deployment manager initialized with ${this.currentEnvironment} active`);
  }
  
  /**
   * Prepares the inactive environment for deployment
   */
  prepareDeployment(): DeploymentEnvironment {
    const targetEnv = this.currentEnvironment === DeploymentEnvironment.BLUE 
      ? DeploymentEnvironment.GREEN 
      : DeploymentEnvironment.BLUE;
    
    this.environmentStatus.set(targetEnv, DeploymentStatus.INITIALIZING);
    this.logger.info(`Preparing ${targetEnv} environment for deployment`);
    this.metrics.incrementCounter('deployment_preparations');
    
    return targetEnv;
  }
  
  /**
   * Activates the target environment and begins draining the current one
   */
  switchTraffic(targetEnv: DeploymentEnvironment): void {
    if (!this.environmentStatus.has(targetEnv) || 
        this.environmentStatus.get(targetEnv) !== DeploymentStatus.INITIALIZING) {
      throw new Error(`Cannot switch traffic to ${targetEnv}: environment not ready`);
    }
    
    const previousEnv = this.currentEnvironment;
    this.currentEnvironment = targetEnv;
    
    this.environmentStatus.set(targetEnv, DeploymentStatus.ACTIVE);
    this.environmentStatus.set(previousEnv, DeploymentStatus.DRAINING);
    this.deploymentTimestamps.set(targetEnv, Date.now());
    
    this.logger.info(`Switched traffic from ${previousEnv} to ${targetEnv}`);
    this.metrics.incrementCounter('traffic_switches');
    this.metrics.recordGauge('active_environment', targetEnv === DeploymentEnvironment.BLUE ? 0 : 1);
  }
  
  /**
   * Completes the deployment by deactivating the old environment
   */
  completeDeployment(): void {
    const drainingEnv = Array.from(this.environmentStatus.entries())
      .find(([_, status]) => status === DeploymentStatus.DRAINING)?.[0];
    
    if (!drainingEnv) {
      this.logger.warn('No draining environment found to complete deployment');
      return;
    }
    
    this.environmentStatus.set(drainingEnv, DeploymentStatus.INACTIVE);
    this.logger.info(`Completed deployment, ${drainingEnv} is now inactive`);
    this.metrics.incrementCounter('deployments_completed');
  }
  
  /**
   * Rolls back to the previous environment in case of issues
   */
  rollback(): void {
    const inactiveEnv = Array.from(this.environmentStatus.entries())
      .find(([_, status]) => status === DeploymentStatus.DRAINING || 
                            status === DeploymentStatus.INACTIVE)?.[0];
    
    if (!inactiveEnv) {
      throw new Error('No environment available for rollback');
    }
    
    const previousEnv = this.currentEnvironment;
    this.currentEnvironment = inactiveEnv;
    
    this.environmentStatus.set(inactiveEnv, DeploymentStatus.ACTIVE);
    this.environmentStatus.set(previousEnv, DeploymentStatus.FAILED);
    
    this.logger.warn(`Rolled back from ${previousEnv} to ${inactiveEnv} due to issues`);
    this.metrics.incrementCounter('deployment_rollbacks');
  }
  
  /**
   * Gets the current active environment
   */
  getCurrentEnvironment(): DeploymentEnvironment {
    return this.currentEnvironment;
  }
  
  /**
   * Gets the status of a specific environment
   */
  getEnvironmentStatus(env: DeploymentEnvironment): DeploymentStatus {
    return this.environmentStatus.get(env) || DeploymentStatus.INACTIVE;
  }
  
  /**
   * Gets the deployment timestamp for an environment
   */
  getDeploymentTimestamp(env: DeploymentEnvironment): number | undefined {
    return this.deploymentTimestamps.get(env);
  }
}

/**
 * Log level types
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  correlationId?: string;
  component: string;
}

/**
 * Enhanced logging strategy with structured logs and correlation
 */
export class LoggingStrategy {
  private logger: Logger;
  private component: string;
  private correlationId: string | null = null;
  
  constructor(logger: Logger, component: string) {
    this.logger = logger;
    this.component = component;
  }
  
  /**
   * Sets the correlation ID for request tracing
   */
  setCorrelationId(id: string | null): void {
    this.correlationId = id;
  }
  
  /**
   * Generates a new correlation ID
   */
  generateCorrelationId(): string {
    const id = uuidv4();
    this.correlationId = id;
    return id;
  }
  
  /**
   * Creates a structured log entry
   */
  private createLogEntry(level: LogLevel, message: string, context: Record<string, any> = {}): LogEntry {
    return {
      timestamp: Date.now(),
      level,
      message,
      context,
      correlationId: this.correlationId || undefined,
      component: this.component
    };
  }
  
  /**
   * Logs a debug message
   */
  debug(message: string, context: Record<string, any> = {}): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.logger.debug(JSON.stringify(entry));
  }
  
  /**
   * Logs an info message
   */
  info(message: string, context: Record<string, any> = {}): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.logger.info(JSON.stringify(entry));
  }
  
  /**
   * Logs a warning message
   */
  warn(message: string, context: Record<string, any> = {}): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.logger.warn(JSON.stringify(entry));
  }
  
  /**
   * Logs an error message
   */
  error(message: string, error?: Error, context: Record<string, any> = {}): void {
    const errorContext = error ? {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack
    } : context;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, errorContext);
    this.logger.error(JSON.stringify(entry));
  }
  
  /**
   * Logs a critical message
   */
  critical(message: string, error?: Error, context: Record<string, any> = {}): void {
    const errorContext = error ? {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack
    } : context;
    
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, errorContext);
    this.logger.error(JSON.stringify(entry)); // Using error as most loggers don't have critical
  }
  
  /**
   * Creates a child logger with inherited correlation ID
   */
  createChildLogger(childComponent: string): LoggingStrategy {
    const childLogger = new LoggingStrategy(this.logger, `${this.component}.${childComponent}`);
    if (this.correlationId) {
      childLogger.setCorrelationId(this.correlationId);
    }
    return childLogger;
  }
}

/**
 * Disaster recovery status
 */
export enum RecoveryStatus {
  NORMAL = 'normal',
  DEGRADED = 'degraded',
  RECOVERING = 'recovering',
  FAILED = 'failed'
}

/**
 * Disaster recovery manager for system resilience
 */
export class DisasterRecoveryManager {
  private status: RecoveryStatus = RecoveryStatus.NORMAL;
  private lastCheckpoint: number = Date.now();
  private recoveryPlan: Map<string, () => Promise<boolean>> = new Map();
  private logger: LoggingStrategy;
  private metrics: MetricsCollector;
  
  constructor(logger: LoggingStrategy, metrics: MetricsCollector) {
    this.logger = logger;
    this.metrics = metrics;
    this.logger.info('Disaster recovery manager initialized');
  }
  
  /**
   * Registers a recovery procedure for a specific component
   */
  registerRecoveryProcedure(componentName: string, procedure: () => Promise<boolean>): void {
    this.recoveryPlan.set(componentName, procedure);
    this.logger.debug(`Registered recovery procedure for ${componentName}`);
  }
  
  /**
   * Creates a system checkpoint for potential rollback
   */
  createCheckpoint(): void {
    this.lastCheckpoint = Date.now();
    this.logger.info('Created system checkpoint', { timestamp: this.lastCheckpoint });
    this.metrics.incrementCounter('recovery_checkpoints_created');
  }
  
  /**
   * Initiates disaster recovery procedures
   */
  async initiateRecovery(componentName?: string): Promise<boolean> {
    this.status = RecoveryStatus.RECOVERING;
    this.logger.warn('Initiating disaster recovery', { 
      component: componentName || 'all',
      lastCheckpoint: this.lastCheckpoint 
    });
    this.metrics.incrementCounter('recovery_procedures_initiated');
    
    try {
      if (componentName && this.recoveryPlan.has(componentName)) {
        // Recover specific component
        const success = await this.recoveryPlan.get(componentName)!();
        this.status = success ? RecoveryStatus.NORMAL : RecoveryStatus.DEGRADED;
        this.logger.info(`Recovery of ${componentName} ${success ? 'succeeded' : 'partially succeeded'}`);
        return success;
      } else {
        // Recover all components
        const results = await Promise.all(
          Array.from(this.recoveryPlan.entries()).map(async ([name, procedure]) => {
            try {
              const success = await procedure();
              this.logger.info(`Recovery of ${name} ${success ? 'succeeded' : 'failed'}`);
              return success;
            } catch (error) {
              this.logger.error(`Error during recovery of ${name}`, error as Error);
              return false;
            }
          })
        );
        
        const allSucceeded = results.every(result => result);
        this.status = allSucceeded ? RecoveryStatus.NORMAL : RecoveryStatus.DEGRADED;
        return allSucceeded;
      }
    } catch (error) {
      this.status = RecoveryStatus.FAILED;
      this.logger.critical('Disaster recovery failed', error as Error);
      this.metrics.incrementCounter('recovery_procedures_failed');
      return false;
    }
  }
  
  /**
   * Gets the current recovery status
   */
  getStatus(): RecoveryStatus {
    return this.status;
  }
  
  /**
   * Gets the timestamp of the last checkpoint
   */
  getLastCheckpoint(): number {
    return this.lastCheckpoint;
  }
}

/**
 * Security alert severity levels
 */
export enum SecurityAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Security alert interface
 */
export interface SecurityAlert {
  id: string;
  timestamp: number;
  severity: SecurityAlertSeverity;
  source: string;
  description: string;
  details: Record<string, any>;
  mitigationSteps?: string[];
}

/**
 * Security monitoring and protection system
 */
export class SecurityMonitor {
  private alerts: SecurityAlert[] = [];
  private handlers: Map<SecurityAlertSeverity, ((alert: SecurityAlert) => Promise<void>)[]> = new Map();
  private logger: LoggingStrategy;
  private metrics: MetricsCollector;
  
  constructor(logger: LoggingStrategy, metrics: MetricsCollector) {
    this.logger = logger;
    this.metrics = metrics;
    
    // Initialize handlers for each severity level
    Object.values(SecurityAlertSeverity).forEach(severity => {
      this.handlers.set(severity as SecurityAlertSeverity, []);
    });
    
    this.logger.info('Security monitoring system initialized');
  }
  
  /**
   * Registers a handler for a specific alert severity
   */
  registerAlertHandler(
    severity: SecurityAlertSeverity,
    handler: (alert: SecurityAlert) => Promise<void>
  ): void {
    const handlers = this.handlers.get(severity) || [];
    handlers.push(handler);
    this.handlers.set(severity, handlers);
    this.logger.debug(`Registered handler for ${severity} security alerts`);
  }
  
  /**
   * Creates and processes a security alert
   */
  async createAlert(
    severity: SecurityAlertSeverity,
    source: string,
    description: string,
    details: Record<string, any> = {},
    mitigationSteps?: string[]
  ): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: uuidv4(),
      timestamp: Date.now(),
      severity,
      source,
      description,
      details,
      mitigationSteps
    };
    
    this.alerts.push(alert);
    this.metrics.incrementCounter(`security_alerts_${severity}`);
    
    // Log the alert
    this.logger.warn(`Security alert: ${description}`, {
      alertId: alert.id,
      severity,
      source
    });
    
    // Process the alert with registered handlers
    await this.processAlert(alert);
    
    return alert;
  }
  
  /**
   * Processes an alert with registered handlers
   */
  private async processAlert(alert: SecurityAlert): Promise<void> {
    const handlers = this.handlers.get(alert.severity) || [];
    
    try {
      await Promise.all(handlers.map(handler => handler(alert)));
    } catch (error) {
      this.logger.error('Error processing security alert', error as Error, {
        alertId: alert.id,
        severity: alert.severity
      });
    }
  }
  
  /**
   * Gets recent alerts, optionally filtered by severity
   */
  getRecentAlerts(severity?: SecurityAlertSeverity, limit: number = 10): SecurityAlert[] {
    let filteredAlerts = this.alerts;
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    return filteredAlerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  /**
   * Checks if there are any active critical alerts
   */
  hasCriticalAlerts(): boolean {
    const recentAlerts = this.getRecentAlerts(SecurityAlertSeverity.CRITICAL, 5);
    return recentAlerts.length > 0;
  }
}

/**
 * Main class that orchestrates operational capabilities
 */
export class OperationalManager {
  private logger: Logger;
  private metrics: MetricsCollector;
  private config: ConfigManager;
  private loggingStrategy: LoggingStrategy;
  private blueGreenManager: BlueGreenDeploymentManager;
  private disasterRecovery: DisasterRecoveryManager;
  private securityMonitor: SecurityMonitor;
  
  constructor(
    logger: Logger,
    metrics: MetricsCollector,
    config: ConfigManager
  ) {
    this.logger = logger;
    this.metrics = metrics;
    this.config = config;
    
    // Initialize components
    this.loggingStrategy = new LoggingStrategy(logger, 'OperationalManager');
    this.blueGreenManager = new BlueGreenDeploymentManager(logger, metrics);
    this.disasterRecovery = new DisasterRecoveryManager(this.loggingStrategy, metrics);
    this.securityMonitor = new SecurityMonitor(this.loggingStrategy, metrics);
    
    this.loggingStrategy.info('OperationalManager initialized');
  }
  
  /**
   * Gets the blue/green deployment manager
   */
  getDeploymentManager(): BlueGreenDeploymentManager {
    return this.blueGreenManager;
  }
  
  /**
   * Gets the logging strategy
   */
  getLoggingStrategy(): LoggingStrategy {
    return this.loggingStrategy;
  }
  
  /**
   * Gets the disaster recovery manager
   */
  getDisasterRecoveryManager(): DisasterRecoveryManager {
    return this.disasterRecovery;
  }
  
  /**
   * Gets the security monitor
   */
  getSecurityMonitor(): SecurityMonitor {
    return this.securityMonitor;
  }
  
  /**
   * Gets the configuration manager
   */
  getConfigManager(): ConfigManager {
    return this.config;
  }
  
  /**
   * Sets a configuration value
   */
  setConfig(key: string, value: string | number | boolean | object | null, options?: { user?: string; reason?: string }): void {
    this.config.set(key, value, options);
  }
  
  /**
   * Gets a configuration value
   */
  getConfig<T>(key: string, defaultValue?: T): T {
    return this.config.get(key, defaultValue);
  }
  
  /**
   * Sets a feature flag
   */
  setFeatureFlag(
    name: string, 
    enabled: boolean, 
    options?: { 
      description?: string; 
      conditions?: Record<string, any>; 
      rolloutPercentage?: number;
      user?: string;
      reason?: string;
    }
  ): void {
    this.config.setFeatureFlag(name, enabled, options);
  }
  
  /**
   * Checks if a feature is enabled
   */
  isFeatureEnabled(name: string, context?: Record<string, any>): boolean {
    return this.config.isFeatureEnabled(name, context);
  }
  
  /**
   * Creates a checkpoint for disaster recovery
   */
  createSystemCheckpoint(): void {
    this.disasterRecovery.createCheckpoint();
  }
  
  /**
   * Prepares a new deployment using blue/green strategy
   */
  prepareDeployment(): DeploymentEnvironment {
    return this.blueGreenManager.prepareDeployment();
  }
  
  /**
   * Creates a security alert
   */
  async createSecurityAlert(
    severity: SecurityAlertSeverity,
    source: string,
    description: string,
    details: Record<string, any> = {}
  ): Promise<SecurityAlert> {
    return this.securityMonitor.createAlert(severity, source, description, details);
  }
  
  /**
   * Creates a child logger for a specific component
   */
  createComponentLogger(componentName: string): LoggingStrategy {
    return this.loggingStrategy.createChildLogger(componentName);
  }
}
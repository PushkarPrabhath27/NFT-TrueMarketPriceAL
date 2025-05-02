/**
 * ConfigManager.ts
 * 
 * This file implements the Configuration Management component of the NFT TrustScore
 * real-time update system, handling centralized configuration with environment-specific
 * settings, feature flags, dynamic updates, and audit trails.
 */

import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../monitoring/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';

/**
 * Configuration change types
 */
export enum ConfigChangeType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted'
}

/**
 * Configuration environment types
 */
export enum ConfigEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * Configuration value types
 */
export type ConfigValue = string | number | boolean | object | null;

/**
 * Configuration change record for audit trail
 */
export interface ConfigChangeRecord {
  id: string;
  timestamp: number;
  key: string;
  previousValue?: ConfigValue;
  newValue?: ConfigValue;
  changeType: ConfigChangeType;
  user?: string;
  reason?: string;
}

/**
 * Feature flag interface
 */
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  conditions?: Record<string, any>;
  rolloutPercentage?: number;
  lastUpdated: number;
}

/**
 * Configuration manager for centralized configuration management
 */
export class ConfigManager {
  private environment: ConfigEnvironment;
  private configStore: Map<string, ConfigValue> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private environmentOverrides: Map<ConfigEnvironment, Map<string, ConfigValue>> = new Map();
  private changeHistory: ConfigChangeRecord[] = [];
  private configWatchers: Map<string, Set<(newValue: ConfigValue, oldValue?: ConfigValue) => void>> = new Map();
  private logger: Logger;
  private metrics: MetricsCollector;
  
  constructor(environment: ConfigEnvironment, logger: Logger, metrics: MetricsCollector) {
    this.environment = environment;
    this.logger = logger;
    this.metrics = metrics;
    
    // Initialize environment overrides maps
    Object.values(ConfigEnvironment).forEach(env => {
      this.environmentOverrides.set(env as ConfigEnvironment, new Map());
    });
    
    this.logger.info(`Configuration manager initialized for ${environment} environment`);
  }
  
  /**
   * Sets a configuration value
   */
  set(key: string, value: ConfigValue, options?: { user?: string; reason?: string }): void {
    const oldValue = this.get(key);
    const changeType = oldValue !== undefined ? ConfigChangeType.UPDATED : ConfigChangeType.CREATED;
    
    // Store in the appropriate location based on environment
    if (this.environment !== ConfigEnvironment.PRODUCTION) {
      // In non-production, store directly in the main config store
      this.configStore.set(key, value);
    } else {
      // In production, store in the environment overrides
      const envOverrides = this.environmentOverrides.get(this.environment)!;
      envOverrides.set(key, value);
    }
    
    // Record the change
    this.recordChange(key, oldValue, value, changeType, options?.user, options?.reason);
    
    // Notify watchers
    this.notifyWatchers(key, value, oldValue);
    
    this.logger.info(`Configuration ${changeType}: ${key}`, { 
      environment: this.environment,
      user: options?.user
    });
    this.metrics.incrementCounter('config_changes');
  }
  
  /**
   * Gets a configuration value
   */
  get<T extends ConfigValue>(key: string, defaultValue?: T): T {
    // Check environment-specific overrides first
    const envOverrides = this.environmentOverrides.get(this.environment);
    if (envOverrides && envOverrides.has(key)) {
      return envOverrides.get(key) as T;
    }
    
    // Then check the main config store
    if (this.configStore.has(key)) {
      return this.configStore.get(key) as T;
    }
    
    // Return default value if provided
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    // Otherwise return undefined
    return undefined as unknown as T;
  }
  
  /**
   * Deletes a configuration value
   */
  delete(key: string, options?: { user?: string; reason?: string }): boolean {
    const oldValue = this.get(key);
    if (oldValue === undefined) {
      return false;
    }
    
    // Remove from both main store and environment overrides
    this.configStore.delete(key);
    Object.values(ConfigEnvironment).forEach(env => {
      const envOverrides = this.environmentOverrides.get(env as ConfigEnvironment);
      if (envOverrides) {
        envOverrides.delete(key);
      }
    });
    
    // Record the change
    this.recordChange(key, oldValue, undefined, ConfigChangeType.DELETED, options?.user, options?.reason);
    
    // Notify watchers
    this.notifyWatchers(key, undefined, oldValue);
    
    this.logger.info(`Configuration deleted: ${key}`, { 
      environment: this.environment,
      user: options?.user
    });
    this.metrics.incrementCounter('config_deletions');
    
    return true;
  }
  
  /**
   * Sets an environment-specific configuration override
   */
  setEnvironmentOverride(
    key: string, 
    value: ConfigValue, 
    environment: ConfigEnvironment,
    options?: { user?: string; reason?: string }
  ): void {
    const envOverrides = this.environmentOverrides.get(environment)!;
    const oldValue = envOverrides.get(key);
    const changeType = oldValue !== undefined ? ConfigChangeType.UPDATED : ConfigChangeType.CREATED;
    
    envOverrides.set(key, value);
    
    // Record the change
    this.recordChange(
      `${environment}:${key}`, 
      oldValue, 
      value, 
      changeType, 
      options?.user, 
      options?.reason
    );
    
    this.logger.info(`Environment override ${changeType}: ${key} for ${environment}`, { 
      user: options?.user
    });
    this.metrics.incrementCounter('config_environment_overrides');
    
    // If this is for the current environment, notify watchers
    if (environment === this.environment) {
      this.notifyWatchers(key, value, oldValue);
    }
  }
  
  /**
   * Removes an environment-specific configuration override
   */
  removeEnvironmentOverride(
    key: string, 
    environment: ConfigEnvironment,
    options?: { user?: string; reason?: string }
  ): boolean {
    const envOverrides = this.environmentOverrides.get(environment)!;
    const oldValue = envOverrides.get(key);
    
    if (oldValue === undefined) {
      return false;
    }
    
    envOverrides.delete(key);
    
    // Record the change
    this.recordChange(
      `${environment}:${key}`, 
      oldValue, 
      undefined, 
      ConfigChangeType.DELETED, 
      options?.user, 
      options?.reason
    );
    
    this.logger.info(`Environment override deleted: ${key} for ${environment}`, { 
      user: options?.user
    });
    
    // If this is for the current environment, notify watchers
    if (environment === this.environment) {
      // Get the base value to fall back to
      const baseValue = this.configStore.get(key);
      this.notifyWatchers(key, baseValue, oldValue);
    }
    
    return true;
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
    const existingFlag = this.featureFlags.get(name);
    const changeType = existingFlag ? ConfigChangeType.UPDATED : ConfigChangeType.CREATED;
    
    const featureFlag: FeatureFlag = {
      name,
      enabled,
      description: options?.description || existingFlag?.description,
      conditions: options?.conditions || existingFlag?.conditions,
      rolloutPercentage: options?.rolloutPercentage !== undefined 
        ? options.rolloutPercentage 
        : existingFlag?.rolloutPercentage,
      lastUpdated: Date.now()
    };
    
    this.featureFlags.set(name, featureFlag);
    
    // Record the change
    this.recordChange(
      `feature:${name}`, 
      existingFlag, 
      featureFlag, 
      changeType, 
      options?.user, 
      options?.reason
    );
    
    this.logger.info(`Feature flag ${changeType}: ${name} = ${enabled}`, { 
      environment: this.environment,
      user: options?.user,
      rolloutPercentage: featureFlag.rolloutPercentage
    });
    this.metrics.incrementCounter('feature_flag_changes');
  }
  
  /**
   * Checks if a feature flag is enabled
   */
  isFeatureEnabled(name: string, context?: Record<string, any>): boolean {
    const flag = this.featureFlags.get(name);
    
    if (!flag) {
      return false;
    }
    
    // If not enabled, return false immediately
    if (!flag.enabled) {
      return false;
    }
    
    // Check rollout percentage if specified
    if (flag.rolloutPercentage !== undefined && context?.id) {
      // Use the context ID to determine if this instance should have the feature enabled
      // This ensures consistent behavior for the same ID
      const hash = this.hashString(context.id);
      const normalizedHash = hash % 100;
      
      if (normalizedHash >= flag.rolloutPercentage) {
        return false;
      }
    }
    
    // Check conditions if specified
    if (flag.conditions && context) {
      // Simple condition matching - in a real implementation this would be more sophisticated
      for (const [key, value] of Object.entries(flag.conditions)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Gets all feature flags
   */
  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }
  
  /**
   * Deletes a feature flag
   */
  deleteFeatureFlag(name: string, options?: { user?: string; reason?: string }): boolean {
    const flag = this.featureFlags.get(name);
    
    if (!flag) {
      return false;
    }
    
    this.featureFlags.delete(name);
    
    // Record the change
    this.recordChange(
      `feature:${name}`, 
      flag, 
      undefined, 
      ConfigChangeType.DELETED, 
      options?.user, 
      options?.reason
    );
    
    this.logger.info(`Feature flag deleted: ${name}`, { 
      environment: this.environment,
      user: options?.user
    });
    this.metrics.incrementCounter('feature_flag_deletions');
    
    return true;
  }
  
  /**
   * Watches for changes to a configuration value
   */
  watch(key: string, callback: (newValue: ConfigValue, oldValue?: ConfigValue) => void): () => void {
    if (!this.configWatchers.has(key)) {
      this.configWatchers.set(key, new Set());
    }
    
    const watchers = this.configWatchers.get(key)!;
    watchers.add(callback);
    
    // Return a function to unsubscribe
    return () => {
      const watchers = this.configWatchers.get(key);
      if (watchers) {
        watchers.delete(callback);
        if (watchers.size === 0) {
          this.configWatchers.delete(key);
        }
      }
    };
  }
  
  /**
   * Gets the configuration change history
   */
  getChangeHistory(limit: number = 100): ConfigChangeRecord[] {
    return this.changeHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  /**
   * Gets the configuration change history for a specific key
   */
  getKeyChangeHistory(key: string, limit: number = 20): ConfigChangeRecord[] {
    return this.changeHistory
      .filter(record => record.key === key)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  /**
   * Exports all configuration as a JSON object
   */
  exportConfig(): Record<string, any> {
    const config: Record<string, any> = {};
    
    // Export base configuration
    for (const [key, value] of this.configStore.entries()) {
      config[key] = value;
    }
    
    // Apply environment overrides
    const envOverrides = this.environmentOverrides.get(this.environment);
    if (envOverrides) {
      for (const [key, value] of envOverrides.entries()) {
        config[key] = value;
      }
    }
    
    // Add feature flags
    config.featureFlags = {};
    for (const [name, flag] of this.featureFlags.entries()) {
      config.featureFlags[name] = flag;
    }
    
    return config;
  }
  
  /**
   * Imports configuration from a JSON object
   */
  importConfig(config: Record<string, any>, options?: { user?: string; reason?: string }): void {
    // Track number of changes for metrics
    let changeCount = 0;
    
    // Import feature flags
    if (config.featureFlags) {
      for (const [name, flag] of Object.entries(config.featureFlags)) {
        if (typeof flag === 'object' && flag !== null) {
          this.setFeatureFlag(name, (flag as FeatureFlag).enabled, {
            ...flag as any,
            user: options?.user,
            reason: options?.reason || 'Imported from config'
          });
          changeCount++;
        }
      }
      
      // Remove featureFlags from config to avoid processing it as a regular config
      delete config.featureFlags;
    }
    
    // Import regular configuration
    for (const [key, value] of Object.entries(config)) {
      this.set(key, value, {
        user: options?.user,
        reason: options?.reason || 'Imported from config'
      });
      changeCount++;
    }
    
    this.logger.info(`Imported ${changeCount} configuration items`, {
      user: options?.user
    });
    this.metrics.recordGauge('config_import_count', changeCount);
  }
  
  /**
   * Gets the current environment
   */
  getEnvironment(): ConfigEnvironment {
    return this.environment;
  }
  
  /**
   * Sets the current environment
   */
  setEnvironment(environment: ConfigEnvironment): void {
    const oldEnvironment = this.environment;
    this.environment = environment;
    
    this.logger.info(`Switched configuration environment from ${oldEnvironment} to ${environment}`);
    this.metrics.incrementCounter('config_environment_switches');
    
    // Notify all watchers as values may have changed due to environment overrides
    for (const key of this.configStore.keys()) {
      const oldValue = this.getValueForEnvironment(key, oldEnvironment);
      const newValue = this.get(key);
      
      if (oldValue !== newValue) {
        this.notifyWatchers(key, newValue, oldValue);
      }
    }
  }
  
  /**
   * Records a configuration change in the audit trail
   */
  private recordChange(
    key: string,
    previousValue: ConfigValue | undefined,
    newValue: ConfigValue | undefined,
    changeType: ConfigChangeType,
    user?: string,
    reason?: string
  ): void {
    const record: ConfigChangeRecord = {
      id: uuidv4(),
      timestamp: Date.now(),
      key,
      previousValue,
      newValue,
      changeType,
      user,
      reason
    };
    
    this.changeHistory.push(record);
    
    // Limit history size to prevent memory issues
    if (this.changeHistory.length > 1000) {
      this.changeHistory = this.changeHistory.slice(-1000);
    }
  }
  
  /**
   * Notifies watchers of a configuration change
   */
  private notifyWatchers(key: string, newValue: ConfigValue | undefined, oldValue: ConfigValue | undefined): void {
    const watchers = this.configWatchers.get(key);
    if (watchers) {
      for (const callback of watchers) {
        try {
          callback(newValue as ConfigValue, oldValue);
        } catch (error) {
          this.logger.error(`Error in configuration watcher for ${key}`, error as Error);
        }
      }
    }
  }
  
  /**
   * Gets a configuration value for a specific environment
   */
  private getValueForEnvironment(key: string, environment: ConfigEnvironment): ConfigValue | undefined {
    const envOverrides = this.environmentOverrides.get(environment);
    if (envOverrides && envOverrides.has(key)) {
      return envOverrides.get(key);
    }
    
    return this.configStore.get(key);
  }
  
  /**
   * Simple string hashing function for feature flag percentage rollouts
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
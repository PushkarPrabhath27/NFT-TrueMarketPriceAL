/**
 * index.ts
 * 
 * Main export file for the Trust Score Engine.
 * This file exports all components of the trust score system for easy importing.
 */

// Core engine
export { TrustScoreEngine } from './TrustScoreEngine';

// Types
export { TrustScoreTypes } from './types';

// Factor calculators
export { FactorCalculator } from './factors/FactorCalculator';
export { OriginalityFactor } from './factors/OriginalityFactor';
export { TransactionLegitimacyFactor } from './factors/TransactionLegitimacyFactor';

// Score aggregation
export { ScoreAggregator } from './aggregation/ScoreAggregator';

// History tracking
export { HistoricalTracker } from './history/HistoricalTracker';

// Analysis
export { TrustFactorAnalyzer } from './analysis/TrustFactorAnalyzer';

// Risk assessment
export { RiskAssessmentEngine } from './risk/RiskAssessmentEngine';

// Update management
export { TrustScoreUpdateManager } from './updates/TrustScoreUpdateManager';

// Event processing
export { EventProcessor } from './events/EventProcessor';

// Performance optimization
export { PerformanceOptimizer } from './performance/PerformanceOptimizer';

// Security
export { SecurityManager } from './security/SecurityManager';

// Success metrics monitoring
export { SuccessMetricsMonitor } from './metrics/SuccessMetricsMonitor';

// Technical infrastructure
export { TechnicalInfrastructure } from './infrastructure/TechnicalInfrastructure';

// Storage
export { TimeSeriesDatabase } from '../storage/TimeSeriesDatabase';
export { DocumentStorage } from '../storage/DocumentStorage';
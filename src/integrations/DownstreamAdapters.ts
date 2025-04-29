// Downstream integration adapters for analytics, UI, trust score, price prediction, and fraud detection engines
// Modular, testable, and extendable for new downstream consumers

export interface TrustScoreEngineAdapter {
  sendNFTData(nftData: any): Promise<void>;
  getEngineName(): string;
}

export interface PricePredictionEngineAdapter {
  sendMarketData(marketData: any): Promise<void>;
  getEngineName(): string;
}

export interface FraudDetectionSystemAdapter {
  sendTransactionData(txData: any): Promise<void>;
  getSystemName(): string;
}

export interface UIDashboardAdapter {
  updateDashboard(data: any): Promise<void>;
  getDashboardName(): string;
}

export interface AnalyticsReportingAdapter {
  sendAnalyticsData(analytics: any): Promise<void>;
  getReportingSystemName(): string;
}

// Example stub implementations (to be replaced with real logic)
export class ExampleTrustScoreEngine implements TrustScoreEngineAdapter {
  async sendNFTData(nftData: any) { /* send logic */ }
  getEngineName() { return 'ExampleTrustScoreEngine'; }
}

export class ExamplePricePredictionEngine implements PricePredictionEngineAdapter {
  async sendMarketData(marketData: any) { /* send logic */ }
  getEngineName() { return 'ExamplePricePredictionEngine'; }
}

export class ExampleFraudDetectionSystem implements FraudDetectionSystemAdapter {
  async sendTransactionData(txData: any) { /* send logic */ }
  getSystemName() { return 'ExampleFraudDetectionSystem'; }
}

export class ExampleUIDashboard implements UIDashboardAdapter {
  async updateDashboard(data: any) { /* update logic */ }
  getDashboardName() { return 'ExampleUIDashboard'; }
}

export class ExampleAnalyticsReporting implements AnalyticsReportingAdapter {
  async sendAnalyticsData(analytics: any) { /* send logic */ }
  getReportingSystemName() { return 'ExampleAnalyticsReporting'; }
}
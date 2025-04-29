// HistoricalPriceAnalysis.ts
// Module for historical price tracking and comparative price analytics

export interface PriceRecord {
  tokenId: string;
  timestamp: number;
  price: number;
  currency: string;
}

export interface PriceHistory {
  [tokenId: string]: Array<{timestamp: number; price: number; currency: string}>;
}

export interface FloorPriceRecord {
  timestamp: number;
  floorPrice: number;
}

export class HistoricalPriceAnalysis {
  static normalizePrices(records: PriceRecord[], currencyRates: {[currency: string]: number}, targetCurrency: string = 'USD'): PriceRecord[] {
    return records.map(r => ({
      ...r,
      price: r.price * (currencyRates[r.currency] || 1),
      currency: targetCurrency
    }));
  }

  static organizeTimeSeries(records: PriceRecord[]): PriceHistory {
    const history: PriceHistory = {};
    for (const r of records) {
      if (!history[r.tokenId]) history[r.tokenId] = [];
      history[r.tokenId].push({timestamp: r.timestamp, price: r.price, currency: r.currency});
    }
    return history;
  }

  static calculateFloorPrice(records: PriceRecord[]): FloorPriceRecord[] {
    // Group by timestamp (e.g., daily floor)
    const byDay: {[day: string]: number[]} = {};
    for (const r of records) {
      const day = new Date(r.timestamp * 1000).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(r.price);
    }
    return Object.entries(byDay).map(([day, prices]) => ({
      timestamp: new Date(day).getTime() / 1000,
      floorPrice: Math.min(...prices)
    }));
  }

  static volumeAnalysis(records: PriceRecord[], period: 'day' | 'week' | 'month' = 'day'): {[period: string]: number} {
    const group: {[period: string]: number} = {};
    for (const r of records) {
      let key;
      const date = new Date(r.timestamp * 1000);
      if (period === 'day') key = date.toISOString().slice(0, 10);
      else if (period === 'week') key = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`;
      else key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      group[key] = (group[key] || 0) + r.price;
    }
    return group;
  }

  static priceTrend(records: PriceRecord[]): number[] {
    // Simple trend: price deltas
    const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
    const trend: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      trend.push(sorted[i].price - sorted[i - 1].price);
    }
    return trend;
  }

  static comparativePriceAnalysis(records: PriceRecord[], compareTo: PriceRecord[]): {meanDiff: number; volatility: number; liquidity: number} {
    // Compare mean prices, volatility (stddev), and liquidity (number of sales)
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const stddev = (arr: number[]) => Math.sqrt(arr.reduce((a, b) => a + (b - mean(arr)) ** 2, 0) / arr.length);
    const pricesA = records.map(r => r.price);
    const pricesB = compareTo.map(r => r.price);
    return {
      meanDiff: mean(pricesA) - mean(pricesB),
      volatility: stddev(pricesA),
      liquidity: pricesA.length
    };
  }
}
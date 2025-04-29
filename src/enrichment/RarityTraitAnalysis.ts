// RarityTraitAnalysis.ts
// Module for collection-wide rarity and trait analysis

export interface TraitDistribution {
  [traitType: string]: { [traitValue: string]: number };
}

export interface RarityScore {
  tokenId: string;
  score: number;
  percentile?: number;
  rank?: number;
}

export interface TraitStats {
  mean: number;
  stddev: number;
  outliers: string[];
}

export class RarityTraitAnalysis {
  static calculateTraitDistribution(tokens: Array<{tokenId: string; traits: {[key: string]: string}}>): TraitDistribution {
    const distribution: TraitDistribution = {};
    for (const token of tokens) {
      for (const [traitType, traitValue] of Object.entries(token.traits)) {
        if (!distribution[traitType]) distribution[traitType] = {};
        if (!distribution[traitType][traitValue]) distribution[traitType][traitValue] = 0;
        distribution[traitType][traitValue]++;
      }
    }
    return distribution;
  }

  static computeRarityScores(tokens: Array<{tokenId: string; traits: {[key: string]: string}}>, distribution: TraitDistribution): RarityScore[] {
    // Basic rarity: inverse frequency product
    const scores: RarityScore[] = tokens.map(token => {
      let score = 1;
      for (const [traitType, traitValue] of Object.entries(token.traits)) {
        const freq = distribution[traitType][traitValue];
        score *= 1 / freq;
      }
      return { tokenId: token.tokenId, score };
    });
    // Ranking
    scores.sort((a, b) => b.score - a.score);
    scores.forEach((s, i) => {
      s.rank = i + 1;
      s.percentile = 100 * (1 - i / (scores.length - 1));
    });
    return scores;
  }

  static statisticalTraitAnalysis(tokens: Array<{tokenId: string; traits: {[key: string]: string}}>, traitType: string): TraitStats {
    const values = tokens.map(t => t.traits[traitType]).filter(Boolean);
    const freq: {[val: string]: number} = {};
    for (const v of values) freq[v] = (freq[v] || 0) + 1;
    const counts = Object.values(freq);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const stddev = Math.sqrt(counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length);
    const outliers = Object.entries(freq).filter(([_, c]) => Math.abs(c - mean) > 2 * stddev).map(([v]) => v);
    return { mean, stddev, outliers };
  }

  static traitCorrelation(tokens: Array<{tokenId: string; traits: {[key: string]: string}}>, traitA: string, traitB: string): number {
    // Simple correlation: Jaccard index
    const setA = new Set(tokens.filter(t => t.traits[traitA]).map(t => t.tokenId));
    const setB = new Set(tokens.filter(t => t.traits[traitB]).map(t => t.tokenId));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  static timeBasedRarityEvolution(/* historical data input */): any {
    // Placeholder for time-based rarity evolution logic
    return null;
  }

  static traitCombinationAnalysis(tokens: Array<{tokenId: string; traits: {[key: string]: string}}>, traitTypes: string[]): {[comb: string]: number} {
    const combos: {[comb: string]: number} = {};
    for (const token of tokens) {
      const key = traitTypes.map(t => token.traits[t] || '').join('|');
      combos[key] = (combos[key] || 0) + 1;
    }
    return combos;
  }
}
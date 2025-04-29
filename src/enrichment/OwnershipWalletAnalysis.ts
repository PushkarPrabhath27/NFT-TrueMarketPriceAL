// OwnershipWalletAnalysis.ts
// Module for ownership and wallet profiling and relationship mapping

export interface WalletProfile {
  wallet: string;
  holdingPeriods: number[];
  portfolio: string[];
  tradingFrequency: number;
  knownEntity?: boolean;
  historicalPatterns?: string[];
}

export interface RelationshipGraph {
  [wallet: string]: string[];
}

export class OwnershipWalletAnalysis {
  static analyzeHoldingPeriods(transfers: Array<{wallet: string; tokenId: string; acquired: number; released?: number}>): {[wallet: string]: number[]} {
    const periods: {[wallet: string]: number[]} = {};
    for (const t of transfers) {
      if (!periods[t.wallet]) periods[t.wallet] = [];
      if (t.released) periods[t.wallet].push(t.released - t.acquired);
    }
    return periods;
  }

  static profileWallets(transfers: Array<{wallet: string; tokenId: string; acquired: number; released?: number}>, knownEntities: Set<string> = new Set()): WalletProfile[] {
    const profiles: {[wallet: string]: WalletProfile} = {};
    for (const t of transfers) {
      if (!profiles[t.wallet]) profiles[t.wallet] = {wallet: t.wallet, holdingPeriods: [], portfolio: [], tradingFrequency: 0};
      if (t.released) profiles[t.wallet].holdingPeriods.push(t.released - t.acquired);
      if (!profiles[t.wallet].portfolio.includes(t.tokenId)) profiles[t.wallet].portfolio.push(t.tokenId);
      profiles[t.wallet].tradingFrequency++;
    }
    for (const w in profiles) {
      if (knownEntities.has(w)) profiles[w].knownEntity = true;
    }
    return Object.values(profiles);
  }

  static detectConnectedWallets(transfers: Array<{from: string; to: string; tokenId: string}>): RelationshipGraph {
    const graph: RelationshipGraph = {};
    for (const t of transfers) {
      if (!graph[t.from]) graph[t.from] = [];
      if (!graph[t.to]) graph[t.to] = [];
      if (!graph[t.from].includes(t.to)) graph[t.from].push(t.to);
    }
    return graph;
  }

  static commonOwnershipPatterns(transfers: Array<{wallet: string; tokenId: string}>): {[tokenId: string]: string[]} {
    const ownership: {[tokenId: string]: string[]} = {};
    for (const t of transfers) {
      if (!ownership[t.tokenId]) ownership[t.tokenId] = [];
      if (!ownership[t.tokenId].includes(t.wallet)) ownership[t.tokenId].push(t.wallet);
    }
    return ownership;
  }

  static transferRelationshipGraph(transfers: Array<{from: string; to: string; tokenId: string}>): RelationshipGraph {
    return this.detectConnectedWallets(transfers);
  }

  static marketplaceInteractionHistory(transactions: Array<{wallet: string; marketplace: string; action: string; timestamp: number}>): {[wallet: string]: {marketplace: string; actions: string[]; timestamps: number[];}[]} {
    const history: {[wallet: string]: {marketplace: string; actions: string[]; timestamps: number[];}[]} = {};
    for (const tx of transactions) {
      if (!history[tx.wallet]) history[tx.wallet] = [];
      let entry = history[tx.wallet].find(e => e.marketplace === tx.marketplace);
      if (!entry) {
        entry = {marketplace: tx.marketplace, actions: [], timestamps: []};
        history[tx.wallet].push(entry);
      }
      entry.actions.push(tx.action);
      entry.timestamps.push(tx.timestamp);
    }
    return history;
  }

  static creatorCollectorRelationships(transfers: Array<{creator: string; collector: string; tokenId: string}>): {[creator: string]: string[]} {
    const rel: {[creator: string]: string[]} = {};
    for (const t of transfers) {
      if (!rel[t.creator]) rel[t.creator] = [];
      if (!rel[t.creator].includes(t.collector)) rel[t.creator].push(t.collector);
    }
    return rel;
  }
}
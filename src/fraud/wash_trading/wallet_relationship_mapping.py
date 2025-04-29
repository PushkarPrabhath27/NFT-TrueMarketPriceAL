"""
Wallet Relationship Mapping Module for NFT Fraud Detection
Implements wallet clustering techniques and relationship scoring for wash trading detection.
"""

from typing import List, Dict, Tuple, Set, Any
import networkx as nx
from collections import defaultdict
import datetime
import functools
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

class WalletRelationshipMapping:
    def __init__(self, transactions: List[Dict[str, Any]], wallet_metadata: Dict[str, Any] = None):
        """
        transactions: List of dicts with keys: 'from', 'to', 'value', 'timestamp', 'gas', 'tx_hash', 'chain', etc.
        wallet_metadata: Optional dict with wallet info (e.g., funding sources, known links)
        """
        self.transactions = transactions
        self.wallet_metadata = wallet_metadata or {}
        self._graph_cache = None
        self._graph_cache_lock = threading.Lock()
        self.wallet_clusters = []
        self.relationship_scores = {}
        self._profile_data = {}
        self._partners_cache = None
        self._gas_map_cache = None
        self._tx_lookup = None
        self._build_fast_lookups()
        self.graph = self._build_transaction_graph(transactions)

    def _build_transaction_graph(self, transactions: List[Dict[str, Any]]) -> nx.MultiDiGraph:
        with self._graph_cache_lock:
            if self._graph_cache is not None:
                return self._graph_cache
            G = nx.MultiDiGraph()
            for tx in transactions:
                G.add_edge(tx['from'], tx['to'], **tx)
            self._graph_cache = G
            return G

    def _build_fast_lookups(self):
        # Build fast lookup structures for transactions
        self._tx_lookup = defaultdict(list)
        for tx in self.transactions:
            self._tx_lookup[(tx['from'], tx['to'])].append(tx)
        # Partners cache for behavioral similarity
        self._partners_cache = defaultdict(set)
        for tx in self.transactions:
            self._partners_cache[tx['from']].add(tx['to'])
            self._partners_cache[tx['to']].add(tx['from'])
        # Gas map cache
        self._gas_map_cache = defaultdict(list)
        for tx in self.transactions:
            self._gas_map_cache[tx['from']].append(tx['gas'])

    def identify_common_funding_sources(self) -> Dict[str, Set[str]]:
        """
        Returns a mapping from funding source address to set of wallets funded by it.
        """
        funding_map = defaultdict(set)
        for tx in self.transactions:
            funding_map[tx['from']].add(tx['to'])
        return dict(funding_map)

    def transaction_graph_analysis(self) -> nx.MultiDiGraph:
        """
        Returns the transaction graph for further analysis.
        """
        return self.graph

    def behavioral_similarity_detection(self, min_shared_partners=3) -> List[Tuple[str, str]]:
        start = time.time()
        partners = self._partners_cache
        similar_pairs = []
        wallets = list(partners.keys())
        def find_similar(i):
            local_pairs = []
            for j in range(i+1, len(wallets)):
                if len(partners[wallets[i]].intersection(partners[wallets[j]])) >= min_shared_partners:
                    local_pairs.append((wallets[i], wallets[j]))
            return local_pairs
        with ThreadPoolExecutor() as executor:
            futures = [executor.submit(find_similar, i) for i in range(len(wallets))]
            for f in as_completed(futures):
                similar_pairs.extend(f.result())
        self._profile_data['behavioral_similarity_detection'] = time.time() - start
        return similar_pairs

    def temporal_coordination_patterns(self, time_window_seconds=600) -> List[Set[str]]:
        """
        Finds groups of wallets transacting within a short time window (possible coordination).
        Returns list of sets of wallet addresses.
        """
        tx_by_time = sorted(self.transactions, key=lambda x: x['timestamp'])
        groups = []
        i = 0
        while i < len(tx_by_time):
            group = set()
            t0 = tx_by_time[i]['timestamp']
            group.add(tx_by_time[i]['from'])
            group.add(tx_by_time[i]['to'])
            j = i + 1
            while j < len(tx_by_time) and tx_by_time[j]['timestamp'] - t0 <= time_window_seconds:
                group.add(tx_by_time[j]['from'])
                group.add(tx_by_time[j]['to'])
                j += 1
            if len(group) > 2:
                groups.append(group)
            i = j
        return groups

    def gas_payment_relationship_analysis(self, gas_threshold=0.9) -> List[Tuple[str, str]]:
        start = time.time()
        gas_map = self._gas_map_cache
        pairs = []
        wallets = list(gas_map.keys())
        def find_gas_pairs(i):
            local_pairs = []
            g1 = gas_map[wallets[i]]
            for j in range(i+1, len(wallets)):
                g2 = gas_map[wallets[j]]
                if len(g1) > 0 and len(g2) > 0:
                    overlap = len(set(g1).intersection(set(g2))) / max(len(set(g1 + g2)), 1)
                    if overlap >= gas_threshold:
                        local_pairs.append((wallets[i], wallets[j]))
            return local_pairs
        with ThreadPoolExecutor() as executor:
            futures = [executor.submit(find_gas_pairs, i) for i in range(len(wallets))]
            for f in as_completed(futures):
                pairs.extend(f.result())
        self._profile_data['gas_payment_relationship_analysis'] = time.time() - start
        return pairs

    def cluster_wallets(self) -> List[Set[str]]:
        start = time.time()
        undirected = self.graph.to_undirected()
        clusters = list(nx.connected_components(undirected))
        self.wallet_clusters = clusters
        self._profile_data['cluster_wallets'] = time.time() - start
        return clusters

    def score_relationships(self) -> Dict[Tuple[str, str], Dict[str, float]]:
        start = time.time()
        scores = {}
        for cluster in self.wallet_clusters:
            cluster = list(cluster)
            for i in range(len(cluster)):
                for j in range(i+1, len(cluster)):
                    w1, w2 = cluster[i], cluster[j]
                    txs = self._tx_lookup.get((w1, w2), []) + self._tx_lookup.get((w2, w1), [])
                    confidence = min(1.0, len(txs)/5)
                    strength = min(1.0, sum(tx['value'] for tx in txs)/100)
                    historical_evolution = self._historical_evolution_score(txs)
                    multi_hop = self._multi_hop_score(w1, w2)
                    cross_chain = self._cross_chain_score(w1, w2)
                    scores[(w1, w2)] = {
                        'confidence': confidence,
                        'strength': strength,
                        'historical_evolution': historical_evolution,
                        'multi_hop': multi_hop,
                        'cross_chain': cross_chain
                    }
        self.relationship_scores = scores
        self._profile_data['score_relationships'] = time.time() - start
        return scores

    def _historical_evolution_score(self, txs: List[Dict[str, Any]]) -> float:
        if not txs:
            return 0.0
        times = [tx['timestamp'] for tx in txs]
        if len(times) < 2:
            return 0.1
        span = max(times) - min(times)
        return min(1.0, span / (60*60*24*30))  # normalized to 1 month

    def _multi_hop_score(self, w1: str, w2: str, max_hops=3) -> float:
        try:
            length = nx.shortest_path_length(self.graph, w1, w2)
            if length == 1:
                return 0.0
            elif length <= max_hops:
                return 1.0 - (length-1)/max_hops
            else:
                return 0.0
        except nx.NetworkXNoPath:
            return 0.0
        except nx.NodeNotFound:
            return 0.0

    def _cross_chain_score(self, w1: str, w2: str) -> float:
        chains1 = set(tx['chain'] for tx in self.transactions if tx['from'] == w1 or tx['to'] == w1)
        chains2 = set(tx['chain'] for tx in self.transactions if tx['from'] == w2 or tx['to'] == w2)
        if chains1 & chains2:
            return 1.0
        return 0.0

    def get_wallet_clusters(self) -> List[Set[str]]:
        return self.wallet_clusters

    def get_relationship_scores(self) -> Dict[Tuple[str, str], Dict[str, float]]:
        return self.relationship_scores

    def get_profile_data(self) -> Dict[str, float]:
        """
        Returns profiling data for method execution times.
        """
        return self._profile_data

# Example usage and test cases would be provided in a separate test module.
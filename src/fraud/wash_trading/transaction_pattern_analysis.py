"""
Module: transaction_pattern_analysis.py
Description: Advanced wash trading detection algorithms for NFT transactions.
Implements detection for circular trading, self-dealing, ping-pong trading, suspicious timing, and unusual price patterns.
Includes graph-based, temporal, statistical, ML, and rule-based methods.
"""

import networkx as nx
from typing import List, Dict, Any, Tuple
import numpy as np
from collections import defaultdict, deque

class TransactionPatternAnalyzer:
    def __init__(self, transactions: List[Dict[str, Any]]):
        """
        transactions: List of dicts with keys: 'tx_id', 'from', 'to', 'amount', 'timestamp', 'price'
        """
        self.transactions = transactions
        self.graph = self._build_graph(transactions)

    def _build_graph(self, transactions: List[Dict[str, Any]]) -> nx.DiGraph:
        G = nx.DiGraph()
        for tx in transactions:
            G.add_edge(tx['from'], tx['to'], tx_id=tx['tx_id'], amount=tx['amount'], timestamp=tx['timestamp'], price=tx['price'])
        return G

    def detect_circular_trading(self, max_cycle_length=4) -> List[List[str]]:
        """Detects cycles (A->B->C->A) up to a given length."""
        cycles = []
        for cycle in nx.simple_cycles(self.graph):
            if 2 < len(cycle) <= max_cycle_length:
                cycles.append(cycle)
        return cycles

    def detect_self_dealing(self) -> List[str]:
        """Detects wallets that send NFTs to themselves (directly or via proxies)."""
        self_deals = []
        for node in self.graph.nodes:
            if self.graph.has_edge(node, node):
                self_deals.append(node)
        return self_deals

    def detect_ping_pong_trading(self, min_count=2) -> List[Tuple[str, str]]:
        """Detects repeated back-and-forth trades between two addresses."""
        ping_pong = []
        for u, v in self.graph.edges:
            if self.graph.has_edge(v, u):
                count_uv = self.graph.number_of_edges(u, v)
                count_vu = self.graph.number_of_edges(v, u)
                if count_uv >= min_count and count_vu >= min_count:
                    ping_pong.append((u, v))
        return ping_pong

    def detect_suspicious_timing(self, interval_threshold=60) -> List[Dict[str, Any]]:
        """Detects transactions between same parties at regular, high-frequency intervals (in seconds)."""
        suspicious = []
        pair_times = defaultdict(list)
        for tx in self.transactions:
            pair = (tx['from'], tx['to'])
            pair_times[pair].append(tx['timestamp'])
        for pair, times in pair_times.items():
            times.sort()
            intervals = [t2-t1 for t1, t2 in zip(times, times[1:])]
            if intervals and np.std(intervals) < 1e-3 and np.mean(intervals) < interval_threshold:
                suspicious.append({'pair': pair, 'interval': np.mean(intervals), 'count': len(times)})
        return suspicious

    def detect_unusual_price_patterns(self, price_threshold=0.1) -> List[Dict[str, Any]]:
        """Detects trades with prices that are consistently round or deviate from market average."""
        prices = [tx['price'] for tx in self.transactions]
        avg_price = np.mean(prices) if prices else 0
        unusual = []
        for tx in self.transactions:
            if tx['price'] % 1 == 0 or abs(tx['price'] - avg_price) > price_threshold * avg_price:
                unusual.append(tx)
        return unusual

    def graph_based_relationship_analysis(self) -> Dict[str, Any]:
        """Returns basic graph stats and connected components for further analysis."""
        components = list(nx.strongly_connected_components(self.graph))
        return {
            'num_nodes': self.graph.number_of_nodes(),
            'num_edges': self.graph.number_of_edges(),
            'strongly_connected_components': components
        }

    def temporal_sequence_detection(self) -> List[List[Dict[str, Any]]]:
        """Detects rapid sequences of trades involving the same NFT or wallet."""
        sorted_tx = sorted(self.transactions, key=lambda x: x['timestamp'])
        sequences = []
        window = deque()
        for tx in sorted_tx:
            window.append(tx)
            while window and tx['timestamp'] - window[0]['timestamp'] > 120:  # 2 min window
                window.popleft()
            if len(window) > 3:
                sequences.append(list(window))
        return sequences

    def statistical_anomaly_detection(self) -> List[Dict[str, Any]]:
        """Detects outlier transactions based on z-score of price and frequency."""
        prices = np.array([tx['price'] for tx in self.transactions])
        if len(prices) < 2:
            return []
        mean = np.mean(prices)
        std = np.std(prices)
        anomalies = []
        for tx in self.transactions:
            if std > 0 and abs(tx['price'] - mean) / std > 2:
                anomalies.append(tx)
        return anomalies

    def rule_based_heuristic_evaluation(self) -> List[Dict[str, Any]]:
        """Combines multiple rules to flag suspicious transactions."""
        flagged = set()
        for cycle in self.detect_circular_trading():
            flagged.update(cycle)
        for node in self.detect_self_dealing():
            flagged.add(node)
        for u, v in self.detect_ping_pong_trading():
            flagged.add(u)
            flagged.add(v)
        return [tx for tx in self.transactions if tx['from'] in flagged or tx['to'] in flagged]

    # Placeholder for ML-based classification
    def machine_learning_classification(self, features: List[List[float]], model=None) -> List[int]:
        """Stub for ML-based classification. Replace with actual model inference."""
        if model is None:
            return [0] * len(features)  # 0: not flagged, 1: flagged
        return model.predict(features)

# Example usage and test cases would be placed in a separate test module.
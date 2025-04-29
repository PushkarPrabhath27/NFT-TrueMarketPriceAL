"""
Unit tests and benchmarks for TransactionPatternAnalyzer.
"""
import unittest
import time
import random
from transaction_pattern_analysis import TransactionPatternAnalyzer
from sklearn.ensemble import RandomForestClassifier
import numpy as np

class TestTransactionPatternAnalyzer(unittest.TestCase):
    def setUp(self):
        # Generate synthetic transactions
        self.transactions = [
            {'tx_id': str(i), 'from': f'user{i%5}', 'to': f'user{(i+1)%5}', 'amount': 1, 'timestamp': 1000+i*10, 'price': 100.0+random.random()} for i in range(20)
        ]
        self.analyzer = TransactionPatternAnalyzer(self.transactions)

    def test_circular_trading(self):
        cycles = self.analyzer.detect_circular_trading()
        self.assertIsInstance(cycles, list)

    def test_self_dealing(self):
        self_deals = self.analyzer.detect_self_dealing()
        self.assertIsInstance(self_deals, list)

    def test_ping_pong_trading(self):
        ping_pong = self.analyzer.detect_ping_pong_trading()
        self.assertIsInstance(ping_pong, list)

    def test_suspicious_timing(self):
        suspicious = self.analyzer.detect_suspicious_timing()
        self.assertIsInstance(suspicious, list)

    def test_unusual_price_patterns(self):
        unusual = self.analyzer.detect_unusual_price_patterns()
        self.assertIsInstance(unusual, list)

    def test_graph_based_relationship_analysis(self):
        stats = self.analyzer.graph_based_relationship_analysis()
        self.assertIn('num_nodes', stats)

    def test_temporal_sequence_detection(self):
        sequences = self.analyzer.temporal_sequence_detection()
        self.assertIsInstance(sequences, list)

    def test_statistical_anomaly_detection(self):
        anomalies = self.analyzer.statistical_anomaly_detection()
        self.assertIsInstance(anomalies, list)

    def test_rule_based_heuristic_evaluation(self):
        flagged = self.analyzer.rule_based_heuristic_evaluation()
        self.assertIsInstance(flagged, list)

    def test_machine_learning_classification(self):
        features = np.random.rand(10, 5)
        model = RandomForestClassifier().fit(features, [0,1,0,1,0,1,0,1,0,1])
        preds = self.analyzer.machine_learning_classification(features.tolist(), model)
        self.assertEqual(len(preds), 10)

    def test_benchmark(self):
        start = time.time()
        for _ in range(100):
            self.analyzer.detect_circular_trading()
        elapsed = time.time() - start
        print(f"Circular trading detection benchmark: {elapsed:.4f}s")

if __name__ == "__main__":
    unittest.main()
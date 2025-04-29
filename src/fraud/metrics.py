"""
Metrics module for tracking and evaluating success metrics for the NFT Fraud Detection System.
This module is responsible for collecting, computing, and reporting KPIs such as:
- Image similarity detection accuracy
- Wash trading detection precision
- Metadata validation coverage
- Processing latency
- Alert precision
- System adaptability
- Integration effectiveness

The module is designed to be extensible and integrates with detection and reporting components.
"""
import time
from typing import Dict, Any, Optional, List

class MetricsTracker:
    def __init__(self):
        self.metrics = {
            'image_similarity': {'correct_exact': 0, 'total_exact': 0, 'correct_derivative': 0, 'total_derivative': 0},
            'wash_trading': {'tp': 0, 'fp': 0, 'fn': 0},
            'metadata_validation': {'fields_validated': 0, 'fields_total': 0},
            'processing_latency': [],
            'alert_precision': {'alerts_confirmed': 0, 'alerts_total': 0},
            'system_adaptations': 0,
            'integration_effectiveness': {'contributions': 0, 'total': 0}
        }
        self.feedback_log: List[Dict[str, Any]] = []

    # --- Image Similarity Metrics ---
    def record_image_similarity(self, is_exact: bool, correct: bool):
        if is_exact:
            self.metrics['image_similarity']['total_exact'] += 1
            if correct:
                self.metrics['image_similarity']['correct_exact'] += 1
        else:
            self.metrics['image_similarity']['total_derivative'] += 1
            if correct:
                self.metrics['image_similarity']['correct_derivative'] += 1

    def get_image_similarity_accuracy(self) -> Dict[str, float]:
        exact_total = self.metrics['image_similarity']['total_exact']
        exact_correct = self.metrics['image_similarity']['correct_exact']
        derivative_total = self.metrics['image_similarity']['total_derivative']
        derivative_correct = self.metrics['image_similarity']['correct_derivative']
        return {
            'exact_accuracy': (exact_correct / exact_total) * 100 if exact_total else 0.0,
            'derivative_accuracy': (derivative_correct / derivative_total) * 100 if derivative_total else 0.0
        }

    # --- Wash Trading Metrics ---
    def record_wash_trading(self, tp: int, fp: int, fn: int):
        self.metrics['wash_trading']['tp'] += tp
        self.metrics['wash_trading']['fp'] += fp
        self.metrics['wash_trading']['fn'] += fn

    def get_wash_trading_precision(self) -> float:
        tp = self.metrics['wash_trading']['tp']
        fp = self.metrics['wash_trading']['fp']
        return (tp / (tp + fp)) * 100 if (tp + fp) else 0.0

    def get_wash_trading_false_positive_rate(self) -> float:
        fp = self.metrics['wash_trading']['fp']
        tp = self.metrics['wash_trading']['tp']
        return (fp / (tp + fp)) * 100 if (tp + fp) else 0.0

    # --- Metadata Validation Metrics ---
    def record_metadata_validation(self, fields_validated: int, fields_total: int):
        self.metrics['metadata_validation']['fields_validated'] += fields_validated
        self.metrics['metadata_validation']['fields_total'] += fields_total

    def get_metadata_validation_coverage(self) -> float:
        total = self.metrics['metadata_validation']['fields_total']
        validated = self.metrics['metadata_validation']['fields_validated']
        return (validated / total) * 100 if total else 0.0

    # --- Processing Latency Metrics ---
    def record_processing_latency(self, start_time: float, end_time: float):
        latency = end_time - start_time
        self.metrics['processing_latency'].append(latency)

    def get_average_latency(self) -> float:
        latencies = self.metrics['processing_latency']
        return sum(latencies) / len(latencies) if latencies else 0.0

    # --- Alert Precision Metrics ---
    def record_alert(self, confirmed: bool):
        self.metrics['alert_precision']['alerts_total'] += 1
        if confirmed:
            self.metrics['alert_precision']['alerts_confirmed'] += 1

    def get_alert_precision(self) -> float:
        total = self.metrics['alert_precision']['alerts_total']
        confirmed = self.metrics['alert_precision']['alerts_confirmed']
        return (confirmed / total) * 100 if total else 0.0

    # --- System Adaptability Metrics ---
    def record_system_adaptation(self):
        self.metrics['system_adaptations'] += 1

    def get_system_adaptability(self) -> int:
        return self.metrics['system_adaptations']

    # --- Integration Effectiveness Metrics ---
    def record_integration_contribution(self, contributed: bool):
        self.metrics['integration_effectiveness']['total'] += 1
        if contributed:
            self.metrics['integration_effectiveness']['contributions'] += 1

    def get_integration_effectiveness(self) -> float:
        total = self.metrics['integration_effectiveness']['total']
        contributions = self.metrics['integration_effectiveness']['contributions']
        return (contributions / total) * 100 if total else 0.0

    # --- Feedback and Continuous Improvement ---
    def record_feedback(self, feedback: Dict[str, Any]):
        self.feedback_log.append(feedback)

    def get_feedback_log(self) -> List[Dict[str, Any]]:
        return self.feedback_log

    # --- Reporting ---
    def get_all_metrics(self) -> Dict[str, Any]:
        return {
            'image_similarity_accuracy': self.get_image_similarity_accuracy(),
            'wash_trading_precision': self.get_wash_trading_precision(),
            'wash_trading_false_positive_rate': self.get_wash_trading_false_positive_rate(),
            'metadata_validation_coverage': self.get_metadata_validation_coverage(),
            'average_processing_latency': self.get_average_latency(),
            'alert_precision': self.get_alert_precision(),
            'system_adaptability': self.get_system_adaptability(),
            'integration_effectiveness': self.get_integration_effectiveness(),
            'feedback_log': self.get_feedback_log()
        }

# Singleton instance for global use
metrics_tracker = MetricsTracker()
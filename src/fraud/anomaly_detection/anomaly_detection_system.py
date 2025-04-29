"""
Anomaly Detection System for NFT Fraud Detection
Implements statistical, behavioral, and contextual anomaly detection methods.
"""
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any, Optional

class StatisticalAnomalyDetector:
    def __init__(self):
        self.scaler = StandardScaler()
        self.clusterer = DBSCAN(eps=0.5, min_samples=5)
        self.ensemble = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)

    def z_score(self, values: List[float], threshold: float = 3.0) -> List[int]:
        arr = np.array(values)
        mean = np.mean(arr)
        std = np.std(arr)
        return [i for i, v in enumerate(arr) if std > 0 and abs((v - mean) / std) > threshold]

    def clustering_outliers(self, X: np.ndarray) -> List[int]:
        labels = self.clusterer.fit_predict(X)
        return [i for i, label in enumerate(labels) if label == -1]

    def time_series_anomaly(self, series: List[float], window: int = 10, threshold: float = 3.0) -> List[int]:
        anomalies = []
        for i in range(window, len(series)):
            window_data = series[i-window:i]
            mean = np.mean(window_data)
            std = np.std(window_data)
            if std > 0 and abs(series[i] - mean) > threshold * std:
                anomalies.append(i)
        return anomalies

    def distribution_anomaly(self, values: List[float], lower: float, upper: float) -> List[int]:
        return [i for i, v in enumerate(values) if v < lower or v > upper]

    def ensemble_anomaly(self, X: np.ndarray) -> List[int]:
        preds = self.ensemble.fit_predict(X)
        return [i for i, p in enumerate(preds) if p == -1]

class DomainSpecificDetectors:
    def price_anomalies(self, prices: List[float]) -> List[int]:
        return StatisticalAnomalyDetector().z_score(prices, threshold=3.5)

    def volume_anomalies(self, volumes: List[float]) -> List[int]:
        return StatisticalAnomalyDetector().z_score(volumes, threshold=3.5)

    def temporal_anomalies(self, timestamps: List[float]) -> List[int]:
        return StatisticalAnomalyDetector().time_series_anomaly(timestamps)

    def relationship_anomalies(self, relationship_matrix: np.ndarray) -> List[int]:
        return StatisticalAnomalyDetector().clustering_outliers(relationship_matrix)

    def metadata_anomalies(self, metadata_features: np.ndarray) -> List[int]:
        return StatisticalAnomalyDetector().ensemble_anomaly(metadata_features)

class EntityProfiler:
    def __init__(self):
        self.history: Dict[str, List[Any]] = {}

    def update_profile(self, entity_id: str, features: Dict[str, Any]):
        if entity_id not in self.history:
            self.history[entity_id] = []
        self.history[entity_id].append(features)

    def deviation_from_history(self, entity_id: str, current_features: Dict[str, Any], threshold: float = 2.5) -> bool:
        if entity_id not in self.history or len(self.history[entity_id]) < 5:
            return False
        hist = self.history[entity_id][-5:]
        for key in current_features:
            vals = [h[key] for h in hist if key in h]
            if len(vals) < 2:
                continue
            mean = np.mean(vals)
            std = np.std(vals)
            if std > 0 and abs(current_features[key] - mean) > threshold * std:
                return True
        return False

    def deviation_from_peers(self, peer_features: List[Dict[str, Any]], current_features: Dict[str, Any], threshold: float = 2.5) -> bool:
        for key in current_features:
            vals = [f[key] for f in peer_features if key in f]
            if len(vals) < 2:
                continue
            mean = np.mean(vals)
            std = np.std(vals)
            if std > 0 and abs(current_features[key] - mean) > threshold * std:
                return True
        return False

class ContextualAnalyzer:
    def __init__(self):
        self.baselines: Dict[str, float] = {}
        self.seasonal_patterns: Dict[str, List[float]] = {}

    def set_baseline(self, entity: str, value: float):
        self.baselines[entity] = value

    def get_baseline(self, entity: str) -> Optional[float]:
        return self.baselines.get(entity)

    def adaptive_threshold(self, entity: str, value: float, context: Dict[str, Any], base_threshold: float = 2.0) -> bool:
        baseline = self.get_baseline(entity)
        if baseline is None:
            return False
        # Adjust threshold based on context completeness
        completeness = context.get('completeness', 1.0)
        threshold = base_threshold * (1.0 + (1.0 - completeness))
        return abs(value - baseline) > threshold

    def update_seasonal_pattern(self, entity: str, value: float):
        if entity not in self.seasonal_patterns:
            self.seasonal_patterns[entity] = []
        self.seasonal_patterns[entity].append(value)

    def trend_adjusted_score(self, entity: str, value: float) -> float:
        pattern = self.seasonal_patterns.get(entity, [])
        if not pattern:
            return 0.0
        trend = np.mean(pattern)
        return (value - trend) / (np.std(pattern) + 1e-6)

class AnomalyDetectionSystem:
    def __init__(self):
        self.statistical = StatisticalAnomalyDetector()
        self.domain = DomainSpecificDetectors()
        self.profiler = EntityProfiler()
        self.contextual = ContextualAnalyzer()

    def detect_statistical(self, data: Dict[str, List[float]]) -> Dict[str, List[int]]:
        results = {}
        if 'prices' in data:
            results['price_zscore'] = self.statistical.z_score(data['prices'])
        if 'volumes' in data:
            results['volume_zscore'] = self.statistical.z_score(data['volumes'])
        if 'features' in data:
            X = np.array(data['features'])
            results['clustering_outliers'] = self.statistical.clustering_outliers(X)
            results['ensemble_anomaly'] = self.statistical.ensemble_anomaly(X)
        if 'series' in data:
            results['time_series'] = self.statistical.time_series_anomaly(data['series'])
        return results

    def detect_domain_specific(self, data: Dict[str, Any]) -> Dict[str, List[int]]:
        results = {}
        if 'prices' in data:
            results['price_anomalies'] = self.domain.price_anomalies(data['prices'])
        if 'volumes' in data:
            results['volume_anomalies'] = self.domain.volume_anomalies(data['volumes'])
        if 'timestamps' in data:
            results['temporal_anomalies'] = self.domain.temporal_anomalies(data['timestamps'])
        if 'relationship_matrix' in data:
            results['relationship_anomalies'] = self.domain.relationship_anomalies(np.array(data['relationship_matrix']))
        if 'metadata_features' in data:
            results['metadata_anomalies'] = self.domain.metadata_anomalies(np.array(data['metadata_features']))
        return results

    def detect_behavioral(self, entity_id: str, current_features: Dict[str, Any], peer_features: List[Dict[str, Any]]) -> Dict[str, bool]:
        deviation_history = self.profiler.deviation_from_history(entity_id, current_features)
        deviation_peers = self.profiler.deviation_from_peers(peer_features, current_features)
        return {
            'deviation_from_history': deviation_history,
            'deviation_from_peers': deviation_peers
        }

    def detect_contextual(self, entity: str, value: float, context: Dict[str, Any]) -> Dict[str, Any]:
        adaptive = self.contextual.adaptive_threshold(entity, value, context)
        trend_score = self.contextual.trend_adjusted_score(entity, value)
        return {
            'adaptive_threshold': adaptive,
            'trend_adjusted_score': trend_score
        }
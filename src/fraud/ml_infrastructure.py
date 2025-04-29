"""
Machine Learning Infrastructure for NFT Fraud Detection System
Includes: model training/deployment pipeline, feature store, model versioning, online learning, explainability tools.
"""
import os
import pickle
from typing import Any, Dict, Optional
from datetime import datetime

import numpy as np
from sklearn.base import BaseEstimator

# Feature Store
class FeatureStore:
    def __init__(self, store_path: str = "feature_store.pkl"):
        self.store_path = store_path
        self.features = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.store_path):
            with open(self.store_path, "rb") as f:
                return pickle.load(f)
        return {}

    def save(self):
        with open(self.store_path, "wb") as f:
            pickle.dump(self.features, f)

    def add(self, key: str, value: Any):
        self.features[key] = value
        self.save()

    def get(self, key: str) -> Optional[Any]:
        return self.features.get(key)

    def all(self) -> Dict[str, Any]:
        return self.features

# Model Versioning
class ModelRegistry:
    def __init__(self, registry_dir: str = "models"):
        self.registry_dir = registry_dir
        os.makedirs(self.registry_dir, exist_ok=True)

    def save_model(self, model: BaseEstimator, name: str, metadata: Optional[Dict[str, Any]] = None):
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        model_path = os.path.join(self.registry_dir, f"{name}_{timestamp}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump({"model": model, "metadata": metadata or {}, "timestamp": timestamp}, f)
        return model_path

    def load_latest(self, name: str) -> Optional[BaseEstimator]:
        files = [f for f in os.listdir(self.registry_dir) if f.startswith(name)]
        if not files:
            return None
        latest = sorted(files)[-1]
        with open(os.path.join(self.registry_dir, latest), "rb") as f:
            data = pickle.load(f)
        return data["model"]

# Model Training & Deployment Pipeline
class ModelPipeline:
    def __init__(self, model: BaseEstimator, feature_store: FeatureStore, registry: ModelRegistry):
        self.model = model
        self.feature_store = feature_store
        self.registry = registry

    def train(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)
        return self.model

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def save(self, name: str, metadata: Optional[Dict[str, Any]] = None):
        return self.registry.save_model(self.model, name, metadata)

    def load_latest(self, name: str):
        self.model = self.registry.load_latest(name)
        return self.model

# Online Learning Wrapper
class OnlineLearningWrapper:
    def __init__(self, model: BaseEstimator):
        self.model = model

    def partial_fit(self, X: np.ndarray, y: np.ndarray, classes=None):
        if hasattr(self.model, "partial_fit"):
            self.model.partial_fit(X, y, classes=classes)
        else:
            raise NotImplementedError("Model does not support online learning.")

# Explainability Tools
class Explainability:
    @staticmethod
    def feature_importance(model: BaseEstimator, feature_names: list) -> Dict[str, float]:
        if hasattr(model, "feature_importances_"):
            return dict(zip(feature_names, model.feature_importances_))
        elif hasattr(model, "coef_"):
            return dict(zip(feature_names, model.coef_.ravel()))
        else:
            return {name: 0.0 for name in feature_names}

    @staticmethod
    def explain_prediction(model: BaseEstimator, X: np.ndarray, feature_names: list) -> Dict[str, float]:
        # Placeholder for SHAP/LIME integration
        # For now, return feature contributions as zeros
        return {name: 0.0 for name in feature_names}
"""
Module: fingerprint_db.py
Description: Scalable database for storing and searching NFT image fingerprints with versioning and confidence scoring.
"""

import threading
from typing import Dict, Any, List, Tuple
import numpy as np

class FingerprintDB:
    """In-memory scalable fingerprint database (replace with persistent DB for production)."""
    def __init__(self):
        self.db = []  # List of dicts: {"id": str, "fingerprints": dict, "version": int}
        self.lock = threading.Lock()
        self.version = 1

    def add_fingerprint(self, nft_id: str, fingerprints: Dict[str, Any], version: int = None):
        with self.lock:
            self.db.append({
                "id": nft_id,
                "fingerprints": fingerprints,
                "version": version if version is not None else self.version
            })

    def search_similar(self, query_fp: Dict[str, Any], top_k: int = 5) -> List[Tuple[str, float]]:
        # Example: Use hamming distance for hashes, cosine for embeddings
        results = []
        for entry in self.db:
            score = self._similarity_score(query_fp, entry["fingerprints"])
            results.append((entry["id"], score))
        results.sort(key=lambda x: -x[1])
        return results[:top_k]

    def _similarity_score(self, fp1: Dict[str, Any], fp2: Dict[str, Any]) -> float:
        # Combine multiple metrics (simple example)
        score = 0.0
        if "phash" in fp1 and "phash" in fp2:
            score += 1 - (self._hamming(fp1["phash"], fp2["phash"]) / 64)
        if "deep_embedding" in fp1 and "deep_embedding" in fp2:
            score += self._cosine(fp1["deep_embedding"], fp2["deep_embedding"])
        # Add more as needed
        return score

    def _hamming(self, hash1: str, hash2: str) -> int:
        return bin(int(hash1, 16) ^ int(hash2, 16)).count('1')

    def _cosine(self, v1: np.ndarray, v2: np.ndarray) -> float:
        v1 = np.asarray(v1)
        v2 = np.asarray(v2)
        if np.linalg.norm(v1) == 0 or np.linalg.norm(v2) == 0:
            return 0.0
        return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

    def update_version(self):
        with self.lock:
            self.version += 1

    def get_version(self):
        return self.version
"""
Temporal Analysis Module for NFT Fraud Detection
Implements chronological verification and trend detection for NFTs.
"""

from typing import List, Dict, Any, Optional
import datetime
import asyncio

class TemporalAnalysis:
    def __init__(self, nft_records: List[Dict[str, Any]]):
        """
        nft_records: List of NFT metadata dicts, each containing at least:
            - 'id': unique NFT identifier
            - 'image_hash': hash/fingerprint of the image
            - 'creator': creator address
            - 'mint_date': ISO 8601 string or datetime
            - 'platform': marketplace/platform name
            - 'collection': collection name
            - 'attributes': dict of NFT attributes
            - 'history': list of historical versions (optional)
        """
        self.nft_records = nft_records
        # Indexing for fast lookups
        self._index_by_image_hash = {}
        self._index_by_creator = {}
        self._index_by_id = {}
        for r in nft_records:
            h = r.get('image_hash')
            c = r.get('creator')
            i = r.get('id')
            if h:
                self._index_by_image_hash.setdefault(h, []).append(r)
            if c:
                self._index_by_creator.setdefault(c, []).append(r)
            if i:
                self._index_by_id[i] = r
        # Date parsing cache
        self._date_cache = {}

    # Chronological Verification
    def track_first_appearance(self, image_hash: str) -> Optional[Dict[str, Any]]:
        """
        Returns the earliest record for a given image hash across platforms.
        """
        appearances = self._index_by_image_hash.get(image_hash, [])
        if not appearances:
            return None
        return min(appearances, key=lambda r: self._parse_date(r.get('mint_date')))

    async def track_first_appearance_async(self, image_hash: str) -> Optional[Dict[str, Any]]:
        return self.track_first_appearance(image_hash)

    def verify_creation_date(self, nft_id: str) -> Optional[datetime.datetime]:
        """
        Returns the creation date for a given NFT ID.
        """
        nft = self._index_by_id.get(nft_id)
        if nft:
            return self._parse_date(nft.get('mint_date'))
        return None

    async def verify_creation_date_async(self, nft_id: str) -> Optional[datetime.datetime]:
        return self.verify_creation_date(nft_id)

    def analyze_minting_sequence(self, collection: str) -> List[Dict[str, Any]]:
        """
        Returns NFTs in a collection sorted by minting date.
        """
        col_nfts = [r for r in self.nft_records if r.get('collection') == collection]
        return sorted(col_nfts, key=lambda r: self._parse_date(r.get('mint_date')))

    async def analyze_minting_sequence_async(self, collection: str) -> List[Dict[str, Any]]:
        return self.analyze_minting_sequence(collection)

    def compare_historical_versions(self, nft_id: str) -> List[Dict[str, Any]]:
        """
        Returns the list of historical versions for a given NFT ID.
        """
        nft = self._index_by_id.get(nft_id)
        if nft and 'history' in nft:
            return nft['history']
        return []

    async def compare_historical_versions_async(self, nft_id: str) -> List[Dict[str, Any]]:
        return self.compare_historical_versions(nft_id)

    def validate_provenance_chain(self, nft_id: str) -> List[Dict[str, Any]]:
        """
        Returns the provenance chain (ownership transfer history) for a given NFT ID.
        """
        nft = self._index_by_id.get(nft_id)
        if nft and 'provenance' in nft:
            return nft['provenance']
        return []

    async def validate_provenance_chain_async(self, nft_id: str) -> List[Dict[str, Any]]:
        return self.validate_provenance_chain(nft_id)

    # Trend Detection
    def detect_sudden_style_appearance(self, style_feature: str, window_days: int = 7) -> List[Dict[str, Any]]:
        """
        Detects NFTs with a given style feature that appear suddenly within a time window.
        """
        now = datetime.datetime.utcnow()
        window_start = now - datetime.timedelta(days=window_days)
        return [r for r in self.nft_records if style_feature in r.get('attributes', {}).get('style', '') and self._parse_date(r.get('mint_date')) >= window_start]

    async def detect_sudden_style_appearance_async(self, style_feature: str, window_days: int = 7) -> List[Dict[str, Any]]:
        return self.detect_sudden_style_appearance(style_feature, window_days)

    def detect_copying_patterns(self, threshold: int = 2) -> List[str]:
        """
        Returns image_hashes that appear in more than 'threshold' collections (potential copying).
        """
        hash_collections = {}
        for r in self.nft_records:
            h = r.get('image_hash')
            c = r.get('collection')
            if h and c:
                hash_collections.setdefault(h, set()).add(c)
        return [h for h, cols in hash_collections.items() if len(cols) >= threshold]

    async def detect_copying_patterns_async(self, threshold: int = 2) -> List[str]:
        return self.detect_copying_patterns(threshold)

    def detect_temporal_clustering(self, attribute: str, window_days: int = 3) -> List[List[Dict[str, Any]]]:
        """
        Detects clusters of NFTs with the same attribute minted within a short time window.
        Returns a list of clusters (each cluster is a list of NFT records).
        """
        from collections import defaultdict
        attr_groups = defaultdict(list)
        for r in self.nft_records:
            val = r.get('attributes', {}).get(attribute)
            if val:
                attr_groups[val].append(r)
        clusters = []
        for group in attr_groups.values():
            group_sorted = sorted(group, key=lambda r: self._parse_date(r.get('mint_date')))
            cluster = []
            for nft in group_sorted:
                if not cluster:
                    cluster.append(nft)
                else:
                    last_date = self._parse_date(cluster[-1].get('mint_date'))
                    curr_date = self._parse_date(nft.get('mint_date'))
                    if (curr_date - last_date).days <= window_days:
                        cluster.append(nft)
                    else:
                        if len(cluster) > 1:
                            clusters.append(cluster)
                        cluster = [nft]
            if len(cluster) > 1:
                clusters.append(cluster)
        return clusters

    async def detect_temporal_clustering_async(self, attribute: str, window_days: int = 3) -> List[List[Dict[str, Any]]]:
        return self.detect_temporal_clustering(attribute, window_days)

    def analyze_creator_behavior_over_time(self, creator: str) -> List[Dict[str, Any]]:
        """
        Returns all NFTs by a creator, sorted by mint date, for behavior analysis.
        """
        creator_nfts = self._index_by_creator.get(creator, [])
        return sorted(creator_nfts, key=lambda r: self._parse_date(r.get('mint_date')))

    async def analyze_creator_behavior_over_time_async(self, creator: str) -> List[Dict[str, Any]]:
        return self.analyze_creator_behavior_over_time(creator)

    def correlate_market_response(self, nft_id: str, market_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Correlates NFT minting and activity with market data (e.g., price, volume).
        market_data: List of dicts with at least 'date', 'price', 'volume'.
        Returns correlation metrics (simple example: price at mint, volume at mint).
        """
        nft = self._index_by_id.get(nft_id)
        if not nft:
            return {}
        mint_date = self._parse_date(nft.get('mint_date'))
        closest = min(market_data, key=lambda d: abs(self._parse_date(d['date']) - mint_date))
        return {'mint_price': closest.get('price'), 'mint_volume': closest.get('volume'), 'mint_date': mint_date}

    async def correlate_market_response_async(self, nft_id: str, market_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.correlate_market_response(nft_id, market_data)

    def _parse_date(self, date_val) -> datetime.datetime:
        if date_val in self._date_cache:
            return self._date_cache[date_val]
        if isinstance(date_val, datetime.datetime):
            self._date_cache[date_val] = date_val
            return date_val
        if isinstance(date_val, str):
            try:
                dt = datetime.datetime.fromisoformat(date_val)
                self._date_cache[date_val] = dt
                return dt
            except Exception:
                pass
        self._date_cache[date_val] = datetime.datetime.min
        return datetime.datetime.min
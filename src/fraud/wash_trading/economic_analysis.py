"""
Economic Analysis Module for Wash Trading and Fraud Detection
Implements suspicious activity indicators and market impact assessment methods.
"""

import numpy as np
from typing import List, Dict, Any

class EconomicAnalysis:
    def __init__(self, transactions: List[Dict[str, Any]], price_data: Dict[str, float], market_data: Dict[str, Any]):
        """
        transactions: List of transaction dicts with keys like 'from', 'to', 'value', 'gas', 'timestamp', etc.
        price_data: Mapping from NFT/token IDs to price history.
        market_data: Additional market context (volume, trends, etc.).
        """
        self.transactions = transactions
        self.price_data = price_data
        self.market_data = market_data

    def detect_irrational_trading_patterns(self) -> List[Dict[str, Any]]:
        """Detects economically irrational trading patterns."""
        suspicious = []
        for tx in self.transactions:
            value = tx.get('value', 0)
            if value <= 0 or value > 1e9:  # Arbitrary upper bound for sanity
                suspicious.append({'tx': tx, 'reason': 'Irrational value'})
        return suspicious

    def fee_to_value_ratio_analysis(self, threshold: float = 0.1) -> List[Dict[str, Any]]:
        """Detects transactions where fee/value ratio is abnormally high."""
        flagged = []
        for tx in self.transactions:
            value = tx.get('value', 1)
            fee = tx.get('gas', 0) * tx.get('gas_price', 0)
            if value > 0 and (fee / value) > threshold:
                flagged.append({'tx': tx, 'reason': 'High fee-to-value ratio'})
        return flagged

    def profit_loss_inconsistencies(self) -> List[Dict[str, Any]]:
        """Detects profit/loss patterns inconsistent with market behavior."""
        flagged = []
        for tx in self.transactions:
            token_id = tx.get('token_id')
            price = self.price_data.get(token_id, 0)
            if price and abs(tx.get('value', 0) - price) / price > 0.5:
                flagged.append({'tx': tx, 'reason': 'Profit/loss inconsistent with market'})
        return flagged

    def gas_price_anomalies(self, z_thresh: float = 3.0) -> List[Dict[str, Any]]:
        """Detects gas price anomalies using z-score analysis."""
        gas_prices = [tx.get('gas_price', 0) for tx in self.transactions]
        if not gas_prices:
            return []
        mean = np.mean(gas_prices)
        std = np.std(gas_prices)
        flagged = []
        for tx in self.transactions:
            z = (tx.get('gas_price', 0) - mean) / std if std else 0
            if abs(z) > z_thresh:
                flagged.append({'tx': tx, 'reason': 'Gas price anomaly', 'z_score': z})
        return flagged

    def trading_patterns_disconnected_from_market(self) -> List[Dict[str, Any]]:
        """Detects trading patterns that do not correlate with broader market trends."""
        flagged = []
        market_trend = self.market_data.get('trend', 0)
        for tx in self.transactions:
            tx_trend = tx.get('trend', 0)
            if abs(tx_trend - market_trend) > 0.5:  # Arbitrary threshold
                flagged.append({'tx': tx, 'reason': 'Disconnected from market trend'})
        return flagged

    def price_manipulation_effectiveness(self) -> float:
        """Measures effectiveness of price manipulation (e.g., price impact after suspicious trades)."""
        # Example: Compare price before/after flagged trades
        prices = list(self.price_data.values())
        if len(prices) < 2:
            return 0.0
        return (prices[-1] - prices[0]) / prices[0] if prices[0] else 0.0

    def volume_inflation_quantification(self) -> float:
        """Quantifies inflated trading volume relative to historical averages."""
        volumes = self.market_data.get('volumes', [])
        if not volumes:
            return 0.0
        avg = np.mean(volumes[:-1]) if len(volumes) > 1 else 0
        latest = volumes[-1]
        return (latest - avg) / avg if avg else 0.0

    def market_distortion_evaluation(self) -> Dict[str, Any]:
        """Evaluates overall market distortion metrics."""
        # Example: Compare suspicious trade volume to total volume
        suspicious = len(self.detect_irrational_trading_patterns())
        total = len(self.transactions)
        return {'distortion_ratio': suspicious / total if total else 0.0}

    def artificial_demand_signal_detection(self) -> List[Dict[str, Any]]:
        """Detects artificial demand signals (e.g., sudden spikes in activity)."""
        flagged = []
        volumes = self.market_data.get('volumes', [])
        if len(volumes) > 2 and (volumes[-1] - volumes[-2]) > 2 * np.std(volumes[:-1]):
            flagged.append({'reason': 'Sudden volume spike', 'volume': volumes[-1]})
        return flagged

    def impact_on_collection_valuation(self) -> float:
        """Measures impact of suspicious activity on collection valuation."""
        base_valuation = self.market_data.get('base_valuation', 0)
        current_valuation = self.market_data.get('current_valuation', 0)
        if base_valuation:
            return (current_valuation - base_valuation) / base_valuation
        return 0.0

# Example test cases (to be placed in a separate test file)
def test_economic_analysis():
    transactions = [
        {'from': 'A', 'to': 'B', 'value': 100, 'gas': 0.01, 'gas_price': 50, 'token_id': 'nft1', 'trend': 0.2},
        {'from': 'B', 'to': 'C', 'value': 0, 'gas': 0.02, 'gas_price': 5000, 'token_id': 'nft2', 'trend': 1.0},
        {'from': 'C', 'to': 'A', 'value': 1e10, 'gas': 0.03, 'gas_price': 60, 'token_id': 'nft3', 'trend': -0.5},
    ]
    price_data = {'nft1': 100, 'nft2': 120, 'nft3': 90}
    market_data = {'trend': 0.3, 'volumes': [100, 120, 500], 'base_valuation': 1000, 'current_valuation': 1200}
    ea = EconomicAnalysis(transactions, price_data, market_data)
    assert len(ea.detect_irrational_trading_patterns()) == 2
    assert len(ea.fee_to_value_ratio_analysis()) == 0
    assert len(ea.profit_loss_inconsistencies()) == 2
    assert len(ea.gas_price_anomalies()) == 1
    assert len(ea.trading_patterns_disconnected_from_market()) == 2
    assert abs(ea.price_manipulation_effectiveness() - 0.2) < 1e-6
    assert abs(ea.volume_inflation_quantification() - 2.5) < 1e-6
    assert abs(ea.market_distortion_evaluation()['distortion_ratio'] - 0.6666667) < 1e-6
    assert len(ea.artificial_demand_signal_detection()) == 1
    assert abs(ea.impact_on_collection_valuation() - 0.2) < 1e-6
    print('All economic analysis tests passed.')

if __name__ == "__main__":
    test_economic_analysis()
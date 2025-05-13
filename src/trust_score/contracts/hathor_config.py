# Hathor Network Configuration for Trust Score Contract

# Network settings
NETWORK_CONFIG = {
    'testnet': {
        'fullnode': 'https://node1.hackaton.hathor.network/v1a/',
        'explorer': 'https://explorer.hackaton.hathor.network',
        'explorer_service': 'https://explorer-service.hackaton.hathor.network'
    },
    'mainnet': {
        'fullnode': 'https://node1.hathor.network/v1a/',
        'explorer': 'https://explorer.hathor.network',
        'explorer_service': 'https://explorer-service.hathor.network'
    }
}

# Contract settings
CONTRACT_CONFIG = {
    'name': 'NFT Trust Score Contract',
    'symbol': 'NFTTRUST',
    'blueprint_file': 'trust_score_blueprint.py',
    'initial_metrics': {
        'blueprint_quality': 0,
        'state_consistency': 0,
        'transaction_legitimacy': 0,
        'balance_legitimacy': 0
    }
}

# Integration settings
INTEGRATION_CONFIG = {
    'factor_weight': 0.2,
    'min_transactions': 1,
    'update_interval': 3600  # 1 hour in seconds
}
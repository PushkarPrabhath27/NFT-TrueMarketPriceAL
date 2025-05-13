# Hathor Trust Score Contract Deployment Script

import os
import json
from hathorlib import HathorClient, NanoContractBuilder
from hathor_config import NETWORK_CONFIG, CONTRACT_CONFIG

def deploy_trust_score_contract(network='testnet', wallet_seed=None):
    """Deploy the Trust Score Contract to Hathor Network"""
    
    # Initialize Hathor client
    network_config = NETWORK_CONFIG[network]
    client = HathorClient(
        api_url=network_config['fullnode'],
        network=network
    )
    
    # Read blueprint file
    blueprint_path = os.path.join(
        os.path.dirname(__file__),
        CONTRACT_CONFIG['blueprint_file']
    )
    with open(blueprint_path, 'r') as f:
        blueprint_code = f.read()
    
    # Create contract builder
    builder = NanoContractBuilder(
        name=CONTRACT_CONFIG['name'],
        symbol=CONTRACT_CONFIG['symbol'],
        blueprint=blueprint_code,
        initial_state=CONTRACT_CONFIG['initial_metrics']
    )
    
    try:
        # Deploy contract
        contract = builder.build()
        tx_id = client.create_nano_contract(
            contract=contract,
            wallet_seed=wallet_seed
        )
        
        print(f'Contract deployed successfully!')
        print(f'Transaction ID: {tx_id}')
        print(f'Explorer URL: {network_config["explorer"]}/transaction/{tx_id}')
        
        return tx_id
        
    except Exception as e:
        print(f'Error deploying contract: {str(e)}')
        raise

def main():
    # Get wallet seed from environment or prompt user
    wallet_seed = os.getenv('HATHOR_WALLET_SEED')
    if not wallet_seed:
        wallet_seed = input('Enter your Hathor wallet seed: ')
    
    # Deploy to testnet by default
    network = os.getenv('HATHOR_NETWORK', 'testnet')
    deploy_trust_score_contract(network, wallet_seed)

if __name__ == '__main__':
    main()
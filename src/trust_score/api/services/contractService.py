# Contract Service for TrustScore Nano Contract

from typing import Dict, Any, Optional
import sys
import os

# Add the parent directory to the path to import the contract
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from contracts.trust_score_blueprint import TrustScoreSwap
from contracts.deploy_contract import deploy_contract

class ContractService:
    """Service class to interact with the TrustScore nano contract"""
    
    def __init__(self):
        self.contract_id = None
        self.contract = None
    
    def initialize_contract(self, token_a: str, token_b: str, multiplier_a: int, multiplier_b: int) -> Dict[str, Any]:
        """
        Initialize the TrustScore contract with token pairs and multipliers
        
        Args:
            token_a: UID of the first token
            token_b: UID of the second token
            multiplier_a: Multiplier for token_a
            multiplier_b: Multiplier for token_b
            
        Returns:
            Dict containing contract_id and initialization status
        """
        try:
            # Deploy the contract
            self.contract_id = deploy_contract(TrustScoreSwap)
            
            # Initialize with token parameters
            # Note: In a real implementation, this would make an actual call to the blockchain
            # For now, we're simulating the initialization
            self.contract = TrustScoreSwap()
            self.contract.token_a = token_a
            self.contract.token_b = token_b
            self.contract.multiplier_a = multiplier_a
            self.contract.multiplier_b = multiplier_b
            self.contract.swaps_counter = 0
            
            return {
                "success": True,
                "contract_id": self.contract_id,
                "message": "Contract initialized successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to initialize contract"
            }
    
    def perform_swap(self, deposit_token: str, deposit_amount: int, withdrawal_token: str, withdrawal_amount: int) -> Dict[str, Any]:
        """
        Execute a token swap according to the contract rules
        
        Args:
            deposit_token: Token being deposited
            deposit_amount: Amount of deposit token
            withdrawal_token: Token being withdrawn
            withdrawal_amount: Amount of withdrawal token
            
        Returns:
            Dict containing swap status and details
        """
        if not self.contract:
            return {
                "success": False,
                "error": "Contract not initialized",
                "message": "Please initialize the contract first"
            }
            
        try:
            # Validate tokens match the contract
            if set([deposit_token, withdrawal_token]) != set([self.contract.token_a, self.contract.token_b]):
                return {
                    "success": False,
                    "error": "Invalid tokens",
                    "message": "The tokens do not match those initialized in the contract"
                }
            
            # Determine which token is which
            if deposit_token == self.contract.token_a:
                deposit_multiplier = self.contract.multiplier_a
                withdrawal_multiplier = self.contract.multiplier_b
            else:
                deposit_multiplier = self.contract.multiplier_b
                withdrawal_multiplier = self.contract.multiplier_a
            
            # Check ratio
            if deposit_amount * withdrawal_multiplier != withdrawal_amount * deposit_multiplier:
                return {
                    "success": False,
                    "error": "Invalid ratio",
                    "message": "The swap ratio does not match the contract parameters"
                }
            
            # Execute swap (in a real implementation, this would interact with the blockchain)
            self.contract.swaps_counter += 1
            
            return {
                "success": True,
                "contract_id": self.contract_id,
                "swap_id": self.contract.swaps_counter,
                "deposit_token": deposit_token,
                "deposit_amount": deposit_amount,
                "withdrawal_token": withdrawal_token,
                "withdrawal_amount": withdrawal_amount,
                "message": "Swap executed successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to execute swap"
            }
    
    def fetch_contract_state(self) -> Dict[str, Any]:
        """
        Get the current state of the contract
        
        Returns:
            Dict containing contract state information
        """
        if not self.contract:
            return {
                "success": False,
                "error": "Contract not initialized",
                "message": "Please initialize the contract first"
            }
            
        try:
            state = {
                "success": True,
                "contract_id": self.contract_id,
                "token_a": self.contract.token_a,
                "multiplier_a": self.contract.multiplier_a,
                "token_b": self.contract.token_b,
                "multiplier_b": self.contract.multiplier_b,
                "swaps_counter": self.contract.swaps_counter
            }
            return state
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to fetch contract state"
            }

# Create a singleton instance
contract_service = ContractService()
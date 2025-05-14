# Test cases for TrustScore Contract Service

import unittest
import sys
import os

# Add the parent directory to the path to import the service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.services.contractService import ContractService

class TestTrustScoreContract(unittest.TestCase):
    """Test cases for the TrustScore contract service"""
    
    def setUp(self):
        """Set up a new contract service instance for each test"""
        self.contract_service = ContractService()
        
        # Sample token UIDs
        self.token_a = "a1b2c3d4e5f6g7h8i9j0"
        self.token_b = "z9y8x7w6v5u4t3s2r1q0"
        
    def test_initialize_valid(self):
        """Test initializing contract with valid parameters"""
        result = self.contract_service.initialize_contract(
            token_a=self.token_a,
            token_b=self.token_b,
            multiplier_a=2,
            multiplier_b=3
        )
        
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['contract_id'])
        
    def test_initialize_same_tokens(self):
        """Test initializing contract with same token for both sides"""
        # This should fail in a real implementation
        # For our simulation, we're checking our service handles it
        result = self.contract_service.initialize_contract(
            token_a=self.token_a,
            token_b=self.token_a,  # Same token
            multiplier_a=2,
            multiplier_b=3
        )
        
        # Our service should detect this and return failure
        self.assertFalse(result['success'])
        
    def test_initialize_invalid_multipliers(self):
        """Test initializing contract with invalid multipliers"""
        # Test with zero multiplier
        result = self.contract_service.initialize_contract(
            token_a=self.token_a,
            token_b=self.token_b,
            multiplier_a=0,  # Invalid
            multiplier_b=3
        )
        
        self.assertFalse(result['success'])
        
        # Test with negative multiplier
        result = self.contract_service.initialize_contract(
            token_a=self.token_a,
            token_b=self.token_b,
            multiplier_a=2,
            multiplier_b=-1  # Invalid
        )
        
        self.assertFalse(result['success'])
        
    def test_swap_success(self):
        """Test successful swap with correct ratio"""
        # Initialize the contract first
        self.contract_service.initialize_contract(
            token_a=self.token_a,
            token_b=self.token_b,
            multiplier_a=2,
            multiplier_b=3
        )
        
        # Perform a swap with correct ratio: 2:3
        # If depositing token_a with amount 6, should withdraw token_b with amount 9
        result = self.contract_service.perform_swap(
            deposit_token=self.token_a,
            deposit_amount=6,
            withdrawal_token=self.token_b,
            withdrawal_amount=9
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['swap_id'], 1)
        
    def test_swap_invalid_ratio(self):
        """Test swap with incorrect ratio"""
        # Initialize the contract first
        self.contract_service.initialize_contract(
            token_a=self.token_a,
            token_b=self.token_b,
            multiplier_a=2,
            multiplier_b=3
        )
        
        # Perform a swap with incorrect ratio
        # If depositing token_a with amount 5, should withdraw token_b with amount 7.5
        # But we're trying to withdraw 8, which is incorrect
        result = self.contract_service.perform_swap(
            deposit_token=self.token_a,
            deposit_amount=5,
            withdrawal_token=self.token_b,
            withdrawal_amount=8  # Incorrect ratio
        )
        
        self.assertFalse(result['success'])
        self.assertIn('Invalid ratio', result['error'])
        
    def test_swap_uninitialized(self):
        """Test swap with uninitialized contract"""
        # Don't initialize the contract
        
        # Try to perform a swap
        result = self.contract_service.perform_swap(
            deposit_token=self.token_a,
            deposit_amount=6,
            withdrawal_token=self.token_b,
            withdrawal_amount=9
        )
        
        self.assertFalse(result['success'])
        self.assertIn('Contract not initialized', result['error'])
        
    def test_get_state(self):
        """Test getting contract state after operations"""
        # Initialize the contract
        self.contract_service.initialize_contract(
            token_a=self.token_a,
            token_b=self.token_b,
            multiplier_a=2,
            multiplier_b=3
        )
        
        # Perform a swap
        self.contract_service.perform_swap(
            deposit_token=self.token_a,
            deposit_amount=6,
            withdrawal_token=self.token_b,
            withdrawal_amount=9
        )
        
        # Get state
        result = self.contract_service.fetch_contract_state()
        
        self.assertTrue(result['success'])
        self.assertEqual(result['token_a'], self.token_a)
        self.assertEqual(result['token_b'], self.token_b)
        self.assertEqual(result['multiplier_a'], 2)
        self.assertEqual(result['multiplier_b'], 3)
        self.assertEqual(result['swaps_counter'], 1)
        
    def test_get_state_uninitialized(self):
        """Test getting state of uninitialized contract"""
        # Don't initialize the contract
        
        # Try to get state
        result = self.contract_service.fetch_contract_state()
        
        self.assertFalse(result['success'])
        self.assertIn('Contract not initialized', result['error'])

if __name__ == '__main__':
    unittest.main()
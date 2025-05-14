# Contract Routes for TrustScore Nano Contract

from flask import Blueprint, request, jsonify
import sys
import os

# Add the parent directory to the path to import the service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.contractService import contract_service

# Create a Flask Blueprint for contract routes
contract_routes = Blueprint('contract_routes', __name__)

@contract_routes.route('/initialize', methods=['POST'])
def initialize_contract():
    """
    Initialize the TrustScore contract with token pairs and multipliers
    
    Request Body:
    {
        "token_a": "<token_a_uid>",
        "token_b": "<token_b_uid>",
        "multiplier_a": <int>,
        "multiplier_b": <int>
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['token_a', 'token_b', 'multiplier_a', 'multiplier_b']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Validate multipliers are positive integers
        if not isinstance(data['multiplier_a'], int) or data['multiplier_a'] <= 0:
            return jsonify({
                "success": False,
                "error": "multiplier_a must be a positive integer"
            }), 400
            
        if not isinstance(data['multiplier_b'], int) or data['multiplier_b'] <= 0:
            return jsonify({
                "success": False,
                "error": "multiplier_b must be a positive integer"
            }), 400
        
        # Initialize the contract
        result = contract_service.initialize_contract(
            token_a=data['token_a'],
            token_b=data['token_b'],
            multiplier_a=data['multiplier_a'],
            multiplier_b=data['multiplier_b']
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "An error occurred while initializing the contract"
        }), 500

@contract_routes.route('/swap', methods=['POST'])
def perform_swap():
    """
    Execute a token swap according to the contract rules
    
    Request Body:
    {
        "deposit_token": "<token_uid>",
        "deposit_amount": <int>,
        "withdrawal_token": "<token_uid>",
        "withdrawal_amount": <int>
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['deposit_token', 'deposit_amount', 'withdrawal_token', 'withdrawal_amount']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Validate amounts are positive integers
        if not isinstance(data['deposit_amount'], int) or data['deposit_amount'] <= 0:
            return jsonify({
                "success": False,
                "error": "deposit_amount must be a positive integer"
            }), 400
            
        if not isinstance(data['withdrawal_amount'], int) or data['withdrawal_amount'] <= 0:
            return jsonify({
                "success": False,
                "error": "withdrawal_amount must be a positive integer"
            }), 400
        
        # Execute the swap
        result = contract_service.perform_swap(
            deposit_token=data['deposit_token'],
            deposit_amount=data['deposit_amount'],
            withdrawal_token=data['withdrawal_token'],
            withdrawal_amount=data['withdrawal_amount']
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "An error occurred while executing the swap"
        }), 500

@contract_routes.route('/state', methods=['GET'])
def get_contract_state():
    """
    Get the current state of the contract
    """
    try:
        result = contract_service.fetch_contract_state()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "An error occurred while fetching contract state"
        }), 500
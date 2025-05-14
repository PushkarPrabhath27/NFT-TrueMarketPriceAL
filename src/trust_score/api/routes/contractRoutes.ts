/**
 * Contract Routes for TrustScore Nano Contract
 * 
 * This module provides RESTful API endpoints for interacting with the TrustScore
 * nano contract, including initialization, swaps, and state retrieval.
 */

import { Router, Request, Response } from 'express';
import { validationMiddleware } from '../middleware/validationMiddleware';
import { body, validationResult } from 'express-validator';

// Create Express Router
const router = Router();

// Import Python contract service via a wrapper
// Note: In a real implementation, this would use a proper Node.js binding to the Python service
// For now, we'll simulate the contract service with TypeScript

interface ContractState {
  token_a: string;
  multiplier_a: number;
  token_b: string;
  multiplier_b: number;
  swaps_counter: number;
}

class ContractServiceWrapper {
  private contractId: string | null = null;
  private state: ContractState | null = null;
  
  async initializeContract(token_a: string, token_b: string, multiplier_a: number, multiplier_b: number) {
    try {
      // Validate inputs
      if (token_a === token_b) {
        return {
          success: false,
          error: 'Invalid tokens',
          message: 'Token A and Token B must be different'
        };
      }
      
      if (multiplier_a <= 0 || multiplier_b <= 0) {
        return {
          success: false,
          error: 'Invalid multipliers',
          message: 'Multipliers must be positive integers'
        };
      }
      
      // Simulate contract deployment
      this.contractId = 'contract_' + Date.now().toString();
      this.state = {
        token_a,
        multiplier_a,
        token_b,
        multiplier_b,
        swaps_counter: 0
      };
      
      return {
        success: true,
        contract_id: this.contractId,
        message: 'Contract initialized successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to initialize contract'
      };
    }
  }
  
  async performSwap(deposit_token: string, deposit_amount: number, withdrawal_token: string, withdrawal_amount: number) {
    if (!this.state || !this.contractId) {
      return {
        success: false,
        error: 'Contract not initialized',
        message: 'Please initialize the contract first'
      };
    }
    
    try {
      // Validate tokens match the contract
      if (![
        deposit_token === this.state.token_a && withdrawal_token === this.state.token_b,
        deposit_token === this.state.token_b && withdrawal_token === this.state.token_a
      ].some(Boolean)) {
        return {
          success: false,
          error: 'Invalid tokens',
          message: 'The tokens do not match those initialized in the contract'
        };
      }
      
      // Determine which token is which
      const deposit_multiplier = deposit_token === this.state.token_a ? 
        this.state.multiplier_a : this.state.multiplier_b;
      const withdrawal_multiplier = withdrawal_token === this.state.token_a ? 
        this.state.multiplier_a : this.state.multiplier_b;
      
      // Check ratio
      if (deposit_amount * withdrawal_multiplier !== withdrawal_amount * deposit_multiplier) {
        return {
          success: false,
          error: 'Invalid ratio',
          message: 'The swap ratio does not match the contract parameters'
        };
      }
      
      // Execute swap
      this.state.swaps_counter += 1;
      
      return {
        success: true,
        contract_id: this.contractId,
        swap_id: this.state.swaps_counter,
        deposit_token,
        deposit_amount,
        withdrawal_token,
        withdrawal_amount,
        message: 'Swap executed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to execute swap'
      };
    }
  }
  
  async fetchContractState() {
    if (!this.state || !this.contractId) {
      return {
        success: false,
        error: 'Contract not initialized',
        message: 'Please initialize the contract first'
      };
    }
    
    try {
      return {
        success: true,
        contract_id: this.contractId,
        ...this.state
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch contract state'
      };
    }
  }
}

// Create singleton instance
const contractService = new ContractServiceWrapper();

// Initialize contract endpoint
router.post('/initialize', [
  body('token_a').isString().notEmpty(),
  body('token_b').isString().notEmpty(),
  body('multiplier_a').isInt({ min: 1 }),
  body('multiplier_b').isInt({ min: 1 })
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  
  try {
    const { token_a, token_b, multiplier_a, multiplier_b } = req.body;
    const result = await contractService.initializeContract(
      token_a,
      token_b,
      multiplier_a,
      multiplier_b
    );
    
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'An error occurred while initializing the contract'
    });
  }
});

// Perform swap endpoint
router.post('/swap', [
  body('deposit_token').isString().notEmpty(),
  body('deposit_amount').isInt({ min: 1 }),
  body('withdrawal_token').isString().notEmpty(),
  body('withdrawal_amount').isInt({ min: 1 })
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  
  try {
    const { deposit_token, deposit_amount, withdrawal_token, withdrawal_amount } = req.body;
    const result = await contractService.performSwap(
      deposit_token,
      deposit_amount,
      withdrawal_token,
      withdrawal_amount
    );
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'An error occurred while executing the swap'
    });
  }
});

// Get contract state endpoint
router.get('/state', async (_req: Request, res: Response) => {
  try {
    const result = await contractService.fetchContractState();
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'An error occurred while fetching contract state'
    });
  }
});

export const contractRoutes = router;
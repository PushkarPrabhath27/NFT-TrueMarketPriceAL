# Hathor Network Nano Contracts Integration Guide

## Overview

This guide explains how to use the Hathor Network nano contracts integration with the NFT TrustScore platform. The integration allows you to evaluate the trustworthiness of NFTs that are associated with Hathor's nano contracts architecture.

## Understanding Hathor Nano Contracts

Unlike traditional smart contracts where each contract has its own source code and state, Hathor's nano contracts follow a different architecture:

- **Blueprints**: Reusable source code templates that define contract behavior
- **Contract Instances**: Individual contracts that reference a blueprint and maintain their own state
- **Multi-Token Balance**: Contracts can hold multiple different tokens, similar to a wallet

This architecture offers several advantages:
- More efficient resource usage through code reuse
- Standardized contract behaviors through blueprint catalogs
- Simplified auditing by focusing on blueprint quality

## Integration Components

The Hathor integration consists of several key components:

1. **HathorProvider**: Connection provider for Hathor Network
2. **NanoContractClient**: Client for interacting with nano contracts
3. **NanoContractExtractor**: Extracts and processes contract data
4. **HathorNanoContractFactor**: Trust factor for evaluating nano contracts
5. **HathorIntegration**: Integration module for the trust score engine

## Getting Started

### Installation

The Hathor integration is included in the main NFT TrustScore package. No additional installation is required.

### Basic Usage

```typescript
import { createHathorEnabledEngine } from '../trust_score/integrations/HathorIntegration';

// Create a Hathor-enabled trust score engine
const { engine, hathorIntegration } = createHathorEnabledEngine({
  // Optional custom configuration
  factorWeight: 0.2, // Weight of Hathor factor (default: 0.15)
  providerConfig: {
    network: 'mainnet',
    apiUrl: 'https://node1.hathor.network/v1a/'
  }
});

// Calculate trust score for an NFT with Hathor nano contract
const trustScore = await hathorIntegration.calculateTrustScore(
  'nft-id-123',
  {
    // Standard NFT input data
    tokenId: 'nft-id-123',
    // ... other NFT data ...
    
    // Hathor-specific data
    hathorContractId: 'hathor-contract-456'
  }
);

// Access Hathor-specific metrics
if (trustScore.hathorMetrics) {
  console.log('Blueprint Quality:', trustScore.hathorMetrics.blueprintQuality);
  console.log('State Consistency:', trustScore.hathorMetrics.stateConsistency);
  console.log('Transaction Legitimacy:', trustScore.hathorMetrics.transactionLegitimacy);
  console.log('Balance Legitimacy:', trustScore.hathorMetrics.balanceLegitimacy);
}
```

### Direct Contract Analysis

You can also analyze Hathor nano contracts directly without calculating a full NFT trust score:

```typescript
import { createHathorEnabledEngine } from '../trust_score/integrations/HathorIntegration';

// Get the Hathor integration
const { hathorIntegration } = createHathorEnabledEngine();

// Get the nano contract extractor
const extractor = hathorIntegration.getExtractor();

// Extract and analyze contract data
const contractData = await extractor.extractContractData({
  contractId: 'hathor-contract-456',
  includeTransactions: true,
  includeBlueprint: true
});

// Access trust analysis results
console.log('Blueprint Quality:', contractData.trustAnalysis.blueprintQuality);
console.log('State Consistency:', contractData.trustAnalysis.stateConsistency);
console.log('Transaction Legitimacy:', contractData.trustAnalysis.transactionLegitimacy);
console.log('Balance Legitimacy:', contractData.trustAnalysis.balanceLegitimacy);
```

## Trust Score Factors

The Hathor nano contract trust factor evaluates several aspects of a contract:

1. **Blueprint Quality (30%)**: Evaluates the quality and security of the blueprint
   - Built-in blueprints receive higher trust scores by default
   - Custom blueprints undergo more rigorous analysis

2. **State Consistency (20%)**: Analyzes the contract's state for consistency
   - Checks if state matches expected patterns for the blueprint
   - Identifies anomalies in state structure or values

3. **Transaction Legitimacy (30%)**: Examines transaction patterns
   - Analyzes method call frequency and distribution
   - Checks for suspicious deposit/withdrawal patterns
   - Evaluates diversity of interacting addresses

4. **Balance Legitimacy (20%)**: Analyzes the contract's token holdings
   - Checks for unusual token combinations
   - Identifies suspicious token quantities

## Configuration Options

### Hathor Provider Configuration

```typescript
const providerConfig = {
  network: 'mainnet', // 'mainnet', 'testnet', or 'nano-testnet'
  apiUrl: 'https://node1.hathor.network/v1a/',
  apiKey: 'your-api-key', // Optional
  timeout: 30000 // Optional, in milliseconds
};
```

### Integration Configuration

```typescript
const integrationConfig = {
  factorWeight: 0.15, // Weight in the overall trust score (0.0 to 1.0)
  providerConfig: { /* provider config */ }
};
```

## Example Use Cases

### NFT Marketplaces

Marketplaces can use the Hathor integration to:
- Display trust scores for NFTs associated with nano contracts
- Highlight blueprint quality as a trust indicator
- Alert users to potential risks in contract behavior

### Collectors

Collectors can use the integration to:
- Evaluate the trustworthiness of NFTs before purchase
- Compare different NFTs based on their contract quality
- Identify potential red flags in contract implementation

### Creators

Creators can use the integration to:
- Demonstrate the quality of their nano contract implementations
- Choose high-quality blueprints for their NFT projects
- Build trust with potential buyers

## Advanced Topics

### Custom Blueprint Analysis

For advanced users, the integration allows for custom blueprint analysis:

```typescript
import { BlueprintAnalyzer } from '../blockchain/hathor/analysis/BlueprintAnalyzer';

// Create a custom blueprint analyzer
const blueprintAnalyzer = new BlueprintAnalyzer();

// Register custom analysis rules
blueprintAnalyzer.registerRule('methodSecurity', (blueprint) => {
  // Custom analysis logic
  return { score: 0.8, findings: [] };
});

// Use the custom analyzer
const analysis = await blueprintAnalyzer.analyze('blueprint-id');
```

### Integration with Other Chains

The Hathor integration can be used alongside other blockchain integrations:

```typescript
// Create engines for multiple chains
const { engine: hathorEngine } = createHathorEnabledEngine();
const { engine: ethereumEngine } = createEthereumEnabledEngine();

// Choose the appropriate engine based on the NFT type
function selectEngine(nftData) {
  if (nftData.hathorContractId) {
    return hathorEngine;
  } else if (nftData.ethereumContractAddress) {
    return ethereumEngine;
  }
  // Default engine
  return defaultEngine;
}
```

## Troubleshooting

### Connection Issues

If you encounter connection issues with the Hathor Network:

1. Verify your network configuration (mainnet, testnet, nano-testnet)
2. Check that the API URL is correct and accessible
3. Ensure your API key has the necessary permissions
4. Check for network connectivity issues

### Missing Data

If contract data is incomplete or missing:

1. Verify that the contract ID is correct
2. Check if the contract exists on the specified network
3. Ensure that the contract has been properly initialized
4. Verify that the blueprint reference is valid

## Resources

- [Hathor Network Documentation](https://docs.hathor.network/)
- [Nano Contracts Specification](https://docs.hathor.network/explanations/features/nano-contracts/how-it-works/)
- [NFT TrustScore API Documentation](./API_DOCUMENTATION.md)

## Support

For issues related to the Hathor integration, please open an issue on the [GitHub repository](https://github.com/your-org/NFT_TrustScore) or contact the development team.
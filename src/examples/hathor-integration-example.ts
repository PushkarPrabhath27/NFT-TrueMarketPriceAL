/**
 * hathor-integration-example.ts
 * 
 * Example usage of the Hathor Network nano contracts integration
 * with the NFT TrustScore system.
 */

import { createHathorEnabledEngine } from '../trust_score/integrations/HathorIntegration';
import { TrustScoreTypes } from '../trust_score/types';
import '../trust_score/types/hathor'; // Import type extensions

/**
 * Example function demonstrating how to calculate trust scores for
 * NFTs associated with Hathor Network nano contracts.
 */
async function calculateHathorNFTTrustScore() {
  console.log('Initializing Hathor-enabled trust score engine...');
  
  // Create a Hathor-enabled trust score engine
  const { engine, hathorIntegration } = createHathorEnabledEngine({
    // Custom configuration (optional)
    factorWeight: 0.2, // Increase weight of Hathor factor to 20%
    providerConfig: {
      network: 'mainnet',
      apiUrl: 'https://node1.hathor.network/v1a/'
    }
  });
  
  // Example NFT data with Hathor nano contract association
  const nftInputData: TrustScoreTypes.NFTInputData = {
    tokenId: 'example-nft-123',
    contractAddress: '0x1234567890abcdef',
    creatorAddress: '0xabcdef1234567890',
    ownerAddress: '0x0987654321fedcba',
    creationTimestamp: '2023-01-15T12:00:00Z',
    transactionHistory: [
      // Example transaction history
      {
        txHash: '0xabc123',
        timestamp: '2023-01-15T12:00:00Z',
        from: '0xabcdef1234567890',
        to: '0x0987654321fedcba',
        value: '1.5 ETH'
      }
    ],
    metadata: {
      name: 'Example NFT',
      description: 'An example NFT associated with a Hathor nano contract',
      image: 'https://example.com/nft-image.png',
      attributes: [
        { trait_type: 'Color', value: 'Blue' },
        { trait_type: 'Size', value: 'Medium' }
      ]
    },
    marketplaceData: {
      isVerified: true,
      listingCount: 3,
      currentPrice: '2.0 ETH'
    },
    collectionData: {
      name: 'Example Collection',
      totalSupply: 1000,
      floorPrice: '1.2 ETH'
    },
    socialData: {
      mentionCount: 150,
      positiveRatio: 0.8
    },
    
    // Hathor-specific data
    hathorContractId: 'example-hathor-contract-456'
  };
  
  try {
    console.log('Calculating trust score for NFT with Hathor nano contract...');
    
    // Calculate trust score using the Hathor integration
    const trustScore = await hathorIntegration.calculateTrustScore(
      nftInputData.tokenId,
      nftInputData
    );
    
    console.log('Trust score calculation complete!');
    console.log('Overall trust score:', trustScore.score);
    console.log('Confidence:', trustScore.confidence);
    
    // Access Hathor-specific metrics if available
    if (trustScore.hathorMetrics) {
      console.log('\nHathor Nano Contract Metrics:');
      console.log('Blueprint Quality:', trustScore.hathorMetrics.blueprintQuality);
      console.log('State Consistency:', trustScore.hathorMetrics.stateConsistency);
      console.log('Transaction Legitimacy:', trustScore.hathorMetrics.transactionLegitimacy);
      console.log('Balance Legitimacy:', trustScore.hathorMetrics.balanceLegitimacy);
    }
    
    console.log('\nTrust Score Explanation:', trustScore.explanation);
    console.log('\nStrengths:');
    trustScore.strengths.forEach(strength => console.log(`- ${strength}`));
    
    console.log('\nRed Flags:');
    trustScore.redFlags.forEach(flag => console.log(`- ${flag}`));
    
    return trustScore;
  } catch (error) {
    console.error('Error calculating trust score:', error);
    throw error;
  }
}

/**
 * Example function demonstrating how to analyze a Hathor nano contract directly
 */
async function analyzeHathorNanoContract() {
  console.log('Initializing Hathor integration...');
  
  // Create a Hathor-enabled trust score engine
  const { hathorIntegration } = createHathorEnabledEngine();
  
  // Get the nano contract extractor
  const extractor = hathorIntegration.getExtractor();
  
  try {
    console.log('Extracting and analyzing Hathor nano contract data...');
    
    // Extract contract data
    const contractData = await extractor.extractContractData({
      contractId: 'example-hathor-contract-456',
      includeTransactions: true,
      includeBlueprint: true
    });
    
    console.log('Contract analysis complete!');
    console.log('\nContract Details:');
    console.log('Contract ID:', contractData.contractId);
    console.log('Blueprint:', contractData.blueprintName, `(${contractData.blueprintType})`);
    console.log('Creation Date:', contractData.creationDate);
    console.log('Last Activity:', contractData.lastActivityDate);
    console.log('Transaction Count:', contractData.transactionCount);
    
    console.log('\nTrust Analysis:');
    console.log('Blueprint Quality:', contractData.trustAnalysis.blueprintQuality);
    console.log('State Consistency:', contractData.trustAnalysis.stateConsistency);
    console.log('Transaction Legitimacy:', contractData.trustAnalysis.transactionLegitimacy);
    console.log('Balance Legitimacy:', contractData.trustAnalysis.balanceLegitimacy);
    
    console.log('\nStrengths:');
    contractData.trustAnalysis.strengths.forEach(strength => console.log(`- ${strength}`));
    
    console.log('\nRisk Indicators:');
    contractData.trustAnalysis.riskIndicators.forEach(risk => console.log(`- ${risk}`));
    
    return contractData;
  } catch (error) {
    console.error('Error analyzing Hathor nano contract:', error);
    throw error;
  }
}

// Export example functions
export {
  calculateHathorNFTTrustScore,
  analyzeHathorNanoContract
};

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await calculateHathorNFTTrustScore();
      console.log('\n-----------------------------------\n');
      await analyzeHathorNanoContract();
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}
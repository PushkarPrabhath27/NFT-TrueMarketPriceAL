const { createHathorEnabledEngine } = require('./src/trust_score/integrations/HathorIntegration');

async function test() {
  const { engine, hathorIntegration } = createHathorEnabledEngine({
    providerConfig: {
      network: 'testnet',
      apiUrl: 'https://node1.nano-testnet.hathor.network/v1a/'
    }
  });
  
  const trustScore = await hathorIntegration.calculateTrustScore(
    'nft-id-123',
    {
      tokenId: 'nft-id-123',
      hathorContractId: 'your-contract-id' 
    }
  );
  
  console.log('Trust Score:', trustScore);
}

test();
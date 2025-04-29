/**
 * NodeConnectionManagerTest.ts
 * Tests for the NodeConnectionManager implementation
 */

import { ConnectionStatus } from '../interfaces/BlockchainProvider';
import { EthereumConnectionConfig } from '../interfaces/ConnectionConfig';
import { EthereumConnectionManager } from '../management/EthereumConnectionManager';

/**
 * Test function for the EthereumConnectionManager
 */
async function testEthereumConnectionManager() {
  // Create test configuration
  const testConfig: EthereumConnectionConfig = {
    networks: {
      testnet: {
        providers: [
          {
            url: 'https://goerli.infura.io/v3/test-api-key',
            priority: 1,
            apiKey: 'test-api-key',
            maxRequestsPerMinute: 100,
            timeout: 5000
          },
          {
            url: 'https://eth-goerli.alchemyapi.io/v2/test-api-key',
            priority: 2,
            apiKey: 'test-api-key',
            maxRequestsPerMinute: 100,
            timeout: 5000
          }
        ],
        chainId: '5',
        networkName: 'testnet',
        isTestnet: true
      }
    },
    defaultNetwork: 'testnet',
    poolSize: 2,
    healthCheckIntervalMs: 5000, // 5 seconds for testing
    retry: {
      maxRetries: 2,
      baseDelayMs: 500,
      maxDelayMs: 2000
    },
    ethereumOptions: {
      useWebsocket: false,
      gasPriceStrategy: 'fast',
      useEip1559: true
    }
  };

  // Create connection manager
  const connectionManager = new EthereumConnectionManager(testConfig);
  
  // Test initialization
  console.log('Test: Initializing connection manager');
  await connectionManager.initialize();
  console.log('✓ Connection manager initialized');
  
  // Test getting a provider
  console.log('Test: Getting provider');
  const provider = await connectionManager.getProvider('ethereum', 'testnet');
  console.log(`✓ Got provider: ${provider.getName()} (${provider.getUrl()})`);
  
  // Test provider connection
  console.log('Test: Checking provider connection');
  const isConnected = await provider.isConnected();
  console.log(`✓ Provider connected: ${isConnected}`);
  
  // Test getting block number
  console.log('Test: Getting block number');
  const blockNumber = await provider.getBlockNumber();
  console.log(`✓ Block number: ${blockNumber}`);
  
  // Test getting chain ID
  console.log('Test: Getting chain ID');
  const chainId = await provider.getChainId();
  console.log(`✓ Chain ID: ${chainId}`);
  
  // Test getting provider health
  console.log('Test: Getting provider health');
  const health = await connectionManager.getProviderHealth(provider.getUrl());
  console.log(`✓ Provider health: ${health?.isHealthy ? 'Healthy' : 'Unhealthy'}`);
  
  // Test getting overall health
  console.log('Test: Getting overall health');
  const overallHealth = await connectionManager.getOverallHealth();
  console.log(`✓ Overall health: ${overallHealth.healthyProviders}/${overallHealth.totalProviders} providers healthy`);
  
  // Test executing RPC call
  console.log('Test: Executing RPC call');
  const balance = await provider.executeRpcCall<string>('eth_getBalance', ['0x0000000000000000000000000000000000000000', 'latest']);
  console.log(`✓ Balance: ${balance}`);
  
  // Test shutting down
  console.log('Test: Shutting down connection manager');
  await connectionManager.shutdown();
  console.log('✓ Connection manager shut down');
  
  console.log('All tests passed!');
}

/**
 * Run the tests
 */
async function runTests() {
  try {
    await testEthereumConnectionManager();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testEthereumConnectionManager };
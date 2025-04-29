/**
 * ConnectionManagerExample.ts
 * Example usage of the NodeConnectionManager implementation
 */

import { ConnectionStatus } from '../interfaces/BlockchainProvider';
import { EthereumConnectionConfig } from '../interfaces/ConnectionConfig';
import { HealthCheckResult } from '../interfaces/HealthCheck';
import { EthereumConnectionManager, EthereumProvider } from '../management/EthereumConnectionManager';

/**
 * Example function demonstrating how to use the EthereumConnectionManager
 */
async function ethereumConnectionExample() {
  try {
    // Create Ethereum connection configuration
    const ethereumConfig: EthereumConnectionConfig = {
      networks: {
        mainnet: {
          providers: [
            {
              url: 'https://mainnet.infura.io/v3/your-api-key',
              priority: 1,
              apiKey: 'your-api-key',
              maxRequestsPerMinute: 100,
              timeout: 30000
            },
            {
              url: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
              priority: 2,
              apiKey: 'your-api-key',
              maxRequestsPerMinute: 150,
              timeout: 30000
            }
          ],
          chainId: '1',
          networkName: 'mainnet',
          isTestnet: false
        },
        goerli: {
          providers: [
            {
              url: 'https://goerli.infura.io/v3/your-api-key',
              priority: 1,
              apiKey: 'your-api-key',
              maxRequestsPerMinute: 100,
              timeout: 30000
            }
          ],
          chainId: '5',
          networkName: 'goerli',
          isTestnet: true
        }
      },
      defaultNetwork: 'mainnet',
      poolSize: 5,
      healthCheckIntervalMs: 30000, // 30 seconds
      retry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 30000
      },
      ethereumOptions: {
        useWebsocket: false,
        gasPriceStrategy: 'fast',
        useEip1559: true
      }
    };

    // Create Ethereum connection manager
    const connectionManager = new EthereumConnectionManager(ethereumConfig);
    
    // Initialize the connection manager
    console.log('Initializing Ethereum connection manager...');
    await connectionManager.initialize();
    console.log('Ethereum connection manager initialized');
    
    // Register health status change callback
    connectionManager.onHealthStatusChange((provider: EthereumProvider, result: HealthCheckResult) => {
      console.log(`Provider ${provider.getUrl()} health status changed to ${result.status}`);
    });
    
    // Get a provider for Ethereum mainnet
    console.log('Getting Ethereum mainnet provider...');
    const provider = await connectionManager.getProvider('ethereum', 'mainnet');
    console.log(`Got provider: ${provider.getName()} (${provider.getUrl()})`);
    
    // Check if provider is connected
    const isConnected = await provider.isConnected();
    console.log(`Provider connected: ${isConnected}`);
    
    // Get current block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`Current block number: ${blockNumber}`);
    
    // Get chain ID
    const chainId = await provider.getChainId();
    console.log(`Chain ID: ${chainId}`);
    
    // Get provider health
    const health = await connectionManager.getProviderHealth(provider.getUrl());
    console.log('Provider health:', health);
    
    // Get overall health status
    const overallHealth = await connectionManager.getOverallHealth();
    console.log('Overall health status:');
    console.log(`- Total providers: ${overallHealth.totalProviders}`);
    console.log(`- Healthy providers: ${overallHealth.healthyProviders}`);
    console.log('- Status counts:');
    for (const [status, count] of Object.entries(overallHealth.statusCounts)) {
      console.log(`  - ${status}: ${count}`);
    }
    console.log(`- Average response time: ${overallHealth.avgResponseTimeMs.toFixed(2)}ms`);
    
    // Execute an RPC call
    console.log('Executing RPC call...');
    const balance = await provider.executeRpcCall<string>('eth_getBalance', ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'latest']);
    console.log(`Balance: ${balance}`);
    
    // Shutdown the connection manager
    console.log('Shutting down connection manager...');
    await connectionManager.shutdown();
    console.log('Connection manager shut down');
    
    return 'Example completed successfully';
  } catch (error) {
    console.error('Error in Ethereum connection example:', error);
    throw error;
  }
}

/**
 * Main function to run the example
 */
async function main() {
  try {
    const result = await ethereumConnectionExample();
    console.log(result);
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { ethereumConnectionExample };
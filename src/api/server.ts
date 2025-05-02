/**
 * NFT TrustScore API Server
 * 
 * This module initializes and starts the API server for the NFT TrustScore platform.
 */

import apiGateway from './index';
import { config } from './config';

/**
 * Start the API server
 */
const startServer = (): void => {
  try {
    // Start the server
    const app = apiGateway.start();
    
    // Handle graceful shutdown
    const shutdown = () => {
      console.log('Shutting down API server...');
      process.exit(0);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };
/**
 * NFT TrustScore API SDK
 * 
 * This module exports client libraries for different programming languages
 * to simplify integration with the NFT TrustScore API.
 */

export * from './javascript';
export * from './python';
export * from './ruby';
export * from './php';

// Export default object with all SDK components
import { javascriptSDK } from './javascript';
import { pythonSDK } from './python';
import { rubySDK } from './ruby';
import { phpSDK } from './php';

/**
 * SDK module that provides client libraries for different programming languages
 */
export const sdk = {
  javascript: javascriptSDK,
  python: pythonSDK,
  ruby: rubySDK,
  php: phpSDK
};

export default sdk;
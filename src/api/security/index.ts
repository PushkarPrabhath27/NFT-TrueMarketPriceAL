/**
 * Security Module Index
 * 
 * Exports all security-related components for the NFT TrustScore API.
 */

// Authentication providers
export * from './jwtProvider';
export * from './oauth2Provider';
export * from './apiKeyManager';

// Authorization
export * from './authorizationService';

// Security monitoring
export * from './securityMonitoring';

// Export default object with all security components
import { jwtProvider } from './jwtProvider';
import { oauth2Provider } from './oauth2Provider';
import { apiKeyManager } from './apiKeyManager';
import { authorizationService } from './authorizationService';
import { securityMonitoring } from './securityMonitoring';

/**
 * Security module that provides comprehensive security features for the API
 */
export const security = {
  jwt: jwtProvider,
  oauth2: oauth2Provider,
  apiKeys: apiKeyManager,
  authorization: authorizationService,
  monitoring: securityMonitoring
};

export default security;
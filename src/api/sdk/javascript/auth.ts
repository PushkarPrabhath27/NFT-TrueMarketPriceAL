/**
 * NFT TrustScore API Authentication
 * 
 * Handles authentication for the NFT TrustScore API client.
 */

import { AuthOptions } from './types';

/**
 * Create an authentication header based on the provided auth options
 * 
 * @param options Authentication options
 * @returns Authentication header value
 */
export function createAuthHeader(options: AuthOptions): string {
  if (options.apiKey) {
    return `Bearer ${options.apiKey}`;
  }
  
  if (options.jwt) {
    return `Bearer ${options.jwt}`;
  }
  
  if (options.oauth2Token) {
    return `OAuth ${options.oauth2Token}`;
  }
  
  throw new Error('No valid authentication method provided');
}

/**
 * OAuth2 authentication helper
 */
export class OAuth2Auth {
  private clientId: string;
  private redirectUri: string;
  private scope: string;
  
  /**
   * Create a new OAuth2 authentication helper
   * 
   * @param clientId OAuth2 client ID
   * @param redirectUri Redirect URI
   * @param scope OAuth2 scope
   */
  constructor(clientId: string, redirectUri: string, scope: string = 'read:scores read:prices') {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.scope = scope;
  }
  
  /**
   * Get the authorization URL for OAuth2 authentication
   * 
   * @param state State parameter for CSRF protection
   * @returns Authorization URL
   */
  public getAuthorizationUrl(state: string): string {
    const params = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      state
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `https://api.nfttrustscoreplatform.com/oauth/authorize?${queryString}`;
  }
  
  /**
   * Exchange an authorization code for an access token
   * 
   * @param code Authorization code
   * @returns Access token response
   */
  public async exchangeCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch('https://api.nfttrustscoreplatform.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth2 token exchange failed: ${error.message || 'Unknown error'}`);
    }
    
    return response.json();
  }
  
  /**
   * Refresh an access token using a refresh token
   * 
   * @param refreshToken Refresh token
   * @returns New access token response
   */
  public async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch('https://api.nfttrustscoreplatform.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth2 token refresh failed: ${error.message || 'Unknown error'}`);
    }
    
    return response.json();
  }
}
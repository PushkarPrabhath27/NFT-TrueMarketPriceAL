/**
 * OAuth2 Authentication Provider
 * 
 * Implements OAuth 2.0 authentication flows for the NFT TrustScore API.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// OAuth2 provider types
type OAuthProvider = 'google' | 'github' | 'twitter';

// OAuth2 user profile interface
interface OAuthUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: OAuthProvider;
}

/**
 * OAuth2 Provider class that handles different OAuth flows
 */
export class OAuth2Provider {
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;
  private jwtSecret: string;
  private tokenExpiration: string;

  constructor() {
    this.clientId = config.auth.oauth2.clientId;
    this.clientSecret = config.auth.oauth2.clientSecret;
    this.callbackUrl = config.auth.oauth2.callbackUrl;
    this.jwtSecret = config.auth.jwtSecret;
    this.tokenExpiration = config.auth.tokenExpiration;
  }

  /**
   * Generate authorization URL for a specific provider
   * 
   * @param provider OAuth provider (google, github, twitter)
   * @param state State parameter for CSRF protection
   * @returns Authorization URL
   */
  public getAuthorizationUrl(provider: OAuthProvider, state: string): string {
    switch (provider) {
      case 'google':
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.callbackUrl)}&response_type=code&scope=email%20profile&state=${state}`;
      case 'github':
        return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.callbackUrl)}&state=${state}`;
      case 'twitter':
        return `https://twitter.com/i/oauth2/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.callbackUrl)}&response_type=code&scope=users.read%20tweet.read&state=${state}`;
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Handle OAuth callback and exchange code for token
   * 
   * @param provider OAuth provider
   * @param code Authorization code
   * @returns User profile and access token
   */
  public async handleCallback(provider: OAuthProvider, code: string): Promise<{ profile: OAuthUserProfile, token: string }> {
    // In a real implementation, this would make HTTP requests to the provider's token endpoint
    // and user info endpoint to exchange the code for a token and get the user profile
    
    // For demonstration purposes, we'll simulate a successful authentication
    const profile = await this.fetchUserProfile(provider, code);
    
    // Generate JWT token
    const token = this.generateToken(profile);
    
    return { profile, token };
  }

  /**
   * Fetch user profile from OAuth provider
   * 
   * @param provider OAuth provider
   * @param accessToken Provider access token
   * @returns User profile
   */
  private async fetchUserProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthUserProfile> {
    // In a real implementation, this would make HTTP requests to the provider's user info endpoint
    
    // For demonstration purposes, we'll return a mock profile
    return {
      id: `user-${Math.floor(Math.random() * 10000)}`,
      email: 'user@example.com',
      name: 'Example User',
      picture: 'https://example.com/profile.jpg',
      provider
    };
  }

  /**
   * Generate JWT token for authenticated user
   * 
   * @param profile User profile
   * @returns JWT token
   */
  private generateToken(profile: OAuthUserProfile): string {
    const payload = {
      sub: profile.id,
      email: profile.email,
      name: profile.name,
      provider: profile.provider,
      // Add additional claims as needed
      role: 'user', // Default role, would be determined by your user database
      tier: 'basic' // Default tier, would be determined by your subscription database
    };
    
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpiration
    });
  }

  /**
   * Verify and decode JWT token
   * 
   * @param token JWT token
   * @returns Decoded token payload
   */
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

// Export singleton instance
export const oauth2Provider = new OAuth2Provider();
/**
 * JWT Authentication Provider
 * 
 * Implements JWT token management for the NFT TrustScore API.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

// JWT payload interface
export interface JwtPayload {
  sub: string;       // Subject (user ID)
  email?: string;    // User email
  name?: string;     // User name
  role: string;      // User role (admin, developer, user, etc.)
  tier: string;      // Subscription tier (free, basic, premium, enterprise)
  scope?: string[];  // Permission scopes
  iat?: number;      // Issued at timestamp
  exp?: number;      // Expiration timestamp
}

/**
 * JWT Provider class that handles token generation and verification
 */
export class JwtProvider {
  private jwtSecret: string;
  private tokenExpiration: string;

  constructor() {
    this.jwtSecret = config.auth.jwtSecret;
    this.tokenExpiration = config.auth.tokenExpiration;
  }

  /**
   * Generate JWT token for a user
   * 
   * @param payload Token payload
   * @returns JWT token
   */
  public generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
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
  public verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Refresh an existing token
   * 
   * @param token Existing JWT token
   * @returns New JWT token
   */
  public refreshToken(token: string): string {
    try {
      // Verify the existing token
      const payload = this.verifyToken(token);
      
      // Remove expiration and issued at claims
      const { iat, exp, ...restPayload } = payload;
      
      // Generate a new token
      return this.generateToken(restPayload);
    } catch (error) {
      throw new Error('Invalid token for refresh');
    }
  }

  /**
   * Extract token from authorization header
   * 
   * @param authHeader Authorization header
   * @returns JWT token
   */
  public extractTokenFromHeader(authHeader?: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    
    return authHeader.split(' ')[1];
  }
}

// Export singleton instance
export const jwtProvider = new JwtProvider();
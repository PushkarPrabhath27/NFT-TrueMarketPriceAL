/**
 * API Key Manager
 * 
 * Implements secure API key management for the NFT TrustScore API.
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// API key interface
export interface ApiKey {
  id: string;           // Unique identifier for the key
  key: string;          // The API key value
  userId: string;       // User ID associated with the key
  name: string;         // Name/description of the key
  scopes: string[];     // Permission scopes for the key
  tier: string;         // Subscription tier (free, basic, premium, enterprise)
  createdAt: Date;      // Creation timestamp
  expiresAt: Date;      // Expiration timestamp
  lastUsed?: Date;      // Last usage timestamp
  isActive: boolean;    // Whether the key is active
  ipRestrictions?: string[]; // Optional IP address restrictions
}

/**
 * API Key Manager class that handles key generation, validation, and management
 */
export class ApiKeyManager {
  // In a real implementation, keys would be stored in a database
  private keys: Map<string, ApiKey> = new Map();

  /**
   * Generate a new API key
   * 
   * @param userId User ID
   * @param name Key name/description
   * @param scopes Permission scopes
   * @param tier Subscription tier
   * @param expiresInDays Days until expiration (default: 365)
   * @param ipRestrictions Optional IP restrictions
   * @returns Generated API key
   */
  public generateKey(
    userId: string,
    name: string,
    scopes: string[],
    tier: string = 'free',
    expiresInDays: number = 365,
    ipRestrictions?: string[]
  ): ApiKey {
    // Generate a secure random API key
    const keyBuffer = crypto.randomBytes(32);
    const key = keyBuffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const apiKey: ApiKey = {
      id: uuidv4(),
      key,
      userId,
      name,
      scopes,
      tier,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      isActive: true,
      ipRestrictions
    };
    
    // Store the key
    this.keys.set(key, apiKey);
    
    return apiKey;
  }

  /**
   * Validate an API key
   * 
   * @param key API key to validate
   * @param ip Client IP address for restriction checking
   * @returns API key if valid, null otherwise
   */
  public validateKey(key: string, ip?: string): ApiKey | null {
    const apiKey = this.keys.get(key);
    
    if (!apiKey) {
      return null; // Key not found
    }
    
    if (!apiKey.isActive) {
      return null; // Key is inactive
    }
    
    if (apiKey.expiresAt < new Date()) {
      return null; // Key has expired
    }
    
    // Check IP restrictions if applicable
    if (ip && apiKey.ipRestrictions && apiKey.ipRestrictions.length > 0) {
      if (!apiKey.ipRestrictions.includes(ip)) {
        return null; // IP not allowed
      }
    }
    
    // Update last used timestamp
    apiKey.lastUsed = new Date();
    this.keys.set(key, apiKey);
    
    return apiKey;
  }

  /**
   * Revoke an API key
   * 
   * @param key API key to revoke
   * @returns True if revoked, false if not found
   */
  public revokeKey(key: string): boolean {
    const apiKey = this.keys.get(key);
    
    if (!apiKey) {
      return false;
    }
    
    apiKey.isActive = false;
    this.keys.set(key, apiKey);
    
    return true;
  }

  /**
   * Rotate an API key (revoke old key and generate new one)
   * 
   * @param oldKey API key to rotate
   * @returns New API key if successful, null otherwise
   */
  public rotateKey(oldKey: string): ApiKey | null {
    const apiKey = this.keys.get(oldKey);
    
    if (!apiKey) {
      return null;
    }
    
    // Revoke the old key
    this.revokeKey(oldKey);
    
    // Generate a new key with the same properties
    return this.generateKey(
      apiKey.userId,
      apiKey.name,
      apiKey.scopes,
      apiKey.tier,
      Math.ceil((apiKey.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      apiKey.ipRestrictions
    );
  }

  /**
   * Get all API keys for a user
   * 
   * @param userId User ID
   * @returns Array of API keys
   */
  public getUserKeys(userId: string): ApiKey[] {
    return Array.from(this.keys.values())
      .filter(key => key.userId === userId);
  }

  /**
   * Update API key scopes
   * 
   * @param key API key
   * @param scopes New permission scopes
   * @returns Updated API key if successful, null otherwise
   */
  public updateKeyScopes(key: string, scopes: string[]): ApiKey | null {
    const apiKey = this.keys.get(key);
    
    if (!apiKey) {
      return null;
    }
    
    apiKey.scopes = scopes;
    this.keys.set(key, apiKey);
    
    return apiKey;
  }

  /**
   * Update API key tier
   * 
   * @param key API key
   * @param tier New subscription tier
   * @returns Updated API key if successful, null otherwise
   */
  public updateKeyTier(key: string, tier: string): ApiKey | null {
    const apiKey = this.keys.get(key);
    
    if (!apiKey) {
      return null;
    }
    
    apiKey.tier = tier;
    this.keys.set(key, apiKey);
    
    return apiKey;
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();
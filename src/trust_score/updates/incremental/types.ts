/**
 * types.ts
 * 
 * Type definitions specific to the Incremental Update System.
 * Extends the main TrustScoreTypes namespace with additional types needed for incremental updates.
 */

import { TrustScoreTypes } from '../../types';

// Extend the TrustScoreTypes namespace with additional types
export namespace IncrementalUpdateTypes {
  /**
   * Types of entities in the system (mirrors the main types but ensures type safety)
   */
  export enum EntityType {
    NFT = 'nft',
    COLLECTION = 'collection',
    CREATOR = 'creator',
    WALLET = 'wallet',
    TRANSACTION = 'transaction',
    MARKETPLACE = 'marketplace'
  }
  
  /**
   * Types of changes that can occur
   */
  export enum ChangeType {
    OWNERSHIP_CHANGE = 'ownership_change',
    PRICE_CHANGE = 'price_change',
    METADATA_UPDATE = 'metadata_update',
    FRAUD_DETECTION = 'fraud_detection',
    RARITY_CHANGE = 'rarity_change',
    COLLECTION_UPDATE = 'collection_update',
    CREATOR_UPDATE = 'creator_update'
  }
  
  /**
   * Helper function to convert string entity type to enum
   */
  export function mapEntityType(entityType: string): EntityType {
    switch (entityType.toLowerCase()) {
      case 'nft': return EntityType.NFT;
      case 'collection': return EntityType.COLLECTION;
      case 'creator': return EntityType.CREATOR;
      case 'wallet': return EntityType.WALLET;
      case 'transaction': return EntityType.TRANSACTION;
      case 'marketplace': return EntityType.MARKETPLACE;
      default: throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
  
  /**
   * Helper function to convert string change type to enum
   */
  export function mapChangeType(changeType: string): ChangeType {
    switch (changeType.toLowerCase()) {
      case 'ownership_change': return ChangeType.OWNERSHIP_CHANGE;
      case 'price_change': return ChangeType.PRICE_CHANGE;
      case 'metadata_update': return ChangeType.METADATA_UPDATE;
      case 'fraud_detection': return ChangeType.FRAUD_DETECTION;
      case 'rarity_change': return ChangeType.RARITY_CHANGE;
      case 'collection_update': return ChangeType.COLLECTION_UPDATE;
      case 'creator_update': return ChangeType.CREATOR_UPDATE;
      default: throw new Error(`Unknown change type: ${changeType}`);
    }
  }
  
  /**
   * Adapter function to convert TrustScoreTypes.UpdateEvent to the format needed by incremental system
   */
  export function adaptUpdateEvent(event: TrustScoreTypes.UpdateEvent): {
    entityId: string;
    entityType: EntityType;
    changeType: ChangeType;
    changeData: any;
  } {
    return {
      entityId: event.entityId,
      entityType: mapEntityType(event.entityType),
      changeType: mapChangeType(event.eventType),
      changeData: event.data
    };
  }
}

// Add these types to the main TrustScoreTypes namespace for convenience
export { IncrementalUpdateTypes };
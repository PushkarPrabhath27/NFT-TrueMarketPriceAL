// NFT Data Storage & Access Layer - Schema Definitions
// This file defines TypeScript interfaces and schema objects for NFT entities, transaction history, ownership, metadata, and media references.

// NFT Entity (Token, Collection, Creator)
export interface NFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  collectionId: string;
  creatorId: string;
  ownerId: string;
  metadataId: string;
  mediaId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  symbol: string;
  creatorId: string;
  contractAddress: string;
  totalSupply: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Creator {
  id: string;
  address: string;
  name?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction History
export interface Transaction {
  id: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  tokenId?: string;
  collectionId?: string;
  eventType: 'transfer' | 'mint' | 'burn' | 'sale' | 'listing' | 'bid' | 'metadataUpdate';
  marketplace?: string;
  price?: string;
  currency?: string;
  createdAt: Date;
}

// Ownership Records
export interface Ownership {
  id: string;
  ownerId: string;
  tokenId: string;
  collectionId: string;
  acquiredAt: Date;
  releasedAt?: Date;
  current: boolean;
}

// Metadata & Attributes
export interface Metadata {
  id: string;
  tokenId: string;
  collectionId: string;
  name: string;
  description?: string;
  attributes: Attribute[];
  image?: string;
  externalUrl?: string;
  animationUrl?: string;
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

// Media References
export interface Media {
  id: string;
  tokenId: string;
  collectionId: string;
  type: 'image' | 'video' | 'audio' | 'model';
  url: string;
  thumbnailUrl?: string;
  format?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  integrityHash?: string;
  createdAt: Date;
}

// Indexing Strategies (for reference in DB layer)
export const Indexes = {
  NFT: [
    { fields: ['contractAddress', 'tokenId'], unique: true },
    { fields: ['collectionId'] },
    { fields: ['creatorId'] },
    { fields: ['ownerId'] },
  ],
  Collection: [
    { fields: ['contractAddress'], unique: true },
    { fields: ['creatorId'] },
    { fields: ['name'] },
  ],
  Transaction: [
    { fields: ['txHash'], unique: true },
    { fields: ['blockNumber'] },
    { fields: ['tokenId'] },
    { fields: ['collectionId'] },
    { fields: ['eventType'] },
    { fields: ['timestamp'] },
  ],
  Ownership: [
    { fields: ['ownerId', 'tokenId', 'current'], unique: true },
    { fields: ['collectionId'] },
  ],
  Metadata: [
    { fields: ['tokenId'], unique: true },
    { fields: ['collectionId'] },
    { fields: ['name'] },
  ],
  Media: [
    { fields: ['tokenId', 'type'] },
    { fields: ['collectionId'] },
    { fields: ['integrityHash'], unique: true },
  ],
};
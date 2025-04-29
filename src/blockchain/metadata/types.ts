/**
 * Represents a processed media asset associated with an NFT
 */
export interface MediaAsset {
  url: string;
  type: MediaType;
  mimeType: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  thumbnailUrl?: string;
  integrity?: string;
  processedAt: string;
}

/**
 * Supported media types for NFT assets
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  MODEL_3D = '3d-model',
  HTML = 'html',
  UNKNOWN = 'unknown'
}

/**
 * Common interface for normalized NFT metadata across different standards
 */
export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  external_url?: string;
  animation_url?: string;
  attributes: NFTAttribute[];
  media: MediaAsset[];
  schemaVersion: string;
  processingTimestamp: string;
  raw?: any;
}

/**
 * Represents a trait or attribute of an NFT
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number | boolean;
  display_type?: string;
  max_value?: number;
  trait_count?: number;
  order?: number;
}

/**
 * Error types specific to metadata processing
 */
export enum MetadataErrorType {
  INVALID_SCHEMA = 'INVALID_SCHEMA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_TYPE = 'INVALID_FIELD_TYPE',
  MEDIA_PROCESSING_ERROR = 'MEDIA_PROCESSING_ERROR',
  FETCH_ERROR = 'FETCH_ERROR'
}

/**
 * Custom error class for metadata processing errors
 */
export class MetadataProcessingError extends Error {
  constructor(
    public type: MetadataErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MetadataProcessingError';
  }
}
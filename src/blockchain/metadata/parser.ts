import { NFTMetadata, MediaAsset } from './types';

/**
 * Interface defining the contract for NFT metadata parsers
 */
export interface IMetadataParser {
  parse(rawMetadata: any): Promise<NFTMetadata>;
  validateSchema(rawMetadata: any): boolean;
  extractFields(rawMetadata: any): Record<string, any>;
  convertTypes(fields: Record<string, any>): Record<string, any>;
  handleMissingFields(fields: Record<string, any>): Record<string, any>;
  processMediaAssets(mediaUrls: string[]): Promise<MediaAsset[]>;
}

/**
 * Abstract base class implementing common metadata parsing functionality
 */
export abstract class BaseMetadataParser implements IMetadataParser {
  protected schemaVersion: string;

  constructor(schemaVersion: string = '1.0.0') {
    this.schemaVersion = schemaVersion;
  }

  abstract validateSchema(rawMetadata: any): boolean;

  async parse(rawMetadata: any): Promise<NFTMetadata> {
    if (!this.validateSchema(rawMetadata)) {
      throw new Error('Invalid metadata schema');
    }

    const extractedFields = this.extractFields(rawMetadata);
    const convertedFields = this.convertTypes(extractedFields);
    const normalizedFields = this.handleMissingFields(convertedFields);
    
    const mediaUrls = this.extractMediaUrls(normalizedFields);
    const processedMedia = await this.processMediaAssets(mediaUrls);

    return {
      ...normalizedFields,
      media: processedMedia,
      schemaVersion: this.schemaVersion,
      processingTimestamp: new Date().toISOString()
    };
  }

  protected extractMediaUrls(fields: Record<string, any>): string[] {
    const mediaUrls: string[] = [];
    if (fields.image) mediaUrls.push(fields.image);
    if (fields.animation_url) mediaUrls.push(fields.animation_url);
    if (fields.external_url) mediaUrls.push(fields.external_url);
    return mediaUrls;
  }

  abstract extractFields(rawMetadata: any): Record<string, any>;
  abstract convertTypes(fields: Record<string, any>): Record<string, any>;
  abstract handleMissingFields(fields: Record<string, any>): Record<string, any>;
  abstract processMediaAssets(mediaUrls: string[]): Promise<MediaAsset[]>;
}
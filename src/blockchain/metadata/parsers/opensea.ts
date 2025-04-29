import { BaseMetadataParser } from '../parser';
import { NFTMetadata, MediaAsset, MetadataErrorType, MetadataProcessingError } from '../types';
import { MediaProcessor } from '../media/processor';

export class OpenSeaMetadataParser extends BaseMetadataParser {
  private mediaProcessor: MediaProcessor;

  constructor(mediaProcessor: MediaProcessor) {
    super('opensea-1.0.0');
    this.mediaProcessor = mediaProcessor;
  }

  validateSchema(rawMetadata: any): boolean {
    const requiredFields = ['name'];
    return requiredFields.every(field => field in rawMetadata);
  }

  extractFields(rawMetadata: any): Record<string, any> {
    return {
      name: rawMetadata.name,
      description: rawMetadata.description,
      image: rawMetadata.image,
      external_url: rawMetadata.external_url,
      animation_url: rawMetadata.animation_url,
      attributes: this.normalizeAttributes(rawMetadata.traits || rawMetadata.attributes || [])
    };
  }

  convertTypes(fields: Record<string, any>): Record<string, any> {
    return {
      ...fields,
      name: String(fields.name),
      description: fields.description ? String(fields.description) : undefined,
      attributes: fields.attributes.map(this.convertAttributeTypes)
    };
  }

  handleMissingFields(fields: Record<string, any>): Record<string, any> {
    return {
      ...fields,
      description: fields.description || '',
      attributes: fields.attributes || [],
      external_url: fields.external_url || null,
      animation_url: fields.animation_url || null
    };
  }

  async processMediaAssets(mediaUrls: string[]): Promise<MediaAsset[]> {
    try {
      return await Promise.all(
        mediaUrls.map(url => this.mediaProcessor.processMedia(url))
      );
    } catch (error) {
      throw new MetadataProcessingError(
        MetadataErrorType.MEDIA_PROCESSING_ERROR,
        'Failed to process media assets',
        error
      );
    }
  }

  private normalizeAttributes(attributes: any[]): Record<string, any>[] {
    return attributes.map(attr => ({
      trait_type: attr.trait_type || attr.key || 'unknown',
      value: attr.value,
      display_type: attr.display_type,
      max_value: attr.max_value,
      trait_count: attr.trait_count,
      order: attr.order
    }));
  }

  private convertAttributeTypes(attr: any): Record<string, any> {
    const converted = {
      trait_type: String(attr.trait_type),
      value: attr.value
    };

    if (attr.display_type === 'number' || attr.display_type === 'stat') {
      converted.value = Number(attr.value);
    } else if (attr.display_type === 'boolean') {
      converted.value = Boolean(attr.value);
    }

    if (attr.max_value) converted.max_value = Number(attr.max_value);
    if (attr.trait_count) converted.trait_count = Number(attr.trait_count);
    if (attr.order) converted.order = Number(attr.order);

    return converted;
  }
}
import { MediaAsset, MediaType, MetadataErrorType, MetadataProcessingError } from '../types';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

export class MediaProcessor {
  private readonly maxFileSize: number;
  private readonly supportedImageFormats: string[];
  private readonly supportedVideoFormats: string[];
  private readonly thumbnailSize: { width: number; height: number };

  constructor(config: {
    maxFileSize?: number;
    supportedImageFormats?: string[];
    supportedVideoFormats?: string[];
    thumbnailSize?: { width: number; height: number };
  } = {}) {
    this.maxFileSize = config.maxFileSize || 100 * 1024 * 1024; // 100MB default
    this.supportedImageFormats = config.supportedImageFormats || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.supportedVideoFormats = config.supportedVideoFormats || ['video/mp4', 'video/webm'];
    this.thumbnailSize = config.thumbnailSize || { width: 300, height: 300 };
  }

  async processMedia(url: string): Promise<MediaAsset> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const fileType = await fileTypeFromBuffer(buffer);
      if (!fileType) {
        throw new Error('Could not determine media type');
      }

      if (buffer.length > this.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
      }

      const mediaType = this.determineMediaType(fileType.mime);
      const integrity = this.calculateIntegrity(buffer);

      const baseAsset: MediaAsset = {
        url,
        type: mediaType,
        mimeType: fileType.mime,
        size: buffer.length,
        integrity,
        processedAt: new Date().toISOString()
      };

      return await this.processSpecificMediaType(baseAsset, buffer, mediaType);
    } catch (error) {
      throw new MetadataProcessingError(
        MetadataErrorType.MEDIA_PROCESSING_ERROR,
        `Failed to process media from URL: ${url}`,
        error
      );
    }
  }

  private async processSpecificMediaType(
    baseAsset: MediaAsset,
    buffer: Buffer,
    mediaType: MediaType
  ): Promise<MediaAsset> {
    switch (mediaType) {
      case MediaType.IMAGE:
        return await this.processImage(baseAsset, buffer);
      case MediaType.VIDEO:
        return await this.processVideo(baseAsset, buffer);
      case MediaType.AUDIO:
        return await this.processAudio(baseAsset, buffer);
      case MediaType.MODEL_3D:
        return await this.process3DModel(baseAsset, buffer);
      default:
        return baseAsset;
    }
  }

  private async processImage(baseAsset: MediaAsset, buffer: Buffer): Promise<MediaAsset> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width && metadata.height) {
      baseAsset.dimensions = {
        width: metadata.width,
        height: metadata.height
      };
    }

    // Generate thumbnail for images
    const thumbnail = await image
      .resize(this.thumbnailSize.width, this.thumbnailSize.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Store thumbnail as base64 data URL
    baseAsset.thumbnailUrl = `data:image/webp;base64,${thumbnail.toString('base64')}`;

    return baseAsset;
  }

  private async processVideo(baseAsset: MediaAsset, buffer: Buffer): Promise<MediaAsset> {
    // Video processing would require additional dependencies like ffmpeg
    // This is a placeholder for video processing logic
    return baseAsset;
  }

  private async processAudio(baseAsset: MediaAsset, buffer: Buffer): Promise<MediaAsset> {
    // Audio processing would require additional dependencies
    // This is a placeholder for audio processing logic
    return baseAsset;
  }

  private async process3DModel(baseAsset: MediaAsset, buffer: Buffer): Promise<MediaAsset> {
    // 3D model processing would require specific 3D processing libraries
    // This is a placeholder for 3D model processing logic
    return baseAsset;
  }

  private determineMediaType(mimeType: string): MediaType {
    if (this.supportedImageFormats.includes(mimeType)) {
      return MediaType.IMAGE;
    }
    if (this.supportedVideoFormats.includes(mimeType)) {
      return MediaType.VIDEO;
    }
    if (mimeType.startsWith('audio/')) {
      return MediaType.AUDIO;
    }
    if (mimeType.includes('3d') || mimeType.includes('model')) {
      return MediaType.MODEL_3D;
    }
    if (mimeType === 'text/html') {
      return MediaType.HTML;
    }
    return MediaType.UNKNOWN;
  }

  private calculateIntegrity(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
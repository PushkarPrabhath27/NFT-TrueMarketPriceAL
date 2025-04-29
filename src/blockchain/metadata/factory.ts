import { IMetadataParser } from './parser';
import { OpenSeaMetadataParser } from './parsers/opensea';
import { MediaProcessor } from './media/processor';
import { MetadataErrorType, MetadataProcessingError } from './types';

export class MetadataParserFactory {
  private parsers: Map<string, IMetadataParser>;
  private mediaProcessor: MediaProcessor;

  constructor(mediaProcessorConfig?: ConstructorParameters<typeof MediaProcessor>[0]) {
    this.mediaProcessor = new MediaProcessor(mediaProcessorConfig);
    this.parsers = new Map();
    this.initializeParsers();
  }

  private initializeParsers(): void {
    // Initialize supported parsers
    this.parsers.set('opensea', new OpenSeaMetadataParser(this.mediaProcessor));
    // Add other parser implementations as they are developed
    // this.parsers.set('rarible', new RaribleMetadataParser(this.mediaProcessor));
    // this.parsers.set('foundation', new FoundationMetadataParser(this.mediaProcessor));
    // this.parsers.set('metaplex', new MetaplexMetadataParser(this.mediaProcessor));
  }

  getParser(source: string): IMetadataParser {
    const parser = this.parsers.get(source.toLowerCase());
    if (!parser) {
      throw new MetadataProcessingError(
        MetadataErrorType.INVALID_SCHEMA,
        `No parser available for source: ${source}`
      );
    }
    return parser;
  }

  async parseMetadata(source: string, rawMetadata: any) {
    const parser = this.getParser(source);
    return await parser.parse(rawMetadata);
  }

  getSupportedSources(): string[] {
    return Array.from(this.parsers.keys());
  }

  registerParser(source: string, parser: IMetadataParser): void {
    this.parsers.set(source.toLowerCase(), parser);
  }
}
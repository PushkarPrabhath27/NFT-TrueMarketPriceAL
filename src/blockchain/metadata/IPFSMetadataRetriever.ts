import { BaseMetadataRetriever, MetadataRetrievalError } from './BaseMetadataRetriever';

/**
 * IPFS Metadata Retriever with multiple gateway support
 */
export class IPFSMetadataRetriever extends BaseMetadataRetriever {
  private readonly gateways: string[] = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/'
  ];

  private currentGatewayIndex = 0;

  constructor(
    private readonly customGateways?: string[],
    private readonly timeoutMs: number = 10000
  ) {
    super();
    if (customGateways?.length) {
      this.gateways.unshift(...customGateways);
    }
  }

  get priority(): number {
    return 100; // High priority for IPFS
  }

  canHandle(uri: string): boolean {
    return uri.startsWith('ipfs://') || 
           uri.includes('/ipfs/') || 
           uri.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44,}/) !== null;
  }

  async retrieveMetadata(uri: string): Promise<any> {
    this.validateUri(uri);
    const ipfsHash = this.extractIPFSHash(uri);
    
    for (let attempt = 0; attempt < this.gateways.length; attempt++) {
      const gateway = this.gateways[this.currentGatewayIndex];
      try {
        const metadata = await this.fetchWithTimeout(
          `${gateway}${ipfsHash}`,
          this.timeoutMs
        );
        return metadata;
      } catch (error) {
        this.rotateGateway();
        if (attempt === this.gateways.length - 1) {
          throw new MetadataRetrievalError(
            'Failed to retrieve metadata from all IPFS gateways',
            uri,
            error as Error
          );
        }
      }
    }
  }

  private extractIPFSHash(uri: string): string {
    if (uri.startsWith('ipfs://')) {
      return uri.slice(7);
    }
    const ipfsMatch = uri.match(/\/ipfs\/([^\/?#]+)/);
    if (ipfsMatch) {
      return ipfsMatch[1];
    }
    if (uri.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44,}/)) {
      return uri;
    }
    throw new MetadataRetrievalError('Invalid IPFS URI format', uri);
  }

  private rotateGateway(): void {
    this.currentGatewayIndex = 
      (this.currentGatewayIndex + 1) % this.gateways.length;
  }

  private async fetchWithTimeout(
    url: string,
    timeout: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NFT-TrustScore-Metadata-Retriever/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
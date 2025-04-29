import { Contract } from '@ethersproject/contracts';
import { BaseEventListener, EventConfig, EventData } from './BaseEventListener';

interface MetadataEventData extends EventData {
  data: {
    tokenAddress: string;
    tokenId?: string;
    eventType: 'MetadataUpdate' | 'CollectionUpdate';
    updateType: 'URI' | 'Name' | 'Description' | 'Properties' | 'Royalties' | 'Other';
    oldValue?: string;
    newValue?: string;
    isCollectionLevel: boolean;
  };
}

export class MetadataEventListener extends BaseEventListener {
  private contracts: Map<string, Contract>;
  private readonly METADATA_UPDATE_EVENTS = {
    ERC721: {
      uri: 'URI(string,uint256)',
      collection: 'CollectionMetadataUpdate(string)'
    },
    ERC1155: {
      uri: 'URI(string,uint256[])',
      collection: 'CollectionMetadataUpdate(string)'
    }
  };

  constructor(config: EventConfig) {
    super(config);
    this.contracts = new Map();
  }

  public async addContract(address: string, standard: 'ERC721' | 'ERC1155'): Promise<void> {
    if (this.contracts.has(address)) return;

    const abi = [
      ...Object.values(this.METADATA_UPDATE_EVENTS[standard]),
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function uri(uint256 tokenId) view returns (string)'
    ];

    const contract = new Contract(address, abi, this.provider);
    this.contracts.set(address, contract);

    if (this.isListening) {
      await this.subscribeToMetadataEvents(contract, standard);
    }
  }

  protected async startListening(): Promise<void> {
    for (const [address, contract] of this.contracts) {
      const standard = await this.detectStandard(contract);
      await this.subscribeToMetadataEvents(contract, standard);
    }
  }

  protected async stopListening(): Promise<void> {
    for (const contract of this.contracts.values()) {
      contract.removeAllListeners();
    }
  }

  private async detectStandard(contract: Contract): Promise<'ERC721' | 'ERC1155'> {
    try {
      await contract.tokenURI(0);
      return 'ERC721';
    } catch {
      try {
        await contract.uri(0);
        return 'ERC1155';
      } catch {
        throw new Error('Unsupported token standard');
      }
    }
  }

  private async subscribeToMetadataEvents(contract: Contract, standard: 'ERC721' | 'ERC1155'): Promise<void> {
    // Subscribe to token URI updates
    contract.on(this.METADATA_UPDATE_EVENTS[standard].uri, async (uri: string, tokenId: any, event: any) => {
      const eventData: MetadataEventData = {
        eventType: 'MetadataUpdate',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          tokenAddress: contract.address,
          tokenId: Array.isArray(tokenId) ? tokenId[0].toString() : tokenId.toString(),
          eventType: 'MetadataUpdate',
          updateType: 'URI',
          newValue: uri,
          isCollectionLevel: false
        }
      };
      await this.processEvent(eventData);
    });

    // Subscribe to collection-level updates
    contract.on(this.METADATA_UPDATE_EVENTS[standard].collection, async (updateData: string, event: any) => {
      try {
        const updateInfo = JSON.parse(updateData);
        const eventData: MetadataEventData = {
          eventType: 'CollectionUpdate',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            tokenAddress: contract.address,
            eventType: 'CollectionUpdate',
            updateType: updateInfo.type || 'Other',
            oldValue: updateInfo.oldValue,
            newValue: updateInfo.newValue,
            isCollectionLevel: true
          }
        };
        await this.processEvent(eventData);
      } catch (error) {
        this.emit('error', { error, message: 'Failed to parse collection update data' });
      }
    });
  }

  protected async handleEvent(eventData: MetadataEventData): Promise<void> {
    // Implement specific metadata event handling logic
    if (eventData.data.isCollectionLevel) {
      this.emit('collectionUpdate', eventData);
    } else {
      this.emit('metadataUpdate', eventData);
    }

    // Additional processing like updating cache or database can be added here
  }

  public async getTokenURI(tokenAddress: string, tokenId: string): Promise<string> {
    const contract = this.contracts.get(tokenAddress);
    if (!contract) {
      throw new Error('Contract not found');
    }

    try {
      return await contract.tokenURI(tokenId);
    } catch {
      try {
        return await contract.uri(tokenId);
      } catch {
        throw new Error('Failed to fetch token URI');
      }
    }
  }
}
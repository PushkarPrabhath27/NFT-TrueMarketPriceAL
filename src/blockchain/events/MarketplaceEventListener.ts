import { Contract } from '@ethersproject/contracts';
import { BaseEventListener, EventConfig, EventData } from './BaseEventListener';

interface MarketplaceEventData extends EventData {
  data: {
    marketplace: string;
    eventType: 'Sale' | 'Listing' | 'Bid' | 'CancelListing' | 'CancelBid';
    tokenId: string;
    tokenAddress: string;
    seller?: string;
    buyer?: string;
    price?: string;
    currency?: string;
    quantity?: string;
  };
}

export class MarketplaceEventListener extends BaseEventListener {
  private marketplaceContracts: Map<string, Contract>;
  private readonly supportedMarketplaces: Map<string, any>;

  constructor(config: EventConfig) {
    super(config);
    this.marketplaceContracts = new Map();
    this.supportedMarketplaces = this.initializeMarketplaces();
  }

  private initializeMarketplaces(): Map<string, any> {
    return new Map([
      ['opensea', {
        address: '0x00000000006c3852cbEf3e08E8dF289169EdE581',
        events: {
          sale: 'OrderFulfilled(bytes32,address,address,address,(uint8,address,uint256,uint256),address,uint256)',
          listing: 'OrdersMatched(bytes32,bytes32,address,address,uint256,uint256)'
        }
      }],
      ['rarible', {
        address: '0x9757F2d2b135150BBeb65308D4a91804107cd8D6',
        events: {
          sale: 'Match(address,address,uint256,uint256,(uint8,address,uint256)[],(uint8,address,uint256)[])',
          listing: 'OrderCreated(bytes32,address,address,(uint8,address,uint256,uint256)[],(uint8,address,uint256,uint256)[])',
        }
      }]
      // Add more marketplaces as needed
    ]);
  }

  public async addMarketplace(name: string, address: string, customEvents?: any): Promise<void> {
    if (this.marketplaceContracts.has(address)) return;

    const marketplace = customEvents || this.supportedMarketplaces.get(name.toLowerCase());
    if (!marketplace) {
      throw new Error(`Unsupported marketplace: ${name}`);
    }

    const abi = Object.values(marketplace.events);
    const contract = new Contract(address, abi, this.provider);
    this.marketplaceContracts.set(address, contract);

    if (this.isListening) {
      await this.subscribeToMarketplaceEvents(contract, name, marketplace.events);
    }
  }

  protected async startListening(): Promise<void> {
    for (const [address, contract] of this.marketplaceContracts) {
      const marketplaceName = this.getMarketplaceName(address);
      const marketplace = this.supportedMarketplaces.get(marketplaceName);
      if (marketplace) {
        await this.subscribeToMarketplaceEvents(contract, marketplaceName, marketplace.events);
      }
    }
  }

  protected async stopListening(): Promise<void> {
    for (const contract of this.marketplaceContracts.values()) {
      contract.removeAllListeners();
    }
  }

  private getMarketplaceName(address: string): string {
    for (const [name, data] of this.supportedMarketplaces) {
      if (data.address.toLowerCase() === address.toLowerCase()) {
        return name;
      }
    }
    return 'unknown';
  }

  private async subscribeToMarketplaceEvents(contract: Contract, marketplaceName: string, events: any): Promise<void> {
    // OpenSea Events
    if (marketplaceName === 'opensea') {
      contract.on(events.sale, (...args) => {
        const event = args[args.length - 1];
        const [orderHash, seller, buyer, tokenContract, details, , price] = args;
        
        const eventData: MarketplaceEventData = {
          eventType: 'Sale',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            marketplace: marketplaceName,
            eventType: 'Sale',
            tokenId: details.identifier.toString(),
            tokenAddress: tokenContract,
            seller,
            buyer,
            price: price.toString(),
            currency: details.token
          }
        };
        this.processEvent(eventData);
      });

      contract.on(events.listing, (...args) => {
        const event = args[args.length - 1];
        const [orderHash, maker, tokenContract, tokenId, price] = args;

        const eventData: MarketplaceEventData = {
          eventType: 'Listing',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            marketplace: marketplaceName,
            eventType: 'Listing',
            tokenId: tokenId.toString(),
            tokenAddress: tokenContract,
            seller: maker,
            price: price.toString()
          }
        };
        this.processEvent(eventData);
      });
    }

    // Rarible Events
    if (marketplaceName === 'rarible') {
      contract.on(events.sale, (...args) => {
        const event = args[args.length - 1];
        const [seller, buyer, tokenId, price, sellAssets, buyAssets] = args;

        const eventData: MarketplaceEventData = {
          eventType: 'Sale',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            marketplace: marketplaceName,
            eventType: 'Sale',
            tokenId: tokenId.toString(),
            tokenAddress: sellAssets[0].token,
            seller,
            buyer,
            price: price.toString(),
            quantity: sellAssets[0].value.toString()
          }
        };
        this.processEvent(eventData);
      });
    }
  }

  protected async handleEvent(eventData: MarketplaceEventData): Promise<void> {
    // Implement specific marketplace event handling logic
    this.emit('marketplaceEvent', eventData);
  }
}
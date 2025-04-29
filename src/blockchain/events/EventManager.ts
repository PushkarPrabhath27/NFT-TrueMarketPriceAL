import { Provider } from '@ethersproject/providers';
import { BaseEventListener, EventConfig } from './BaseEventListener';
import { TransferEventListener } from './TransferEventListener';
import { MarketplaceEventListener } from './MarketplaceEventListener';
import { MetadataEventListener } from './MetadataEventListener';

export interface EventManagerConfig extends EventConfig {
  enabledEvents?: {
    transfer?: boolean;
    marketplace?: boolean;
    metadata?: boolean;
  };
}

export class EventManager {
  private transferListener?: TransferEventListener;
  private marketplaceListener?: MarketplaceEventListener;
  private metadataListener?: MetadataEventListener;
  private readonly config: EventManagerConfig;

  constructor(config: EventManagerConfig) {
    this.config = {
      ...config,
      enabledEvents: {
        transfer: true,
        marketplace: true,
        metadata: true,
        ...config.enabledEvents
      }
    };

    this.initializeListeners();
  }

  private initializeListeners(): void {
    if (this.config.enabledEvents?.transfer) {
      this.transferListener = new TransferEventListener(this.config);
      this.setupListenerEvents(this.transferListener, 'transfer');
    }

    if (this.config.enabledEvents?.marketplace) {
      this.marketplaceListener = new MarketplaceEventListener(this.config);
      this.setupListenerEvents(this.marketplaceListener, 'marketplace');
    }

    if (this.config.enabledEvents?.metadata) {
      this.metadataListener = new MetadataEventListener(this.config);
      this.setupListenerEvents(this.metadataListener, 'metadata');
    }
  }

  private setupListenerEvents(listener: BaseEventListener, type: string): void {
    listener.on('error', (error) => {
      console.error(`Error in ${type} listener:`, error);
    });

    listener.on('retryError', (data) => {
      console.warn(`Retry error in ${type} listener:`, data);
    });

    listener.on('maxRetriesExceeded', (data) => {
      console.error(`Max retries exceeded in ${type} listener:`, data);
    });
  }

  public async start(): Promise<void> {
    const startPromises: Promise<void>[] = [];

    if (this.transferListener) {
      startPromises.push(this.transferListener.start());
    }

    if (this.marketplaceListener) {
      startPromises.push(this.marketplaceListener.start());
    }

    if (this.metadataListener) {
      startPromises.push(this.metadataListener.start());
    }

    await Promise.all(startPromises);
  }

  public async stop(): Promise<void> {
    const stopPromises: Promise<void>[] = [];

    if (this.transferListener) {
      stopPromises.push(this.transferListener.stop());
    }

    if (this.marketplaceListener) {
      stopPromises.push(this.marketplaceListener.stop());
    }

    if (this.metadataListener) {
      stopPromises.push(this.metadataListener.stop());
    }

    await Promise.all(stopPromises);
  }

  public async addNFTContract(address: string, standard: 'ERC721' | 'ERC1155'): Promise<void> {
    if (this.transferListener) {
      await this.transferListener.addContract(address, standard);
    }

    if (this.metadataListener) {
      await this.metadataListener.addContract(address, standard);
    }
  }

  public async addMarketplace(name: string, address: string, customEvents?: any): Promise<void> {
    if (this.marketplaceListener) {
      await this.marketplaceListener.addMarketplace(name, address, customEvents);
    }
  }

  public getTransferListener(): TransferEventListener | undefined {
    return this.transferListener;
  }

  public getMarketplaceListener(): MarketplaceEventListener | undefined {
    return this.marketplaceListener;
  }

  public getMetadataListener(): MetadataEventListener | undefined {
    return this.metadataListener;
  }
}
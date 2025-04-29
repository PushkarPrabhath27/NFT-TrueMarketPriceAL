import { ethers } from 'ethers';
import { NFTContract, ContractDiscoveryService } from './ContractDiscoveryService';

interface MarketplaceConfig {
  name: string;
  contractAddress: string;
  eventTopics: string[];
}

export class MarketplaceIntegrationService {
  private discoveryService: ContractDiscoveryService;
  private marketplaces: Map<string, MarketplaceConfig>;
  private provider: ethers.providers.Provider;

  constructor(discoveryService: ContractDiscoveryService, provider: ethers.providers.Provider) {
    this.discoveryService = discoveryService;
    this.provider = provider;
    this.marketplaces = new Map();

    // Initialize known marketplaces
    this.initializeMarketplaces();
  }

  private initializeMarketplaces(): void {
    // OpenSea
    this.addMarketplace({
      name: 'OpenSea',
      contractAddress: '0x00000000006c3852cbEf3e08E8dF289169EdE581',
      eventTopics: [
        ethers.utils.id('OrderFulfilled(bytes32,address,address,address,(uint8,address,uint256,uint256),address)'),
        ethers.utils.id('OrdersMatched(bytes32,bytes32,address,address,uint256,uint256)')
      ]
    });

    // Rarible
    this.addMarketplace({
      name: 'Rarible',
      contractAddress: '0x9757F2d2b135150BBeb65308D4a91804107cd8D6',
      eventTopics: [
        ethers.utils.id('Match(address,address,uint256,uint256,bytes32,bytes32)')
      ]
    });
  }

  public addMarketplace(config: MarketplaceConfig): void {
    this.marketplaces.set(config.name.toLowerCase(), config);
  }

  public async startMonitoring(): Promise<void> {
    for (const marketplace of this.marketplaces.values()) {
      await this.monitorMarketplace(marketplace);
    }
  }

  private async monitorMarketplace(marketplace: MarketplaceConfig): Promise<void> {
    try {
      const filter = {
        address: marketplace.contractAddress,
        topics: [marketplace.eventTopics]
      };

      this.provider.on(filter, async (log) => {
        await this.processMarketplaceEvent(marketplace.name, log);
      });

    } catch (error) {
      console.error(`Error monitoring ${marketplace.name}:`, error);
    }
  }

  private async processMarketplaceEvent(marketplaceName: string, log: ethers.providers.Log): Promise<void> {
    try {
      const transaction = await this.provider.getTransaction(log.transactionHash);
      if (!transaction) return;

      // Extract NFT contract address from the transaction data
      const nftContractAddress = this.extractNFTContractAddress(transaction.data);
      if (!nftContractAddress) return;

      // Check if we already know about this contract
      const existingContracts = this.discoveryService.getDiscoveredContracts();
      const isKnown = existingContracts.some(c => c.address.toLowerCase() === nftContractAddress.toLowerCase());

      if (!isKnown) {
        const standard = await this.discoveryService['detectNFTStandard'](nftContractAddress);
        if (standard) {
          const contract: NFTContract = {
            address: nftContractAddress,
            standard,
            marketplace: marketplaceName,
            verified: true // Contracts from known marketplaces are considered verified
          };

          this.discoveryService.addKnownContract(contract);
        }
      }
    } catch (error) {
      console.error('Error processing marketplace event:', error);
    }
  }

  private extractNFTContractAddress(data: string): string | null {
    try {
      // Basic extraction of potential contract address from transaction data
      // This is a simplified version - actual implementation would need marketplace-specific logic
      const addressCandidate = '0x' + data.slice(34, 74);
      if (ethers.utils.isAddress(addressCandidate)) {
        return addressCandidate;
      }
      return null;
    } catch {
      return null;
    }
  }

  public getMonitoredMarketplaces(): string[] {
    return Array.from(this.marketplaces.keys());
  }
}
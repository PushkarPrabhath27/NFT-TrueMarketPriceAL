import { EventEmitter } from 'events';
import { ethers } from 'ethers';

// Interface definitions
export interface NFTContract {
  address: string;
  standard: 'ERC721' | 'ERC1155';
  name?: string;
  symbol?: string;
  verified: boolean;
  marketplace?: string;
}

export interface ContractMonitoringConfig {
  blockConfirmations: number;
  scanBatchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

// Base class for contract discovery and monitoring
export class ContractDiscoveryService extends EventEmitter {
  protected provider: ethers.providers.Provider;
  protected config: ContractMonitoringConfig;
  protected knownContracts: Map<string, NFTContract>;
  protected isMonitoring: boolean;

  constructor(provider: ethers.providers.Provider, config: ContractMonitoringConfig) {
    super();
    this.provider = provider;
    this.config = config;
    this.knownContracts = new Map();
    this.isMonitoring = false;
  }

  // Check if contract implements NFT standards
  protected async detectNFTStandard(address: string): Promise<'ERC721' | 'ERC1155' | null> {
    try {
      const ERC165Interface = new ethers.utils.Interface([
        'function supportsInterface(bytes4 interfaceId) external view returns (bool)'
      ]);

      const contract = new ethers.Contract(address, ERC165Interface, this.provider);

      // Interface IDs
      const ERC721InterfaceId = '0x80ac58cd';
      const ERC1155InterfaceId = '0xd9b67a26';

      const [isERC721, isERC1155] = await Promise.all([
        contract.supportsInterface(ERC721InterfaceId),
        contract.supportsInterface(ERC1155InterfaceId)
      ]);

      if (isERC721) return 'ERC721';
      if (isERC1155) return 'ERC1155';
      return null;
    } catch (error) {
      console.error(`Error detecting NFT standard for ${address}:`, error);
      return null;
    }
  }

  // Start monitoring for new contracts
  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    try {
      const latestBlock = await this.provider.getBlockNumber();
      let currentBlock = latestBlock;

      while (this.isMonitoring) {
        const toBlock = Math.min(
          currentBlock + this.config.scanBatchSize,
          await this.provider.getBlockNumber()
        );

        if (currentBlock >= toBlock) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        await this.scanBlockRange(currentBlock, toBlock);
        currentBlock = toBlock + 1;
      }
    } catch (error) {
      console.error('Error in contract monitoring:', error);
      this.isMonitoring = false;
      throw error;
    }
  }

  // Stop monitoring
  public stopMonitoring(): void {
    this.isMonitoring = false;
  }

  // Scan a range of blocks for new contracts
  protected async scanBlockRange(fromBlock: number, toBlock: number): Promise<void> {
    try {
      const filter = {
        fromBlock,
        toBlock,
        topics: [ethers.utils.id('Transfer(address,address,uint256)')]
      };

      const logs = await this.provider.getLogs(filter);

      for (const log of logs) {
        if (!this.knownContracts.has(log.address)) {
          const standard = await this.detectNFTStandard(log.address);
          if (standard) {
            const contract: NFTContract = {
              address: log.address,
              standard,
              verified: false
            };

            this.knownContracts.set(log.address, contract);
            this.emit('contractDiscovered', contract);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning blocks ${fromBlock}-${toBlock}:`, error);
    }
  }

  // Get all discovered contracts
  public getDiscoveredContracts(): NFTContract[] {
    return Array.from(this.knownContracts.values());
  }

  // Add a known contract manually
  public addKnownContract(contract: NFTContract): void {
    this.knownContracts.set(contract.address, contract);
    this.emit('contractAdded', contract);
  }
}
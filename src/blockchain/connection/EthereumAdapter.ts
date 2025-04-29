import { ethers } from 'ethers';
import {
  BlockchainConfig,
  BlockchainResponse,
  QueryOptions
} from './BlockchainInterface';
import { BaseBlockchainAdapter } from './BaseBlockchainAdapter';
import { BlockchainProvider } from './interfaces/BlockchainProvider';
import { ConnectionConfig, ConnectionStatus } from './interfaces/ConnectionConfig';

/**
 * Ethereum blockchain adapter implementation
 */
export class EthereumAdapter extends BaseBlockchainAdapter implements BlockchainProvider {
  private provider: ethers.providers.JsonRpcProvider;
  private eventSubscriptions: Map<string, ethers.providers.Listener> = new Map();
  private networkUrl: string;
  private chainId: string;
  private latency: number = 0;
  private errorCount: number = 0;
  private totalRequests: number = 0;
  private rateLimitReset?: Date;
  private remainingRequests?: number;

  /**
   * Establishes connection to Ethereum network
   */
  async initialize(config: ConnectionConfig): Promise<void> {
    const network = config.networks[config.defaultNetwork || Object.keys(config.networks)[0]];
    if (!network || !network.providers || network.providers.length === 0) {
      throw new Error('No valid provider configuration found');
    }
    
    const provider = network.providers[0];
    this.networkUrl = provider.url;
    this.chainId = String(network.chainId);
  }

  async connect(): Promise<boolean> {
    try {
      this.provider = new ethers.providers.JsonRpcProvider(this.networkUrl, this.chainId);
      await this.provider.ready;
      this.connected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to Ethereum network:', error);
      this.connected = false;
      return false;
    }
  }

  /**
   * Closes the connection and cleans up subscriptions
   */
  async getStatus(): Promise<ConnectionStatus> {
    return {
      isConnected: this.isConnected(),
      latency: this.getLatency(),
      errorRate: this.getErrorRate(),
      chainId: await this.getChainId(),
      blockNumber: await this.provider.getBlockNumber()
    };
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getChainId(): Promise<string> {
    const network = await this.provider.getNetwork();
    return String(network.chainId);
  }

  getName(): string {
    return 'Ethereum';
  }

  getUrl(): string {
    return this.networkUrl;
  }

  getPriority(): number {
    return 1;
  }

  getLatency(): number {
    return this.latency;
  }

  getErrorRate(): number {
    return this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0;
  }

  async getRateLimitStatus(): Promise<{
    isLimited: boolean;
    resetTime?: Date;
    remainingRequests?: number;
  }> {
    return {
      isLimited: !!this.rateLimitReset && this.rateLimitReset > new Date(),
      resetTime: this.rateLimitReset,
      remainingRequests: this.remainingRequests
    };
  }

  async executeRpcCall<T>(method: string, params: any[]): Promise<T> {
    try {
      this.totalRequests++;
      const startTime = Date.now();
      const result = await this.provider.send(method, params);
      this.latency = Date.now() - startTime;
      return result as T;
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    for (const [subscriptionId, listener] of this.eventSubscriptions) {
      await this.unsubscribeFromEvents(subscriptionId);
    }
    this.provider.removeAllListeners();
    this.connected = false;
  }

  /**
   * Gets current network status including health check
   */
  async getNetworkStatus(): Promise<BlockchainResponse<{
    isHealthy: boolean;
    latency: number;
    blockHeight: string | number;
  }>> {
    try {
      const startTime = Date.now();
      const [network, blockNumber] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber()
      ]);
      const latency = Date.now() - startTime;

      return this.createResponse(true, {
        isHealthy: network.chainId === Number(this.config.chainId),
        latency,
        blockHeight: blockNumber
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Gets balance for an address
   */
  async getBalance(address: string, options?: QueryOptions): Promise<BlockchainResponse<string>> {
    try {
      const balance = await this.withRetry(
        () => this.provider.getBalance(address),
        options
      );
      return this.createResponse(true, ethers.utils.formatEther(balance));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Gets transaction details
   */
  async getTransaction(txHash: string, options?: QueryOptions): Promise<BlockchainResponse<any>> {
    try {
      const tx = await this.withRetry(
        () => this.provider.getTransaction(txHash),
        options
      );
      return this.createResponse(true, tx);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Gets block information
   */
  async getBlock(blockNumber: string | number, options?: QueryOptions): Promise<BlockchainResponse<any>> {
    try {
      const block = await this.withRetry(
        () => this.provider.getBlock(blockNumber),
        options
      );
      return this.createResponse(true, block);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Gets NFT metadata using ERC721/ERC1155 standard interfaces
   */
  async getNFTMetadata(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<any>> {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function tokenURI(uint256 tokenId) view returns (string)',
          'function uri(uint256 tokenId) view returns (string)'
        ],
        this.provider
      );

      const tokenURI = await this.withRetry(
        async () => {
          try {
            return await contract.tokenURI(tokenId);
          } catch {
            return await contract.uri(tokenId);
          }
        },
        options
      );

      // Fetch metadata from URI
      const response = await fetch(tokenURI);
      const metadata = await response.json();

      return this.createResponse(true, metadata);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Gets NFT owner address
   */
  async getNFTOwner(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<string>> {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        ['function ownerOf(uint256 tokenId) view returns (address)'],
        this.provider
      );

      const owner = await this.withRetry(
        () => contract.ownerOf(tokenId),
        options
      );

      return this.createResponse(true, owner);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Gets NFT transfer history
   */
  /**
   * Calls a contract method
   */
  async callContractMethod(
    contractAddress: string,
    method: string,
    params: any[],
    options?: QueryOptions
  ): Promise<BlockchainResponse<any>> {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        [method],
        this.provider
      );

      const result = await this.withRetry(
        () => contract[method.split('(')[0]](...params),
        options
      );

      return this.createResponse(true, result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Gets NFT transfer history
   */
  async getNFTTransferHistory(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<BlockchainResponse<any[]>> {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        [
          'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
        ],
        this.provider
      );

      const filter = contract.filters.Transfer(null, null, tokenId);
      const events = await this.withRetry(
        () => contract.queryFilter(filter),
        options
      );

      return this.createResponse(true, events.map(event => ({
        from: event.args.from,
        to: event.args.to,
        tokenId: event.args.tokenId.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      })));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Calls a contract method
   */
  async callContractMethod(
    contractAddress: string,
    method: string,
    params: any[],
    options?: QueryOptions
  ): Promise<BlockchainResponse<any>> {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        [method],
        this.provider
      );

      const result = await this.withRetry(
        () => contract[method.split('(')[0]](...params),
        options
      );

      return this.createResponse(true, result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Subscribes to contract events
   */
  async subscribeToEvents(
    contractAddress: string,
    eventName: string,
    callback: (event: any) => void,
    options?: QueryOptions
  ): Promise<BlockchainResponse<string>> {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        [`event ${eventName}`],
        this.provider
      );

      const subscriptionId = `${contractAddress}-${eventName}-${Date.now()}`;
      const listener = (...args: any[]) => {
        const event = args[args.length - 1];
        callback({
          ...event,
          args: args.slice(0, -1)
        });
      };

      contract.on(eventName, listener);
      this.eventSubscriptions.set(subscriptionId, listener);

      return this.createResponse(true, subscriptionId);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Unsubscribes from events
   */
  async unsubscribeFromEvents(subscriptionId: string): Promise<BlockchainResponse<boolean>> {
    try {
      const listener = this.eventSubscriptions.get(subscriptionId);
      if (listener) {
        this.provider.removeListener(subscriptionId, listener);
        this.eventSubscriptions.delete(subscriptionId);
        return this.createResponse(true, true);
      }
      return this.createResponse(true, false);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
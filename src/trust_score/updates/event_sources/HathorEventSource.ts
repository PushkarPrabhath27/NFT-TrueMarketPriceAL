/**
 * HathorEventSource.ts
 * 
 * Implements the Hathor Network Event Monitoring component of the Real-Time Update System.
 * Responsible for listening to Hathor blockchain events such as NFT transfers, token movements,
 * and contract executions that can affect TrustScore calculations.
 */

import { EventEmitter } from 'events';
import { HathorProvider } from '../../../blockchain/hathor/HathorProvider';
import { NanoContractClient } from '../../../blockchain/hathor/NanoContractClient';
import { TrustScoreTypes } from '../../types';

/**
 * Configuration for the Hathor event source
 */
export interface HathorEventSourceConfig {
  // Hathor network configuration
  network: 'mainnet' | 'testnet' | 'nano-testnet';
  // API URL for the Hathor node
  apiUrl: string;
  // Optional API key for authenticated access
  apiKey?: string;
  // Polling interval in milliseconds
  pollingInterval: number;
  // Maximum number of retries for failed connections
  maxRetries: number;
  // Backoff multiplier for retry delays
  backoffMultiplier: number;
  // Whether to enable historical event backfilling
  enableBackfill: boolean;
  // Maximum number of blocks to backfill
  maxBackfillBlocks: number;
  // Enabled event types
  enabledEvents: {
    nftTransfers: boolean;
    tokenTransfers: boolean;
    contractExecutions: boolean;
  };
}

/**
 * Manages Hathor blockchain event monitoring and emits events when relevant changes occur
 */
export class HathorEventSource extends EventEmitter {
  private config: HathorEventSourceConfig;
  private provider: HathorProvider;
  private contractClient: NanoContractClient;
  private isRunning: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private pollingInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private lastProcessedBlock?: number;
  
  /**
   * Initialize the Hathor Event Source
   * 
   * @param config Configuration for the Hathor event source
   */
  constructor(config: HathorEventSourceConfig) {
    super();
    this.config = this.getDefaultConfig(config);
    this.setupProvider();
  }
  
  /**
   * Merge provided config with default values
   */
  private getDefaultConfig(config: Partial<HathorEventSourceConfig>): HathorEventSourceConfig {
    return {
      network: 'mainnet',
      apiUrl: 'https://node1.hathor.network/v1a/',
      pollingInterval: 10000, // 10 seconds
      maxRetries: 5,
      backoffMultiplier: 1.5,
      enableBackfill: true,
      maxBackfillBlocks: 1000,
      enabledEvents: {
        nftTransfers: true,
        tokenTransfers: true,
        contractExecutions: true,
        ...config.enabledEvents
      },
      ...config
    };
  }
  
  /**
   * Set up the Hathor provider and contract client
   */
  private setupProvider(): void {
    try {
      this.provider = new HathorProvider({
        network: this.config.network,
        apiUrl: this.config.apiUrl,
        apiKey: this.config.apiKey
      });
      
      this.contractClient = new NanoContractClient(this.provider);
    } catch (error) {
      console.error('Error setting up Hathor provider:', error);
      this.emit('error', { source: 'provider_setup', error });
    }
  }
  
  /**
   * Start listening for Hathor blockchain events
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.reconnectAttempts = 0;
    
    // Start polling for new blocks
    this.startPolling();
    
    // Set up health check interval
    this.healthCheckInterval = setInterval(() => {
      this.checkProviderHealth();
    }, 30000); // Check every 30 seconds
    
    // Backfill historical events if enabled
    if (this.config.enableBackfill) {
      this.backfillHistoricalEvents();
    }
    
    this.emit('started');
  }
  
  /**
   * Start polling for new blocks and events
   */
  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForNewEvents();
      } catch (error) {
        console.error('Error polling for events:', error);
        this.emit('error', { source: 'polling', error });
      }
    }, this.config.pollingInterval);
  }
  
  /**
   * Poll for new events from the Hathor network
   */
  private async pollForNewEvents(): Promise<void> {
    try {
      // Get the latest block height
      const latestBlock = await this.provider.getLatestBlockHeight();
      
      // If this is the first poll, just store the block height and return
      if (!this.lastProcessedBlock) {
        this.lastProcessedBlock = latestBlock;
        return;
      }
      
      // If there are new blocks, process them
      if (latestBlock > this.lastProcessedBlock) {
        // Process blocks from lastProcessedBlock+1 to latestBlock
        for (let blockHeight = this.lastProcessedBlock + 1; blockHeight <= latestBlock; blockHeight++) {
          await this.processBlock(blockHeight);
        }
        
        // Update the last processed block
        this.lastProcessedBlock = latestBlock;
      }
    } catch (error) {
      console.error('Error polling for new events:', error);
      this.emit('error', { source: 'polling', error });
    }
  }
  
  /**
   * Process a single block for events
   * 
   * @param blockHeight The height of the block to process
   */
  private async processBlock(blockHeight: number): Promise<void> {
    try {
      // Get the block data
      const block = await this.provider.getBlockByHeight(blockHeight);
      
      // Process each transaction in the block
      for (const tx of block.transactions) {
        await this.processTransaction(tx, blockHeight, block.timestamp);
      }
    } catch (error) {
      console.error(`Error processing block ${blockHeight}:`, error);
      this.emit('error', { source: 'block_processing', blockHeight, error });
    }
  }
  
  /**
   * Process a transaction for events
   * 
   * @param tx The transaction to process
   * @param blockHeight The height of the block containing the transaction
   * @param timestamp The timestamp of the block
   */
  private async processTransaction(tx: any, blockHeight: number, timestamp: string): Promise<void> {
    try {
      // Check if this is an NFT transfer
      if (this.config.enabledEvents.nftTransfers && this.isNFTTransfer(tx)) {
        await this.processNFTTransfer(tx, blockHeight, timestamp);
      }
      
      // Check if this is a token transfer
      if (this.config.enabledEvents.tokenTransfers && this.isTokenTransfer(tx)) {
        await this.processTokenTransfer(tx, blockHeight, timestamp);
      }
      
      // Check if this is a contract execution
      if (this.config.enabledEvents.contractExecutions && this.isContractExecution(tx)) {
        await this.processContractExecution(tx, blockHeight, timestamp);
      }
    } catch (error) {
      console.error(`Error processing transaction ${tx.hash}:`, error);
      this.emit('error', { source: 'transaction_processing', txHash: tx.hash, error });
    }
  }
  
  /**
   * Check if a transaction is an NFT transfer
   * 
   * @param tx The transaction to check
   */
  private isNFTTransfer(tx: any): boolean {
    // Implementation depends on Hathor's specific NFT transfer format
    // This is a placeholder - actual implementation would check for NFT-specific metadata
    return tx.tokens && tx.tokens.some((token: any) => token.nft === true);
  }
  
  /**
   * Process an NFT transfer transaction
   * 
   * @param tx The NFT transfer transaction
   * @param blockHeight The height of the block containing the transaction
   * @param timestamp The timestamp of the block
   */
  private async processNFTTransfer(tx: any, blockHeight: number, timestamp: string): Promise<void> {
    // Extract NFT transfer details
    const nftTokens = tx.tokens.filter((token: any) => token.nft === true);
    
    for (const nftToken of nftTokens) {
      const updateEvent: TrustScoreTypes.UpdateEvent = {
        eventType: 'nft_transfer',
        entityId: nftToken.uid, // Use the token UID as the entity ID
        entityType: 'nft',
        timestamp,
        data: {
          from: tx.inputs[0].address, // Simplified - actual implementation would trace inputs/outputs
          to: tx.outputs[0].address,  // Simplified - actual implementation would trace inputs/outputs
          tokenId: nftToken.uid,
          blockHeight,
          transactionHash: tx.hash
        },
        priority: 8 // High priority
      };
      
      this.emit('event', updateEvent);
    }
  }
  
  /**
   * Check if a transaction is a token transfer
   * 
   * @param tx The transaction to check
   */
  private isTokenTransfer(tx: any): boolean {
    // Implementation depends on Hathor's specific token transfer format
    // This is a placeholder - actual implementation would check for token transfers
    return tx.tokens && tx.tokens.length > 0;
  }
  
  /**
   * Process a token transfer transaction
   * 
   * @param tx The token transfer transaction
   * @param blockHeight The height of the block containing the transaction
   * @param timestamp The timestamp of the block
   */
  private async processTokenTransfer(tx: any, blockHeight: number, timestamp: string): Promise<void> {
    // Extract token transfer details
    for (const token of tx.tokens) {
      const updateEvent: TrustScoreTypes.UpdateEvent = {
        eventType: 'token_transfer',
        entityId: token.uid, // Use the token UID as the entity ID
        entityType: 'collection', // Tokens are treated as collections
        timestamp,
        data: {
          from: tx.inputs[0].address, // Simplified - actual implementation would trace inputs/outputs
          to: tx.outputs[0].address,  // Simplified - actual implementation would trace inputs/outputs
          tokenId: token.uid,
          amount: token.amount,
          blockHeight,
          transactionHash: tx.hash
        },
        priority: 6 // Medium priority
      };
      
      this.emit('event', updateEvent);
    }
  }
  
  /**
   * Check if a transaction is a contract execution
   * 
   * @param tx The transaction to check
   */
  private isContractExecution(tx: any): boolean {
    // Implementation depends on Hathor's specific contract execution format
    // This is a placeholder - actual implementation would check for contract execution metadata
    return tx.data && tx.data.includes('contract_execution');
  }
  
  /**
   * Process a contract execution transaction
   * 
   * @param tx The contract execution transaction
   * @param blockHeight The height of the block containing the transaction
   * @param timestamp The timestamp of the block
   */
  private async processContractExecution(tx: any, blockHeight: number, timestamp: string): Promise<void> {
    try {
      // Extract contract execution details
      // In a real implementation, we would parse the contract execution data
      const contractId = tx.data.split('contract_execution:')[1];
      
      // Get contract details from the contract client
      const contractDetails = await this.contractClient.getContractDetails(contractId);
      
      const updateEvent: TrustScoreTypes.UpdateEvent = {
        eventType: 'contract_execution',
        entityId: contractId,
        entityType: 'nft', // Assuming the contract is related to an NFT
        timestamp,
        data: {
          contractId,
          method: contractDetails.method, // The method that was called
          params: contractDetails.params, // The parameters that were passed
          result: contractDetails.result, // The result of the execution
          blockHeight,
          transactionHash: tx.hash
        },
        priority: 9 // Very high priority
      };
      
      this.emit('event', updateEvent);
    } catch (error) {
      console.error(`Error processing contract execution for transaction ${tx.hash}:`, error);
      this.emit('error', { source: 'contract_processing', txHash: tx.hash, error });
    }
  }
  
  /**
   * Check the health of the Hathor provider
   */
  private async checkProviderHealth(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    try {
      // Check if the provider is healthy by getting the latest block height
      await this.provider.getLatestBlockHeight();
      
      // Reset reconnect attempts on successful health check
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Provider health check failed:', error);
      this.reconnectProvider();
    }
  }
  
  /**
   * Reconnect to the Hathor provider with exponential backoff
   */
  private reconnectProvider(): void {
    if (!this.isRunning) {
      return;
    }
    
    // Increment reconnect attempts
    this.reconnectAttempts++;
    
    // Calculate backoff delay
    const delay = Math.min(
      30000, // Max 30 seconds
      1000 * Math.pow(this.config.backoffMultiplier, this.reconnectAttempts)
    );
    
    console.log(`Reconnecting to Hathor provider in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    // Clear existing polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
    
    // Set up reconnect timeout
    this.reconnectTimeout = setTimeout(() => {
      this.setupProvider();
      this.startPolling();
    }, delay);
    
    this.emit('reconnecting', {
      reconnectAttempts: this.reconnectAttempts,
      reconnectDelay: delay
    });
  }
  
  /**
   * Backfill historical events
   */
  private async backfillHistoricalEvents(): Promise<void> {
    try {
      // Get the latest block height
      const latestBlock = await this.provider.getLatestBlockHeight();
      
      // Calculate the starting block for backfill
      const fromBlock = Math.max(0, latestBlock - this.config.maxBackfillBlocks);
      
      console.log(`Starting backfill from block ${fromBlock} to ${latestBlock}`);
      
      // Process blocks in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let blockHeight = fromBlock; blockHeight <= latestBlock; blockHeight += batchSize) {
        const endBlock = Math.min(blockHeight + batchSize - 1, latestBlock);
        
        // Process each block in the batch
        for (let block = blockHeight; block <= endBlock; block++) {
          await this.processBlock(block);
        }
        
        // Update the last processed block
        this.lastProcessedBlock = endBlock;
      }
      
      console.log(`Backfill completed from block ${fromBlock} to ${latestBlock}`);
      this.emit('backfillCompleted', { fromBlock, toBlock: latestBlock });
    } catch (error) {
      console.error('Error during backfill:', error);
      this.emit('error', { source: 'backfill', error });
    }
  }
  
  /**
   * Stop listening for Hathor blockchain events
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    // Clear intervals and timeouts
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    
    this.emit('stopped');
  }
  
  /**
   * Get the current status of the Hathor event source
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      reconnectAttempts: this.reconnectAttempts,
      lastProcessedBlock: this.lastProcessedBlock,
      enabledEvents: this.config.enabledEvents,
      network: this.config.network
    };
  }
}
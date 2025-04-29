import { Connection, PublicKey } from '@solana/web3.js';
import { BlockchainAdapter, ConnectionConfig, NFTData, QueryOptions, Transaction, EventType, EventFilters, EventCallback, Subscription, TransactionStatus, NetworkStatus } from './BlockchainAdapter';
import { BlockchainResponse } from './BlockchainInterface';

/**
 * Solana-specific implementation of the BlockchainAdapter interface
 */
export class SolanaAdapter implements BlockchainAdapter {
  private connection: Connection | null = null;
  private config: ConnectionConfig | null = null;

  /**
   * Establishes connection to the Solana network
   */
  async connect(config: ConnectionConfig): Promise<void> {
    try {
      this.connection = new Connection(config.endpoint, {
        commitment: 'confirmed',
        timeout: config.timeout || 30000
      });
      this.config = config;
      await this.connection.getVersion();
    } catch (error) {
      throw new Error(`Failed to connect to Solana network: ${error.message}`);
    }
  }

  /**
   * Retrieves NFT metadata from Solana network
   */
  async getNFTData(contractAddress: string, tokenId: string): Promise<NFTData> {
    if (!this.connection) throw new Error('Not connected to Solana network');

    try {
      const mintPubkey = new PublicKey(tokenId);
      const accountInfo = await this.connection.getParsedAccountInfo(mintPubkey);
      
      if (!accountInfo.value) {
        throw new Error('NFT not found');
      }

      // Parse metadata account data
      const metadata = accountInfo.value.data;
      const owner = accountInfo.value.owner.toBase58();

      return {
        tokenId,
        contractAddress,
        owner,
        metadata,
        createdAt: new Date(),
        lastTransferAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to fetch NFT data: ${error.message}`);
    }
  }

  /**
   * Fetches transaction history for an NFT
   */
  async getTransactionHistory(contractAddress: string, tokenId: string, options?: QueryOptions): Promise<Transaction[]> {
    if (!this.connection) throw new Error('Not connected to Solana network');

    try {
      const mintPubkey = new PublicKey(tokenId);
      const signatures = await this.connection.getSignaturesForAddress(
        mintPubkey,
        { limit: options?.limit || 100 }
      );

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection!.getTransaction(sig.signature);
          return {
            hash: sig.signature,
            from: tx?.transaction.message.accountKeys[0].toBase58() || '',
            to: tx?.transaction.message.accountKeys[1].toBase58() || '',
            timestamp: new Date(sig.blockTime! * 1000),
            value: tx?.meta?.fee.toString(),
            type: 'Transfer' as const,
            status: sig.confirmationStatus === 'finalized' ? TransactionStatus.Confirmed : TransactionStatus.Pending
          };
        })
      );

      return transactions;
    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  /**
   * Subscribes to NFT-related events
   */
  async subscribeToEvents(eventType: EventType, filters: EventFilters, callback: EventCallback): Promise<Subscription> {
    if (!this.connection) throw new Error('Not connected to Solana network');

    try {
      const accountPubkey = new PublicKey(filters.tokenId!);
      const subscriptionId = this.connection.onAccountChange(
        accountPubkey,
        (accountInfo) => {
          callback({
            type: eventType,
            accountInfo,
            timestamp: new Date()
          });
        }
      );

      return {
        unsubscribe: () => {
          this.connection?.removeAccountChangeListener(subscriptionId);
        },
        isActive: true
      };
    } catch (error) {
      throw new Error(`Failed to subscribe to events: ${error.message}`);
    }
  }

  /**
   * Validates a transaction
   */
  async validateTransaction(txHash: string): Promise<TransactionStatus> {
    if (!this.connection) throw new Error('Not connected to Solana network');

    try {
      const status = await this.connection.getSignatureStatus(txHash);
      
      if (!status?.value) return TransactionStatus.Failed;
      
      switch (status.value.confirmationStatus) {
        case 'finalized':
          return TransactionStatus.Confirmed;
        case 'processed':
        case 'confirmed':
          return TransactionStatus.Pending;
        default:
          return TransactionStatus.Failed;
      }
    } catch (error) {
      throw new Error(`Failed to validate transaction: ${error.message}`);
    }
  }

  /**
   * Retrieves current network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    if (!this.connection) throw new Error('Not connected to Solana network');

    try {
      const [version, slot, health] = await Promise.all([
        this.connection.getVersion(),
        this.connection.getSlot(),
        this.connection.getHealth()
      ]);

      return {
        isConnected: health === 'ok',
        latestBlock: slot,
        peers: version?.['feature-set'] || 0,
        syncStatus: true
      };
    } catch (error) {
      throw new Error(`Failed to get network status: ${error.message}`);
    }
  }
}
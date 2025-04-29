import * as fcl from '@onflow/fcl';
import { BlockchainAdapter, ConnectionConfig, NFTData, QueryOptions, Transaction, EventType, EventFilters, EventCallback, Subscription, TransactionStatus, NetworkStatus } from './BlockchainAdapter';

/**
 * Flow-specific implementation of the BlockchainAdapter interface
 */
export class FlowAdapter implements BlockchainAdapter {
  private config: ConnectionConfig | null = null;

  /**
   * Establishes connection to the Flow network
   */
  async connect(config: ConnectionConfig): Promise<void> {
    try {
      fcl.config()
        .put('accessNode.api', config.endpoint)
        .put('flow.network', 'mainnet')
        .put('app.detail.title', 'NFT TrustScore')
        .put('app.detail.icon', 'https://placekitten.com/g/200/200');

      if (config.apiKey) {
        fcl.config().put('flow.appKey', config.apiKey);
      }

      this.config = config;
    } catch (error) {
      throw new Error(`Failed to connect to Flow network: ${error.message}`);
    }
  }

  /**
   * Retrieves NFT metadata from Flow network
   */
  async getNFTData(contractAddress: string, tokenId: string): Promise<NFTData> {
    try {
      const script = `
        import NonFungibleToken from 0x1d7e57aa55817448
        import MetadataViews from 0x1d7e57aa55817448

        pub fun main(address: Address, tokenId: UInt64): {String: AnyStruct} {
          let account = getAccount(address)
          let collection = account
            .getCapability(MetadataViews.getNFTCollectionData())
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not borrow collection public reference")

          let nft = collection.borrowNFT(id: tokenId)
          let view = nft.resolveView(Type<MetadataViews.NFTView>())
            ?? panic("Could not resolve NFT view")

          return {
            "id": tokenId,
            "owner": address,
            "metadata": view.display,
            "collection": view.collectionData
          }
        }
      `;

      const response = await fcl.query({
        cadence: script,
        args: (arg, t) => [
          arg(contractAddress, t.Address),
          arg(tokenId, t.UInt64)
        ]
      });

      return {
        tokenId,
        contractAddress,
        owner: response.owner,
        metadata: response,
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
    try {
      const script = `
        import NonFungibleToken from 0x1d7e57aa55817448

        pub fun main(address: Address, tokenId: UInt64): [AnyStruct] {
          let events = getEvents("A.${contractAddress}.Transfer", timeRange: nil)
          return events.filter(fun (event: AnyStruct): Bool {
            return event.tokenId == tokenId
          })
        }
      `;

      const events = await fcl.query({
        cadence: script,
        args: (arg, t) => [
          arg(contractAddress, t.Address),
          arg(tokenId, t.UInt64)
        ]
      });

      return events.map((event: any) => ({
        hash: event.transactionId,
        from: event.from,
        to: event.to,
        timestamp: new Date(event.timestamp),
        value: event.value,
        type: 'Transfer' as const,
        status: TransactionStatus.Confirmed
      }));
    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  /**
   * Subscribes to NFT-related events
   */
  async subscribeToEvents(eventType: EventType, filters: EventFilters, callback: EventCallback): Promise<Subscription> {
    try {
      const eventKey = `A.${filters.contractAddress}.${eventType}`;
      const unsubscribe = fcl.events(eventKey).subscribe((event) => {
        if (filters.tokenId && event.tokenId !== filters.tokenId) return;
        callback(event);
      });

      return {
        unsubscribe: () => {
          unsubscribe();
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
    try {
      const tx = await fcl.tx(txHash).onceSealed();
      return tx.status === 4 ? TransactionStatus.Confirmed : TransactionStatus.Failed;
    } catch (error) {
      throw new Error(`Failed to validate transaction: ${error.message}`);
    }
  }

  /**
   * Retrieves current network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const block = await fcl.block();
      const sporks = await fcl.config().get('flow.sporks');

      return {
        isConnected: true,
        latestBlock: block.height,
        peers: sporks?.length || 0,
        syncStatus: true
      };
    } catch (error) {
      throw new Error(`Failed to get network status: ${error.message}`);
    }
  }
}
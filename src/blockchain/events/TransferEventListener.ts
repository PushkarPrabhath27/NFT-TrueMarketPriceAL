import { Contract } from '@ethersproject/contracts';
import { BaseEventListener, EventConfig, EventData } from './BaseEventListener';

interface TransferEventData extends EventData {
  data: {
    tokenId: string;
    from: string;
    to: string;
    amount?: string;
    tokenAddress: string;
    standard: 'ERC721' | 'ERC1155';
  };
}

export class TransferEventListener extends BaseEventListener {
  private contracts: Map<string, Contract>;
  private readonly ERC721_TRANSFER_EVENT = 'Transfer(address,address,uint256)';
  private readonly ERC1155_TRANSFER_SINGLE_EVENT = 'TransferSingle(address,address,address,uint256,uint256)';
  private readonly ERC1155_TRANSFER_BATCH_EVENT = 'TransferBatch(address,address,address,uint256[],uint256[])';

  constructor(config: EventConfig) {
    super(config);
    this.contracts = new Map();
  }

  public async addContract(address: string, standard: 'ERC721' | 'ERC1155'): Promise<void> {
    if (this.contracts.has(address)) return;

    const abi = standard === 'ERC721' ? [
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    ] : [
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
    ];

    const contract = new Contract(address, abi, this.provider);
    this.contracts.set(address, contract);

    if (this.isListening) {
      await this.subscribeToContractEvents(contract, standard);
    }
  }

  protected async startListening(): Promise<void> {
    for (const [address, contract] of this.contracts) {
      const standard = this.detectStandard(contract);
      await this.subscribeToContractEvents(contract, standard);
    }
  }

  protected async stopListening(): Promise<void> {
    for (const contract of this.contracts.values()) {
      contract.removeAllListeners();
    }
  }

  private detectStandard(contract: Contract): 'ERC721' | 'ERC1155' {
    const events = contract.interface.events;
    return events[this.ERC721_TRANSFER_EVENT] ? 'ERC721' : 'ERC1155';
  }

  private async subscribeToContractEvents(contract: Contract, standard: 'ERC721' | 'ERC1155'): Promise<void> {
    if (standard === 'ERC721') {
      contract.on('Transfer', (from, to, tokenId, event) => {
        const eventData: TransferEventData = {
          eventType: 'Transfer',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            tokenId: tokenId.toString(),
            from,
            to,
            tokenAddress: contract.address,
            standard: 'ERC721'
          }
        };
        this.processEvent(eventData);
      });
    } else {
      contract.on('TransferSingle', (operator, from, to, id, value, event) => {
        const eventData: TransferEventData = {
          eventType: 'TransferSingle',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Math.floor(Date.now() / 1000),
          data: {
            tokenId: id.toString(),
            from,
            to,
            amount: value.toString(),
            tokenAddress: contract.address,
            standard: 'ERC1155'
          }
        };
        this.processEvent(eventData);
      });

      contract.on('TransferBatch', (operator, from, to, ids, values, event) => {
        ids.forEach((id, index) => {
          const eventData: TransferEventData = {
            eventType: 'TransferBatch',
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Math.floor(Date.now() / 1000),
            data: {
              tokenId: id.toString(),
              from,
              to,
              amount: values[index].toString(),
              tokenAddress: contract.address,
              standard: 'ERC1155'
            }
          };
          this.processEvent(eventData);
        });
      });
    }
  }

  protected async handleEvent(eventData: TransferEventData): Promise<void> {
    // Implement specific transfer event handling logic
    this.emit('transfer', eventData);
  }
}
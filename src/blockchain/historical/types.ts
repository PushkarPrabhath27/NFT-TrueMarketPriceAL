export interface BlockRange {
    start: number;
    end: number;
}

export interface NFTEvent {
    type: 'transfer' | 'mint' | 'marketplace' | 'metadata' | 'collection';
    blockNumber: number;
    transactionHash: string;
    timestamp: number;
    contractAddress: string;
    tokenId: string;
    data: Record<string, any>;
}

export interface TransferEvent extends NFTEvent {
    type: 'transfer';
    data: {
        from: string;
        to: string;
        tokenId: string;
    };
}

export interface MintEvent extends NFTEvent {
    type: 'mint';
    data: {
        to: string;
        tokenId: string;
        metadata?: Record<string, any>;
    };
}

export interface MarketplaceEvent extends NFTEvent {
    type: 'marketplace';
    data: {
        eventType: 'list' | 'bid' | 'sale' | 'cancel';
        seller?: string;
        buyer?: string;
        price?: string;
        currency?: string;
    };
}

export interface MetadataEvent extends NFTEvent {
    type: 'metadata';
    data: {
        oldMetadata?: Record<string, any>;
        newMetadata?: Record<string, any>;
        updateType: 'reveal' | 'update';
    };
}

export interface CollectionEvent extends NFTEvent {
    type: 'collection';
    data: {
        eventType: 'airdrop' | 'burn' | 'pause' | 'unpause';
        affected: string[];
        metadata?: Record<string, any>;
    };
}

export interface ExtractionProgress {
    currentBlock: number;
    totalBlocks: number;
    completedChunks: number;
    totalChunks: number;
    status: 'idle' | 'running' | 'completed' | 'failed';
}
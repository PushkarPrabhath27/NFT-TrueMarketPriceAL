/**
 * DataExtractionTargets.ts
 * Configuration for NFT data extraction targets including contract standards,
 * marketplaces, and collection discovery mechanisms
 */

/**
 * NFT Contract Standards to monitor
 */
export const NFT_STANDARDS = {
  // Ethereum-based standards
  ERC721: {
    name: 'ERC-721',
    interfaceId: '0x80ac58cd',
    supportedNetworks: ['ethereum', 'polygon'],
    transferEventSignature: 'Transfer(address,address,uint256)',
    transferEventTopic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  },
  ERC1155: {
    name: 'ERC-1155',
    interfaceId: '0xd9b67a26',
    supportedNetworks: ['ethereum', 'polygon'],
    transferSingleEventSignature: 'TransferSingle(address,address,address,uint256,uint256)',
    transferSingleEventTopic: '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
    transferBatchEventSignature: 'TransferBatch(address,address,address,uint256[],uint256[])',
    transferBatchEventTopic: '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'
  },
  // Solana NFT standard
  METAPLEX: {
    name: 'Metaplex',
    supportedNetworks: ['solana'],
    programIds: [
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s', // Token Metadata Program
      'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98'  // Metaplex Program
    ]
  },
  // Flow NFT standard
  FLOW_NFT: {
    name: 'Flow NFT',
    supportedNetworks: ['flow'],
    interfaceId: 'A.1654653399040a61.FlowToken',
    transferEventName: 'Deposit'
  }
};

/**
 * Major NFT marketplaces to track
 */
export const NFT_MARKETPLACES = {
  // Ethereum-based marketplaces
  OPENSEA: {
    name: 'OpenSea',
    supportedNetworks: ['ethereum', 'polygon'],
    contracts: {
      ethereum: [
        {
          address: '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b', // Wyvern Exchange v1
          saleEventSignatures: ['OrdersMatched(bytes32,bytes32,address,address,uint256,bytes32)']
        },
        {
          address: '0x7f268357a8c2552623316e2562d90e642bb538e5', // Wyvern Exchange v2
          saleEventSignatures: ['OrdersMatched(bytes32,bytes32,address,address,uint256,bytes32)']
        },
        {
          address: '0x00000000006c3852cbef3e08e8df289169ede581', // Seaport 1.1
          saleEventSignatures: ['OrderFulfilled(bytes32,address,address,address,(uint8,address,uint256,uint256)[],(uint8,address,uint256,uint256,address)[])']
        },
        {
          address: '0x00000000000001ad428e4906ae43d8f9852d0dd6', // Seaport 1.4
          saleEventSignatures: ['OrderFulfilled(bytes32,address,address,address,(uint8,address,uint256,uint256)[],(uint8,address,uint256,uint256,address)[])']
        }
      ],
      polygon: [
        {
          address: '0x58807bad0b376efc12f5ad86aac70e78ed67deae', // Seaport 1.1
          saleEventSignatures: ['OrderFulfilled(bytes32,address,address,address,(uint8,address,uint256,uint256)[],(uint8,address,uint256,uint256,address)[])']
        }
      ]
    }
  },
  BLUR: {
    name: 'Blur',
    supportedNetworks: ['ethereum'],
    contracts: {
      ethereum: [
        {
          address: '0x000000000000ad05ccc4f10045630fb830b95127', // Blur Exchange
          saleEventSignatures: ['OrdersMatched(address,address,bytes32,bytes32)']
        }
      ]
    }
  },
  LOOKSRARE: {
    name: 'LooksRare',
    supportedNetworks: ['ethereum'],
    contracts: {
      ethereum: [
        {
          address: '0x59728544b08ab483533076417fbbb2fd0b17ce3a', // LooksRare Exchange
          saleEventSignatures: ['TakerAsk(bytes32,uint256,address,address,address,address,uint256,uint256)']
        }
      ]
    }
  },
  X2Y2: {
    name: 'X2Y2',
    supportedNetworks: ['ethereum'],
    contracts: {
      ethereum: [
        {
          address: '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3', // X2Y2 Exchange
          saleEventSignatures: ['EvInventoryUpdated(bytes32,address,address,uint256,uint256,uint256)']
        }
      ]
    }
  },
  MAGICEDEN: {
    name: 'Magic Eden',
    supportedNetworks: ['solana'],
    programIds: ['M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K']
  }
};

/**
 * Configuration for collection discovery and prioritization
 */
export const COLLECTION_DISCOVERY_CONFIG = {
  // Criteria for prioritizing collections for historical data extraction
  prioritizationCriteria: {
    minDailyVolume: 1, // ETH
    minTotalVolume: 10, // ETH
    minHolders: 100,
    minTransactions: 500,
    minAge: 7 // days
  },
  
  // Popular collections to prioritize for initial data extraction
  popularCollections: {
    ethereum: [
      {
        name: 'Bored Ape Yacht Club',
        address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        standard: 'ERC721',
        priority: 1
      },
      {
        name: 'CryptoPunks',
        address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
        standard: 'ERC721',
        priority: 1
      },
      {
        name: 'Azuki',
        address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
        standard: 'ERC721',
        priority: 2
      },
      {
        name: 'Doodles',
        address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
        standard: 'ERC721',
        priority: 2
      },
      {
        name: 'Moonbirds',
        address: '0x23581767a106ae21c074b2276d25e5c3e136a68b',
        standard: 'ERC721',
        priority: 2
      }
    ],
    polygon: [
      {
        name: 'Aavegotchi',
        address: '0x86935f11c86623dec8a25696e1c19a8659cbf95d',
        standard: 'ERC721',
        priority: 1
      }
    ],
    solana: [
      {
        name: 'DeGods',
        address: 'DeDxhPYQj3BvxgFwEsmJMgpYBA7ebxMpgxbKJPLvNFn4',
        priority: 1
      },
      {
        name: 'Okay Bears',
        address: '3saAedkM9o5g1u5DCqsuMZuC4GRqPe4tGnuJA1PJLDiG',
        priority: 1
      }
    ]
  },
  
  // Dynamic discovery configuration
  dynamicDiscovery: {
    // How often to update the list of collections to monitor (in milliseconds)
    updateInterval: 86400000, // 24 hours
    
    // Maximum number of collections to actively monitor
    maxActiveCollections: 1000,
    
    // Minimum volume threshold for automatic discovery (in ETH)
    volumeThreshold: 0.5,
    
    // Data sources for discovering new collections
    dataSources: [
      {
        name: 'OpenSea API',
        endpoint: 'https://api.opensea.io/api/v1/collections',
        priority: 1
      },
      {
        name: 'LooksRare API',
        endpoint: 'https://api.looksrare.org/api/v1/collections',
        priority: 2
      },
      {
        name: 'Blur API',
        endpoint: 'https://core-api.blur.io/v1/collections',
        priority: 2
      }
    ]
  }
};
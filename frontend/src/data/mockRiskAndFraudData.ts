// Mock data for Risk Assessment and Fraud Detection components

// Risk Radar Chart Data
export const mockRiskDimensions = [
  { name: 'Market Volatility', value: 65, maxValue: 100, description: 'Measures the price stability and trading volume consistency' },
  { name: 'Creator Reputation', value: 25, maxValue: 100, description: 'Evaluates the track record and reliability of the NFT creator' },
  { name: 'Smart Contract', value: 15, maxValue: 100, description: 'Assesses vulnerabilities and security of the underlying contract' },
  { name: 'Liquidity', value: 45, maxValue: 100, description: 'Measures how easily the NFT can be bought or sold' },
  { name: 'Ownership Concentration', value: 70, maxValue: 100, description: 'Evaluates if ownership is concentrated among few wallets' },
  { name: 'Community Engagement', value: 30, maxValue: 100, description: 'Measures active participation and growth of the community' },
];

// Risk Evolution Data
export const mockRiskHistoricalData = [
  {
    date: '2023-01-01',
    overallRisk: 45,
    factors: [
      { name: 'Market Volatility', value: 50 },
      { name: 'Creator Reputation', value: 30 },
      { name: 'Smart Contract', value: 20 },
      { name: 'Liquidity', value: 40 },
      { name: 'Ownership Concentration', value: 60 },
      { name: 'Community Engagement', value: 40 },
    ],
    events: [
      {
        date: '2023-01-05',
        description: 'Collection launch with high initial demand',
        impact: 'positive' as const
      }
    ]
  },
  {
    date: '2023-02-01',
    overallRisk: 50,
    factors: [
      { name: 'Market Volatility', value: 55 },
      { name: 'Creator Reputation', value: 30 },
      { name: 'Smart Contract', value: 20 },
      { name: 'Liquidity', value: 45 },
      { name: 'Ownership Concentration', value: 65 },
      { name: 'Community Engagement', value: 35 },
    ],
    events: [
      {
        date: '2023-02-15',
        description: 'Market-wide NFT downturn affecting prices',
        impact: 'negative' as const
      }
    ]
  },
  {
    date: '2023-03-01',
    overallRisk: 55,
    factors: [
      { name: 'Market Volatility', value: 60 },
      { name: 'Creator Reputation', value: 28 },
      { name: 'Smart Contract', value: 18 },
      { name: 'Liquidity', value: 48 },
      { name: 'Ownership Concentration', value: 68 },
      { name: 'Community Engagement', value: 32 },
    ]
  },
  {
    date: '2023-04-01',
    overallRisk: 60,
    factors: [
      { name: 'Market Volatility', value: 65 },
      { name: 'Creator Reputation', value: 25 },
      { name: 'Smart Contract', value: 15 },
      { name: 'Liquidity', value: 45 },
      { name: 'Ownership Concentration', value: 70 },
      { name: 'Community Engagement', value: 30 },
    ],
    events: [
      {
        date: '2023-04-10',
        description: 'Creator announced delay in roadmap delivery',
        impact: 'negative' as const
      }
    ]
  },
  {
    date: '2023-05-01',
    overallRisk: 58,
    factors: [
      { name: 'Market Volatility', value: 63 },
      { name: 'Creator Reputation', value: 26 },
      { name: 'Smart Contract', value: 15 },
      { name: 'Liquidity', value: 44 },
      { name: 'Ownership Concentration', value: 68 },
      { name: 'Community Engagement', value: 32 },
    ]
  },
  {
    date: '2023-06-01',
    overallRisk: 55,
    factors: [
      { name: 'Market Volatility', value: 60 },
      { name: 'Creator Reputation', value: 28 },
      { name: 'Smart Contract', value: 15 },
      { name: 'Liquidity', value: 42 },
      { name: 'Ownership Concentration', value: 65 },
      { name: 'Community Engagement', value: 35 },
    ],
    events: [
      {
        date: '2023-06-20',
        description: 'New utility features added to the collection',
        impact: 'positive' as const
      }
    ]
  },
];

// Fraud Detection Data
export const mockFraudIndicators = [
  {
    id: 'fraud-001',
    type: 'image_similarity' as const,
    title: 'High similarity with existing NFT artwork',
    description: 'This NFT shows 87% visual similarity with artwork from another collection.',
    severity: 'high' as const,
    evidence: [
      {
        description: 'Visual comparison with similar NFTs',
        data: [
          'https://via.placeholder.com/300x300?text=Current+NFT',
          'https://via.placeholder.com/300x300?text=Similar+NFT+1',
          'https://via.placeholder.com/300x300?text=Similar+NFT+2'
        ]
      },
      {
        description: 'Similarity detection algorithm results',
        data: 'Perceptual hash similarity: 87%, Color distribution match: 92%, Feature point matching: High'
      }
    ],
    timestamp: '2023-04-15 14:32:45',
    status: 'active' as const
  },
  {
    id: 'fraud-002',
    type: 'wash_trading' as const,
    title: 'Suspicious trading pattern detected',
    description: 'Circular trading pattern identified between related wallets to artificially inflate value.',
    severity: 'critical' as const,
    evidence: [
      {
        description: 'Transaction history showing circular pattern',
        data: [
          { hash: '0x1a2b3c4d5e6f', from: '0xA1B2C3', to: '0xD4E5F6', price: 0.5, timestamp: '2023-03-10 09:15:22' },
          { hash: '0x2b3c4d5e6f7', from: '0xD4E5F6', to: '0xG7H8I9', price: 0.6, timestamp: '2023-03-10 14:22:45' },
          { hash: '0x3c4d5e6f7g8', from: '0xG7H8I9', to: '0xA1B2C3', price: 0.7, timestamp: '2023-03-11 10:05:17' }
        ]
      },
      {
        description: 'Wallet relationship analysis',
        data: 'Wallets involved in the circular trading pattern show strong connections through previous transactions and shared funding sources.'
      }
    ],
    timestamp: '2023-03-12 08:45:30',
    status: 'investigating' as const
  },
  {
    id: 'fraud-003',
    type: 'metadata_validation' as const,
    title: 'Metadata inconsistency',
    description: 'The on-chain metadata does not match the marketplace display information.',
    severity: 'medium' as const,
    evidence: [
      {
        description: 'Metadata comparison',
        data: 'On-chain metadata shows different creator address and royalty information than what is displayed on the marketplace.'
      }
    ],
    timestamp: '2023-05-02 16:20:15',
    status: 'resolved' as const
  },
  {
    id: 'fraud-004',
    type: 'suspicious_pattern' as const,
    title: 'Abnormal price increase',
    description: 'Sudden 500% price increase without corresponding market activity or news.',
    severity: 'high' as const,
    evidence: [
      {
        description: 'Price history analysis',
        data: 'Price jumped from 0.2 ETH to 1.2 ETH within 24 hours with minimal trading volume and no significant news or events.'
      },
      {
        description: 'Market comparison',
        data: 'Similar NFTs in the same collection showed stable prices during the same period.'
      }
    ],
    timestamp: '2023-05-20 11:10:05',
    status: 'active' as const
  },
  {
    id: 'fraud-005',
    type: 'image_similarity' as const,
    title: 'Potential unauthorized derivative',
    description: 'This NFT appears to be an unauthorized derivative of a popular collection.',
    severity: 'medium' as const,
    evidence: [
      {
        description: 'Style and theme comparison',
        data: [
          'https://via.placeholder.com/300x300?text=Current+NFT',
          'https://via.placeholder.com/300x300?text=Original+Collection'
        ]
      }
    ],
    timestamp: '2023-06-05 09:30:45',
    status: 'investigating' as const
  },
];
// Mock data for NFT Analysis Dashboard

export const mockNftData = {
  id: 'nft123456',
  name: 'Bored Ape #7890',
  collection: 'Bored Ape Yacht Club',
  creator: 'Yuga Labs',
  trustScore: 87,
  confidence: 92,
  factors: [
    { name: 'Creator Reputation', score: 95, weight: 0.25 },
    { name: 'Collection Performance', score: 88, weight: 0.2 },
    { name: 'Ownership History', score: 82, weight: 0.15 },
    { name: 'Metadata Integrity', score: 90, weight: 0.15 },
    { name: 'Market Liquidity', score: 78, weight: 0.15 },
    { name: 'Smart Contract Security', score: 85, weight: 0.1 },
  ],
  history: [
    { date: '2023-01-01', score: 82 },
    { date: '2023-02-01', score: 83 },
    { date: '2023-03-01', score: 85 },
    { date: '2023-04-01', score: 84 },
    { date: '2023-05-01', score: 86 },
    { date: '2023-06-01', score: 87 },
  ],
  collectionComparison: [
    { name: 'This NFT', score: 87 },
    { name: 'Collection Average', score: 82 },
    { name: 'Top 10% in Collection', score: 92 },
    { name: 'Bottom 10% in Collection', score: 68 },
  ],
  strengths: [
    { title: 'Strong Creator Reputation', description: 'Creator has a proven track record of successful projects' },
    { title: 'High Metadata Integrity', description: 'All metadata is properly stored and verifiable on-chain' },
    { title: 'Positive Ownership History', description: 'Clean ownership history with no suspicious transfers' },
  ],
  concerns: [
    { title: 'Moderate Market Liquidity', description: 'Trading volume has decreased in the past month' },
  ],
  priceData: {
    currentPrice: 78.5,
    currency: 'ETH',
    fairValueEstimate: 82.3,
    confidenceBands: {
      upper: 88.1,
      lower: 76.5,
    },
    history: [
      { date: '2023-01-01', price: 65.2 },
      { date: '2023-02-01', price: 70.8 },
      { date: '2023-03-01', price: 68.5 },
      { date: '2023-04-01', price: 72.3 },
      { date: '2023-05-01', price: 75.1 },
      { date: '2023-06-01', price: 78.5 },
    ],
    keyEvents: [
      { date: '2023-02-15', event: 'Collection Upgrade', impact: 'positive' },
      { date: '2023-04-10', event: 'Marketplace Integration', impact: 'positive' },
    ],
  },
  pricePrediction: {
    oneMonth: { estimate: 83.7, upper: 89.2, lower: 78.1 },
    threeMonths: { estimate: 92.4, upper: 102.8, lower: 82.0 },
    sixMonths: { estimate: 105.8, upper: 125.3, lower: 86.2 },
  },
  comparativePricing: [
    { name: 'This NFT', price: 78.5 },
    { name: 'Collection Floor', price: 65.2 },
    { name: 'Collection Average', price: 82.7 },
    { name: 'Similar Trait NFTs', price: 80.1 },
  ],
  riskAssessment: {
    overallRisk: 'Low',
    factors: [
      { name: 'Market Volatility', level: 'Medium', score: 65 },
      { name: 'Liquidity Risk', level: 'Low', score: 82 },
      { name: 'Technical Risk', level: 'Very Low', score: 90 },
      { name: 'Regulatory Risk', level: 'Low', score: 78 },
    ],
    history: {
      'Market Volatility': [
        { date: '2023-01-01', value: 72 },
        { date: '2023-02-01', value: 70 },
        { date: '2023-03-01', value: 68 },
        { date: '2023-04-01', value: 67 },
        { date: '2023-05-01', value: 66 },
        { date: '2023-06-01', value: 65 },
      ],
      'Liquidity Risk': [
        { date: '2023-01-01', value: 88 },
        { date: '2023-02-01', value: 86 },
        { date: '2023-03-01', value: 85 },
        { date: '2023-04-01', value: 84 },
        { date: '2023-05-01', value: 83 },
        { date: '2023-06-01', value: 82 },
      ],
      'Technical Risk': [
        { date: '2023-01-01', value: 82 },
        { date: '2023-02-01', value: 84 },
        { date: '2023-03-01', value: 86 },
        { date: '2023-04-01', value: 88 },
        { date: '2023-05-01', value: 89 },
        { date: '2023-06-01', value: 90 },
      ],
      'Regulatory Risk': [
        { date: '2023-01-01', value: 75 },
        { date: '2023-02-01', value: 76 },
        { date: '2023-03-01', value: 78 },
        { date: '2023-04-01', value: 79 },
        { date: '2023-05-01', value: 80 },
        { date: '2023-06-01', value: 78 },
      ],
    },
  },
  fraudDetection: {
    suspiciousActivity: false,
    imageSimilarity: {
      similarImages: 0,
      confidence: 98,
    },
    washTrading: {
      detected: false,
      confidence: 95,
    },
    metadataValidation: {
      valid: true,
      issues: [],
    },
  },
};

// More mock data can be added as needed for different NFTs, collections, etc.
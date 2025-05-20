import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, Typography } from '@mui/material';
import CollectionOverview from './CollectionOverview';
import CreatorProfile from './CreatorProfile';
import MarketSegments from './MarketSegments';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      style={{ width: '100%', height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box 
          sx={{ 
            p: 3,
            height: '100%',
            overflow: 'auto',
            bgcolor: 'background.default'
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

// Mock data for demonstration
const mockCollectionData = {
  collectionName: 'Bored Ape Yacht Club',
  description: 'A collection of 10,000 unique Bored Ape NFTs living on the Ethereum blockchain.',
  stats: {
    floorPrice: 30.5,
    floorPriceChange: 2.5,
    volume24h: 150.75,
    volumeChange: 15.2,
    holders: 6000,
    holdersChange: 1.8,
    listings: 450,
    listingsChange: -5.2,
    averagePrice: 35.2,
    averagePriceChange: 3.1,
  },
  trustScore: 85,
  riskLevel: 'Low' as const,
  marketMetrics: [
    {
      label: 'Market Liquidity',
      value: 82,
      change: 5.3,
      info: 'Measures how easily NFTs can be bought and sold without significant price impact',
    },
    {
      label: 'Price Stability',
      value: 75,
      change: -2.1,
      info: 'Indicates the consistency of prices over time',
    },
    {
      label: 'Trading Activity',
      value: 88,
      change: 7.5,
      info: 'Reflects the frequency and volume of trades',
    },
  ],
  volumeHistory: [
    { date: '2023-09-01', volume: 120 },
    { date: '2023-09-02', volume: 145 },
    { date: '2023-09-03', volume: 135 },
    { date: '2023-09-04', volume: 160 },
    { date: '2023-09-05', volume: 150 },
  ],
};

const mockCreatorData = {
  creatorName: 'Yuga Labs',
  avatarUrl: 'https://via.placeholder.com/150',
  bio: 'Leading NFT creator and innovator in the Web3 space.',
  verified: true,
  joinDate: '2021-04-23',
  stats: {
    totalSales: 15000,
    totalVolume: 450000,
    averagePrice: 30,
    uniqueCollectors: 8500,
    successfulProjects: 5,
    reputationScore: 92,
  },
  socialMetrics: [
    {
      platform: 'Twitter',
      followers: 250000,
      engagement: 8.5,
      verified: true,
    },
    {
      platform: 'Instagram',
      followers: 180000,
      engagement: 6.2,
      verified: true,
    },
  ],
  history: [
    { date: '2023-09-01', value: 1200, projects: 3 },
    { date: '2023-09-02', value: 1500, projects: 3 },
    { date: '2023-09-03', value: 1350, projects: 4 },
    { date: '2023-09-04', value: 1600, projects: 4 },
    { date: '2023-09-05', value: 1450, projects: 5 },
  ],
  expertise: [
    { skill: 'Digital Art', level: 95 },
    { skill: 'Smart Contracts', level: 88 },
    { skill: 'Community Management', level: 90 },
  ],
  achievements: [
    {
      title: 'Top Creator 2023',
      description: 'Recognized as one of the top NFT creators of the year',
      date: '2023-06-15',
    },
    {
      title: '$100M in Sales',
      description: 'Reached $100 million in total sales volume',
      date: '2023-04-10',
    },
  ],
};

const mockMarketData = {
  segments: [
    {
      name: 'Premium',
      marketShare: 35,
      growth: 12.5,
      averagePrice: 50,
      volume: 2500,
      trustScore: 90,
      riskLevel: 'Low' as const,
    },
    {
      name: 'Mid-Range',
      marketShare: 45,
      growth: 8.2,
      averagePrice: 25,
      volume: 3500,
      trustScore: 82,
      riskLevel: 'Medium' as const,
    },
    {
      name: 'Entry-Level',
      marketShare: 20,
      growth: -5.3,
      averagePrice: 10,
      volume: 1500,
      trustScore: 75,
      riskLevel: 'High' as const,
    },
  ],
  competitiveMetrics: [
    {
      category: 'Brand Recognition',
      value: 85,
      benchmark: 70,
      description: 'Measures brand awareness and recognition in the market',
    },
    {
      category: 'Market Share',
      value: 75,
      benchmark: 65,
      description: 'Percentage of total market volume',
    },
    {
      category: 'Innovation',
      value: 90,
      benchmark: 60,
      description: 'Level of technical and creative innovation',
    },
    {
      category: 'Community',
      value: 88,
      benchmark: 72,
      description: 'Strength and engagement of the community',
    },
  ],
  marketTrends: [
    {
      trend: 'Rising Demand for Utility NFTs',
      impact: 'Positive' as const,
      description: 'Increasing interest in NFTs with real-world utility and benefits',
    },
    {
      trend: 'Market Consolidation',
      impact: 'Neutral' as const,
      description: 'Smaller collections being acquired or merged with larger ones',
    },
    {
      trend: 'Price Volatility',
      impact: 'Negative' as const,
      description: 'Increased price fluctuations across premium segments',
    },
  ],
};

const CollectionCreatorAnalysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analysis tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTabs-flexContainer': {
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          <Tab label="Collection Overview" sx={{ textTransform: 'none' }} />
          <Tab label="Creator Profile" sx={{ textTransform: 'none' }} />
          <Tab label="Market Segments" sx={{ textTransform: 'none' }} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <CollectionOverview {...mockCollectionData} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <CreatorProfile {...mockCreatorData} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <MarketSegments {...mockMarketData} />
      </TabPanel>
    </Paper>
  );
};

export default CollectionCreatorAnalysis;
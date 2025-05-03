import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Paper, CircularProgress, Tabs, Tab } from '@mui/material';
import TrustScoreCard from '../components/trustScore/TrustScoreCard';
import TrustFactorsBreakdown from '../components/trustScore/TrustFactorsBreakdown';
import TrustScoreHistory from '../components/trustScore/TrustScoreHistory';
import PriceChart from '../components/price/PriceChart';
import PricePrediction from '../components/price/PricePrediction';
import ComparativePricing from '../components/price/ComparativePricing';
import CollectionComparison from '../components/trustScore/CollectionComparison';
import StrengthsConcerns from '../components/trustScore/StrengthsConcerns';
import RiskProfileCard from '../components/risk/RiskProfileCard';
import RiskFactorBreakdown from '../components/risk/RiskFactorBreakdown';
import ComparativeRiskAnalysis from '../components/risk/ComparativeRiskAnalysis';
import MitigationRecommendations from '../components/risk/MitigationRecommendations';
import RiskHistoryChart from '../components/risk/RiskHistoryChart';
import { mockNftData } from '../data/mockData';

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
      id={`nft-analysis-tabpanel-${index}`}
      aria-labelledby={`nft-analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [nftData, setNftData] = useState(mockNftData);

  useEffect(() => {
    // Simulate API data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        NFT Analysis Dashboard
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Trust Score" />
          <Tab label="Price Intelligence" />
          <Tab label="Risk Assessment" />
          <Tab label="Fraud Detection" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TrustScoreCard score={nftData.trustScore} confidence={nftData.confidence} />
          </Grid>
          <Grid item xs={12} md={8}>
            <TrustFactorsBreakdown factors={nftData.factors} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TrustScoreHistory history={nftData.history} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CollectionComparison collectionData={nftData.collectionComparison} />
          </Grid>
          <Grid item xs={12}>
            <StrengthsConcerns strengths={nftData.strengths} concerns={nftData.concerns} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <PriceChart priceData={nftData.priceData} />
          </Grid>
          <Grid item xs={12} md={4}>
            <PricePrediction prediction={nftData.pricePrediction} />
          </Grid>
          <Grid item xs={12}>
            <ComparativePricing comparativeData={nftData.comparativePricing} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <RiskProfileCard 
              overallRisk={nftData.riskAssessment.overallRisk} 
              factors={nftData.riskAssessment.factors} 
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <RiskFactorBreakdown 
              factors={[
                {
                  ...nftData.riskAssessment.factors[0],
                  description: 'Measures the price fluctuation and stability of this NFT and its collection.',
                  impact: 'High volatility may indicate unpredictable future value and higher investment risk.',
                  mitigationSteps: [
                    'Consider dollar-cost averaging when purchasing',
                    'Set stop-loss thresholds for your investment',
                    'Diversify your NFT portfolio across multiple collections'
                  ],
                  historicalTrend: 'stable'
                },
                {
                  ...nftData.riskAssessment.factors[1],
                  description: 'Evaluates how easily this NFT can be bought or sold without significant price impact.',
                  impact: 'Low liquidity may result in difficulty selling the asset when needed or significant price slippage.',
                  mitigationSteps: [
                    'Focus on collections with consistent trading volume',
                    'Monitor floor price stability as an indicator of liquidity',
                    'Consider the total number of holders as a liquidity metric'
                  ],
                  historicalTrend: 'improving'
                },
                {
                  ...nftData.riskAssessment.factors[2],
                  description: 'Assesses smart contract security, metadata storage, and technical implementation.',
                  impact: 'Technical vulnerabilities could lead to loss of the asset or diminished functionality.',
                  mitigationSteps: [
                    'Verify the contract has been audited by reputable firms',
                    'Check that metadata is stored on decentralized storage',
                    'Research the development team\'s technical background'
                  ],
                  historicalTrend: 'improving'
                },
                {
                  ...nftData.riskAssessment.factors[3],
                  description: 'Evaluates exposure to regulatory changes and compliance issues.',
                  impact: 'Regulatory actions could affect tradability, value, or legal status of the NFT.',
                  mitigationSteps: [
                    'Stay informed about regulatory developments in relevant jurisdictions',
                    'Consider the compliance history of the marketplace and creator',
                    'Diversify across different types of NFT use cases'
                  ],
                  historicalTrend: 'worsening'
                }
              ]} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ComparativeRiskAnalysis 
              labels={['Market Volatility', 'Liquidity Risk', 'Technical Risk', 'Regulatory Risk', 'Creator Risk']}
              comparisonItems={[
                {
                  name: 'This NFT',
                  data: [65, 82, 90, 78, 88],
                  color: '#2196f3'
                },
                {
                  name: 'Collection Average',
                  data: [70, 75, 85, 80, 82],
                  color: '#ff9800'
                },
                {
                  name: 'Market Average',
                  data: [60, 65, 75, 70, 75],
                  color: '#f44336'
                }
              ]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <RiskHistoryChart historyData={nftData.riskAssessment.history} />
          </Grid>
          <Grid item xs={12} md={6}>
            <MitigationRecommendations 
              recommendations={[
                {
                  id: 'rec1',
                  title: 'Set up price alerts',
                  description: 'Configure alerts for significant price movements to help manage market volatility risk.',
                  impact: 'medium',
                  effort: 'low',
                  implemented: false,
                  actionLink: '#'
                },
                {
                  id: 'rec2',
                  title: 'Verify contract audit status',
                  description: 'Check if the smart contract has been audited by a reputable security firm to reduce technical risk.',
                  impact: 'high',
                  effort: 'medium',
                  implemented: true
                },
                {
                  id: 'rec3',
                  title: 'Diversify NFT portfolio',
                  description: 'Spread investment across multiple collections and asset types to mitigate collection-specific risks.',
                  impact: 'high',
                  effort: 'high',
                  implemented: false
                },
                {
                  id: 'rec4',
                  title: 'Monitor regulatory developments',
                  description: 'Stay informed about NFT regulations in relevant jurisdictions to anticipate regulatory impacts.',
                  impact: 'medium',
                  effort: 'medium',
                  implemented: false,
                  actionLink: '#'
                }
              ]}
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6">
          Fraud Detection features will be implemented in the next phase.
        </Typography>
      </TabPanel>
    </Box>
  );
}

export default Dashboard;
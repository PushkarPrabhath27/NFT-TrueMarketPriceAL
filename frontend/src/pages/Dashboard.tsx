import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Paper, CircularProgress, Tabs, Tab, Alert } from '@mui/material';
import TrustScoreCard from '../components/trustScore/TrustScoreCard.tsx';
import TrustFactorsBreakdown from '../components/trustScore/TrustFactorsBreakdown.tsx';
import TrustScoreHistory from '../components/trustScore/TrustScoreHistory.tsx';
import PriceChart from '../components/price/PriceChart.tsx';
import PricePrediction from '../components/price/PricePrediction.tsx';
import ComparativePricing from '../components/price/ComparativePricing.tsx';
import CollectionComparison from '../components/trustScore/CollectionComparison.tsx';
import StrengthsConcerns from '../components/trustScore/StrengthsConcerns.tsx';
import RiskProfileCard from '../components/risk/RiskProfileCard.tsx';
import RiskFactorBreakdown from '../components/risk/RiskFactorBreakdown.tsx';
import ComparativeRiskAnalysis from '../components/risk/ComparativeRiskAnalysis.tsx';
import MitigationRecommendations from '../components/risk/MitigationRecommendations.tsx';
import RiskHistoryChart from '../components/risk/RiskHistoryChart.tsx';
import { useNFT } from '../context/NFTContext.tsx';
import { mockNftData } from '../data/mockData.ts'; // Keeping as fallback

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
  const [tabValue, setTabValue] = useState(0);
  const { selectedNFT, nftData, loading, error } = useNFT();
  const [fallbackData, setFallbackData] = useState(mockNftData);

  // Use real data from Hathor blockchain if available, otherwise use fallback mock data
  const displayData = nftData || fallbackData;

  useEffect(() => {
    // If no NFT is selected, use mock data after a delay to simulate loading
    if (!selectedNFT) {
      const timer = setTimeout(() => {
        setFallbackData(mockNftData);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedNFT]);

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

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1">
          Showing fallback data instead.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        NFT Analysis Dashboard
      </Typography>
      
      {selectedNFT && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Viewing data for NFT: {selectedNFT}
        </Alert>
      )}
      
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
            <TrustScoreCard score={displayData.trustScore} confidence={displayData.confidence} />
          </Grid>
          <Grid item xs={12} md={8}>
            <TrustFactorsBreakdown factors={displayData.factors} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TrustScoreHistory history={displayData.history} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CollectionComparison collectionData={displayData.collectionComparison} />
          </Grid>
          <Grid item xs={12}>
            <StrengthsConcerns strengths={displayData.strengths} concerns={displayData.concerns} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <PriceChart priceData={displayData.priceData || displayData.price?.history} />
          </Grid>
          <Grid item xs={12} md={4}>
            <PricePrediction prediction={displayData.pricePrediction || displayData.price?.predicted} />
          </Grid>
          <Grid item xs={12}>
            <ComparativePricing comparativeData={displayData.comparativePricing || displayData.price?.comparative} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <RiskProfileCard 
              overallRisk={displayData.riskAssessment.overallRisk} 
              factors={displayData.riskAssessment.factors} 
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <RiskFactorBreakdown 
              factors={displayData.riskAssessment.factors.map((factor, index) => ({
                ...factor,
                description: index === 0 ? 'Measures the price fluctuation and stability of this NFT and its collection.' :
                             index === 1 ? 'Evaluates how easily this NFT can be bought or sold without significant price impact.' :
                             index === 2 ? 'Assesses smart contract security, metadata storage, and technical implementation.' :
                                          'Evaluates exposure to regulatory changes and compliance issues.',
                impact: index === 0 ? 'High volatility may indicate unpredictable future value and higher investment risk.' :
                        index === 1 ? 'Low liquidity may result in difficulty selling the asset when needed or significant price slippage.' :
                        index === 2 ? 'Technical vulnerabilities could lead to loss of the asset or diminished functionality.' :
                                     'Regulatory actions could affect tradability, value, or legal status of the NFT.',
                mitigationSteps: index === 0 ? [
                  'Consider dollar-cost averaging when purchasing',
                  'Set stop-loss thresholds for your investment',
                  'Diversify your NFT portfolio across multiple collections'
                ] : index === 1 ? [
                  'Focus on collections with consistent trading volume',
                  'Monitor floor price stability as an indicator of liquidity',
                  'Consider the total number of holders as a liquidity metric'
                ] : index === 2 ? [
                  'Verify the contract has been audited by reputable firms',
                  'Check that metadata is stored on decentralized storage',
                  'Research the development team\'s technical background'
                ] : [
                  'Stay informed about regulatory developments in relevant jurisdictions',
                  'Consider the compliance history of the marketplace and creator',
                  'Diversify across different types of NFT use cases'
                ],
                historicalTrend: index === 0 ? 'stable' : index === 1 || index === 2 ? 'improving' : 'worsening'
              }))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ComparativeRiskAnalysis 
              labels={displayData.riskAssessment.factors.map(factor => factor.name)}
              comparisonItems={[
                {
                  name: 'This NFT',
                  data: displayData.riskAssessment.factors.map(factor => factor.score),
                  color: '#2196f3'
                },
                {
                  name: 'Collection Average',
                  data: displayData.riskAssessment.factors.map((factor, index) => 
                    Math.min(100, Math.max(50, factor.score + (index % 2 === 0 ? 5 : -5)))
                  ),
                  color: '#ff9800'
                },
                {
                  name: 'Market Average',
                  data: displayData.riskAssessment.factors.map(factor => 
                    Math.max(50, factor.score - 10)
                  ),
                  color: '#f44336'
                }
              ]}
            />
          </Grid>
          <Grid item xs={12}>
            <MitigationRecommendations 
              recommendations={displayData.riskAssessment.factors.map((factor, index) => ({
                factor: factor.name,
                recommendations: displayData.riskAssessment.factors.map((factor, i) => ({
                  ...factor,
                  description: i === 0 ? 'Measures the price fluctuation and stability of this NFT and its collection.' :
                               i === 1 ? 'Evaluates how easily this NFT can be bought or sold without significant price impact.' :
                               i === 2 ? 'Assesses smart contract security, metadata storage, and technical implementation.' :
                                        'Evaluates exposure to regulatory changes and compliance issues.',
                  mitigationSteps: i === 0 ? [
                    'Consider dollar-cost averaging when purchasing',
                    'Set stop-loss thresholds for your investment',
                    'Diversify your NFT portfolio across multiple collections'
                  ] : i === 1 ? [
                    'Focus on collections with consistent trading volume',
                    'Monitor floor price stability as an indicator of liquidity',
                    'Consider the total number of holders as a liquidity metric'
                  ] : i === 2 ? [
                    'Verify the contract has been audited by reputable firms',
                    'Check that metadata is stored on decentralized storage',
                    'Research the development team\'s technical background'
                  ] : [
                    'Stay informed about regulatory developments in relevant jurisdictions',
                    'Consider the compliance history of the marketplace and creator',
                    'Diversify across different types of NFT use cases'
                  ]
                }))[index].mitigationSteps || []
              }))}
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {displayData.fraudDetection ? (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Fraud Detection Results
                </Typography>
                <Alert severity={displayData.fraudDetection.fraudScore > 70 ? "error" : displayData.fraudDetection.fraudScore > 30 ? "warning" : "success"} sx={{ mb: 2 }}>
                  {displayData.fraudDetection.fraudScore > 70 ? 
                    "High risk of fraud detected" : 
                    displayData.fraudDetection.fraudScore > 30 ? 
                    "Some suspicious patterns detected" : 
                    "No significant fraud indicators detected"}
                </Alert>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                Fraud detection data is not available for this NFT.
              </Alert>
            </Grid>
          )}
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default Dashboard;
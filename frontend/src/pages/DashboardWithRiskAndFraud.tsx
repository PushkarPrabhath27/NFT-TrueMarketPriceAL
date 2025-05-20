import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Paper, CircularProgress, Tabs, Tab, Fab, Tooltip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
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
// Import new components
import RiskRadarChart from '../components/risk/RiskRadarChart.tsx';
import RiskEvolutionTracker from '../components/risk/RiskEvolutionTracker.tsx';
import FraudDetectionResults from '../components/fraud/FraudDetectionResults.tsx';
// Import educational components
import { EducationalOverlay } from '../components/educational/index.tsx';
import { MethodologyExplanation } from '../components/educational/index.tsx';

// Import mock data
import { mockNftData } from '../data/mockData.ts';
import { mockRiskDimensions, mockRiskHistoricalData, mockFraudIndicators } from '../data/mockRiskAndFraudData.ts';

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

function DashboardWithRiskAndFraud() {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        NFT Analysis Dashboard
      </Typography>
      
      {/* Add Educational Overlay with Tutorial Integration */}
      <EducationalOverlay currentTab={tabValue} />
      
      {/* Add Tutorial Launch Button */}
      <Box sx={{ position: 'fixed', top: 80, right: 20, zIndex: 1000 }}>
        <Tooltip title="Launch Interactive Tutorial">
          <Fab 
            color="secondary" 
            size="medium"
            onClick={() => {
              // Find the EducationalOverlay component and trigger the tutorial
              const educationalOverlay = document.querySelector('.MuiSpeedDial-root');
              if (educationalOverlay) {
                // Simulate click on the SpeedDial
                educationalOverlay.dispatchEvent(new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                }));
                
                // Small delay to allow SpeedDial to open
                setTimeout(() => {
                  // Find and click the Tutorials action
                  const tutorialsAction = document.querySelector('[aria-label="Tutorials"]');
                  if (tutorialsAction) {
                    tutorialsAction.dispatchEvent(new MouseEvent('click', {
                      bubbles: true,
                      cancelable: true,
                      view: window
                    }));
                  }
                }, 300);
              }
            }}
          >
            <SchoolIcon />
          </Fab>
        </Tooltip>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="nft analysis tabs">
          <Tab label="Overview" id="nft-analysis-tab-0" aria-controls="nft-analysis-tabpanel-0" />
          <Tab label="Trust Score" id="nft-analysis-tab-1" aria-controls="nft-analysis-tabpanel-1" />
          <Tab label="Price Intelligence" id="nft-analysis-tab-2" aria-controls="nft-analysis-tabpanel-2" />
          <Tab label="Risk Assessment" id="nft-analysis-tab-3" aria-controls="nft-analysis-tabpanel-3" />
          <Tab label="Fraud Detection" id="nft-analysis-tab-4" aria-controls="nft-analysis-tabpanel-4" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrustScoreCard score={nftData.trustScore} confidence={nftData.confidence} />
              <Box sx={{ ml: 1 }}>
                <MethodologyExplanation type="trustScore" />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RiskProfileCard overallRisk={nftData.riskProfile.overallRisk} factors={nftData.riskProfile.factors} />
              <Box sx={{ ml: 1 }}>
                <MethodologyExplanation type="riskAssessment" />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PricePrediction currentPrice={nftData.price.current} predictedPrice={nftData.price.predicted} confidence={nftData.price.confidence} />
              <Box sx={{ ml: 1 }}>
                <MethodologyExplanation type="pricePrediction" />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <TrustFactorsBreakdown factors={nftData.trustFactors} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StrengthsConcerns strengths={nftData.strengths} concerns={nftData.concerns} />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Trust Score Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TrustScoreCard score={nftData.trustScore} confidence={nftData.confidence} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TrustScoreHistory history={nftData.trustScoreHistory} />
          </Grid>
          <Grid item xs={12}>
            <TrustFactorsBreakdown factors={nftData.trustFactors} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StrengthsConcerns strengths={nftData.strengths} concerns={nftData.concerns} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CollectionComparison collectionData={nftData.collectionComparison} />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Price Intelligence Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <PricePrediction currentPrice={nftData.price.current} predictedPrice={nftData.price.predicted} confidence={nftData.price.confidence} />
          </Grid>
          <Grid item xs={12} md={6}>
            <ComparativePricing comparativeData={nftData.price.comparative} />
          </Grid>
          <Grid item xs={12}>
            <PriceChart priceHistory={nftData.price.history} events={nftData.price.events} />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Risk Assessment Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <RiskProfileCard overallRisk={nftData.riskProfile.overallRisk} factors={nftData.riskProfile.factors} />
          </Grid>
          <Grid item xs={12} md={6}>
            {/* New Risk Radar Chart Component */}
            <RiskRadarChart dimensions={mockRiskDimensions} />
          </Grid>
          <Grid item xs={12}>
            {/* New Risk Evolution Tracker Component */}
            <RiskEvolutionTracker historicalData={mockRiskHistoricalData} />
          </Grid>
          <Grid item xs={12} md={6}>
            <RiskFactorBreakdown factors={nftData.riskProfile.factors} />
          </Grid>
          <Grid item xs={12} md={6}>
            <MitigationRecommendations recommendations={nftData.riskProfile.mitigationSteps} />
          </Grid>
          <Grid item xs={12}>
            <ComparativeRiskAnalysis comparisonData={nftData.riskProfile.comparison} />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Fraud Detection Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {/* New Fraud Detection Results Component */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <FraudDetectionResults indicators={mockFraudIndicators} />
              <Box sx={{ ml: 2, mt: 2 }}>
                <MethodologyExplanation type="fraudDetection" />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default DashboardWithRiskAndFraud;
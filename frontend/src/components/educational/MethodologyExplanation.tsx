import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton, 
  Popover, 
  Paper, 
  Tabs, 
  Tab, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Button
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
      id={`methodology-tabpanel-${index}`}
      aria-labelledby={`methodology-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface MethodologyExplanationProps {
  type: 'trustScore' | 'pricePrediction' | 'riskAssessment' | 'fraudDetection';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showIcon?: boolean;
}

const MethodologyExplanation: React.FC<MethodologyExplanationProps> = ({ 
  type, 
  placement = 'right',
  showIcon = true
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'methodology-popover' : undefined;

  // Content based on type
  const getTooltipContent = () => {
    switch (type) {
      case 'trustScore':
        return 'Trust Score is calculated based on multiple factors including ownership history, creator reputation, and market performance.';
      case 'pricePrediction':
        return 'Price predictions use machine learning models trained on historical sales data, market trends, and comparable assets.';
      case 'riskAssessment':
        return 'Risk assessment evaluates potential vulnerabilities across multiple dimensions including liquidity, volatility, and market manipulation.';
      case 'fraudDetection':
        return 'Fraud detection uses image analysis, transaction pattern recognition, and metadata validation to identify suspicious activities.';
      default:
        return 'Click for more information about our methodology.';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'trustScore': return 'Trust Score Methodology';
      case 'pricePrediction': return 'Price Prediction Methodology';
      case 'riskAssessment': return 'Risk Assessment Framework';
      case 'fraudDetection': return 'Fraud Detection Approach';
      default: return 'Methodology';
    }
  };

  const renderTrustScoreContent = () => (
    <Box>
      <Typography variant="body1" paragraph>
        Our Trust Score is a comprehensive metric calculated using a weighted algorithm that considers multiple factors:
      </Typography>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Ownership History</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We analyze the complete chain of ownership, focusing on wallet reputation, holding periods, and transaction patterns.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Creator Reputation</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We evaluate the creator's history, previous projects, community engagement, and delivery on promises.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Market Performance</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We assess price stability, trading volume, liquidity, and market sentiment over time.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Confidence Calculation</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Our confidence indicator reflects the quality and quantity of data available for analysis. Higher confidence means more reliable scores.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const renderPricePredictionContent = () => (
    <Box>
      <Typography variant="body1" paragraph>
        Our price prediction engine uses advanced machine learning models trained on:
      </Typography>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Historical Sales Data</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We analyze past sales of the specific NFT and similar assets to establish baseline patterns.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Market Trends</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We incorporate broader market movements, including collection floor prices, volume trends, and category performance.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Confidence Intervals</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Our confidence bands represent the range of potential price outcomes based on market volatility and data quality.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const renderRiskAssessmentContent = () => (
    <Box>
      <Typography variant="body1" paragraph>
        Our risk assessment framework evaluates multiple dimensions of risk:
      </Typography>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Liquidity Risk</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We assess how easily the NFT can be sold at fair market value based on trading volume and buyer interest.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Volatility Risk</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We measure price stability and potential for sudden value changes based on historical patterns.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Market Manipulation Risk</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We detect patterns that may indicate artificial price inflation, wash trading, or other manipulative practices.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const renderFraudDetectionContent = () => (
    <Box>
      <Typography variant="body1" paragraph>
        Our fraud detection system employs multiple techniques to identify suspicious activities:
      </Typography>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Image Analysis</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We use computer vision algorithms to detect copied or highly similar artwork across collections.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Transaction Pattern Analysis</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We identify suspicious trading patterns that may indicate wash trading or market manipulation.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Metadata Validation</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            We verify the integrity of on-chain data and check for inconsistencies or unauthorized modifications.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  return (
    <>
      {showIcon && (
        <Tooltip title={getTooltipContent()} placement={placement}>
          <IconButton onClick={handleClick} size="small" color="primary">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ maxWidth: 400, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {getTitle()}
          </Typography>
          
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="methodology tabs">
            <Tab label="Overview" />
            <Tab label="Details" />
            <Tab label="FAQ" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Typography variant="body2" paragraph>
              {getTooltipContent()}
            </Typography>
            <Button variant="outlined" size="small" onClick={() => setTabValue(1)}>
              Learn More
            </Button>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {type === 'trustScore' && renderTrustScoreContent()}
            {type === 'pricePrediction' && renderPricePredictionContent()}
            {type === 'riskAssessment' && renderRiskAssessmentContent()}
            {type === 'fraudDetection' && renderFraudDetectionContent()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>How often is this data updated?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Our analysis is updated in real-time as new blockchain data becomes available, typically within minutes of new transactions.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>How accurate are these assessments?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Our models are continuously trained and evaluated, with typical accuracy rates of 85-95% depending on data availability and market conditions.
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Can I export this data?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Yes, premium users can export detailed reports and raw data for further analysis.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </TabPanel>
        </Paper>
      </Popover>
    </>
  );
};

export default MethodologyExplanation;
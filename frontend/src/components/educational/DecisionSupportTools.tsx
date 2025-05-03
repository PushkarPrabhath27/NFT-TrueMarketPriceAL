import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

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
      id={`decision-support-tabpanel-${index}`}
      aria-labelledby={`decision-support-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface NFTComparisonItem {
  id: string;
  name: string;
  trustScore: number;
  price: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  collection: string;
  pros: string[];
  cons: string[];
}

interface DecisionSupportToolsProps {
  nftId?: string;
  currentPrice?: number;
  currentTrustScore?: number;
  currentRiskLevel?: 'Low' | 'Medium' | 'High';
}

const DecisionSupportTools: React.FC<DecisionSupportToolsProps> = ({
  nftId,
  currentPrice = 1.5,
  currentTrustScore = 85,
  currentRiskLevel = 'Low'
}) => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Comparison tool state
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);
  
  // Scenario modeling state
  const [holdingPeriod, setHoldingPeriod] = useState<number>(6); // months
  const [marketCondition, setMarketCondition] = useState<string>('neutral');
  const [investmentAmount, setInvestmentAmount] = useState<number>(currentPrice);
  
  // Sample data - in a real app, this would come from an API
  const sampleNFTs: NFTComparisonItem[] = [
    {
      id: 'nft1',
      name: 'Current NFT',
      trustScore: currentTrustScore,
      price: currentPrice,
      riskLevel: currentRiskLevel,
      collection: 'Sample Collection',
      pros: ['High trust score', 'Strong creator reputation', 'Active community'],
      cons: ['Limited price history', 'Medium liquidity']
    },
    {
      id: 'nft2',
      name: 'Alternative #1',
      trustScore: 78,
      price: 1.2,
      riskLevel: 'Medium',
      collection: 'Sample Collection',
      pros: ['Lower price point', 'Established price history'],
      cons: ['Lower trust score', 'Some market volatility']
    },
    {
      id: 'nft3',
      name: 'Alternative #2',
      trustScore: 92,
      price: 2.1,
      riskLevel: 'Low',
      collection: 'Premium Collection',
      pros: ['Highest trust score', 'Very low risk', 'Strong growth potential'],
      cons: ['Higher price point', 'Different collection']
    },
    {
      id: 'nft4',
      name: 'Alternative #3',
      trustScore: 65,
      price: 0.8,
      riskLevel: 'High',
      collection: 'New Collection',
      pros: ['Lowest price point', 'New collection with potential'],
      cons: ['Higher risk', 'Limited history', 'Unproven creator']
    }
  ];

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNFTSelect = (nftId: string) => {
    if (selectedNFTs.includes(nftId)) {
      setSelectedNFTs(selectedNFTs.filter(id => id !== nftId));
    } else if (selectedNFTs.length < 3) {
      setSelectedNFTs([...selectedNFTs, nftId]);
    }
  };

  const calculateReturnPotential = () => {
    // Simple model for demonstration purposes
    // In a real app, this would use more sophisticated models
    let baseMultiplier = 1.0;
    
    // Adjust based on market condition
    switch (marketCondition) {
      case 'bullish':
        baseMultiplier = 1.5;
        break;
      case 'bearish':
        baseMultiplier = 0.7;
        break;
      default: // neutral
        baseMultiplier = 1.0;
    }
    
    // Adjust based on holding period (longer = more potential but more risk)
    const timeMultiplier = 1 + (holdingPeriod / 12) * 0.5;
    
    // Adjust based on trust score (higher = better potential)
    const trustMultiplier = 0.5 + (currentTrustScore / 100) * 0.5;
    
    // Adjust based on risk level
    let riskMultiplier = 1.0;
    switch (currentRiskLevel) {
      case 'Low':
        riskMultiplier = 0.9;
        break;
      case 'Medium':
        riskMultiplier = 1.0;
        break;
      case 'High':
        riskMultiplier = 1.2;
        break;
    }
    
    // Calculate potential return
    const potentialReturn = investmentAmount * baseMultiplier * timeMultiplier * trustMultiplier * riskMultiplier;
    
    // Calculate potential profit/loss
    const profitLoss = potentialReturn - investmentAmount;
    
    // Calculate ROI percentage
    const roiPercentage = ((potentialReturn / investmentAmount) - 1) * 100;
    
    return {
      potentialValue: potentialReturn.toFixed(2),
      profitLoss: profitLoss.toFixed(2),
      roiPercentage: roiPercentage.toFixed(1),
      isPositive: profitLoss >= 0
    };
  };

  const renderComparisonTool = () => {
    const selectedNFTData = sampleNFTs.filter(nft => selectedNFTs.includes(nft.id) || nft.id === 'nft1');
    
    return (
      <Box>
        <Typography variant="body1" paragraph>
          Compare NFTs to make an informed investment decision. Select up to 3 alternatives to compare with the current NFT.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Available NFTs for Comparison</Typography>
          <Grid container spacing={2}>
            {sampleNFTs.filter(nft => nft.id !== 'nft1').map((nft) => (
              <Grid item xs={12} sm={4} key={nft.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: selectedNFTs.includes(nft.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    bgcolor: selectedNFTs.includes(nft.id) ? 'rgba(25, 118, 210, 0.08)' : 'background.paper'
                  }}
                  onClick={() => handleNFTSelect(nft.id)}
                >
                  <Typography variant="h6">{nft.name}</Typography>
                  <Typography variant="body2">Trust Score: {nft.trustScore}</Typography>
                  <Typography variant="body2">Price: {nft.price} ETH</Typography>
                  <Typography variant="body2">Risk: {nft.riskLevel}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {selectedNFTData.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Comparison Results</Typography>
            <Paper sx={{ p: 2, overflowX: 'auto' }}>
              <Box sx={{ minWidth: 650 }}>
                <Grid container>
                  {/* Header */}
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Metrics</Typography>
                  </Grid>
                  {selectedNFTData.map((nft) => (
                    <Grid item xs={12 / selectedNFTData.length * 3} key={nft.id}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{nft.name}</Typography>
                    </Grid>
                  ))}
                  
                  {/* Trust Score */}
                  <Grid item xs={3}>
                    <Typography variant="body2">Trust Score</Typography>
                  </Grid>
                  {selectedNFTData.map((nft) => (
                    <Grid item xs={12 / selectedNFTData.length * 3} key={`${nft.id}-trust`}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: nft.trustScore > 80 ? 'success.main' : nft.trustScore > 60 ? 'warning.main' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {nft.trustScore}/100
                      </Typography>
                    </Grid>
                  ))}
                  
                  {/* Price */}
                  <Grid item xs={3}>
                    <Typography variant="body2">Price</Typography>
                  </Grid>
                  {selectedNFTData.map((nft) => (
                    <Grid item xs={12 / selectedNFTData.length * 3} key={`${nft.id}-price`}>
                      <Typography variant="body2">{nft.price} ETH</Typography>
                    </Grid>
                  ))}
                  
                  {/* Risk Level */}
                  <Grid item xs={3}>
                    <Typography variant="body2">Risk Level</Typography>
                  </Grid>
                  {selectedNFTData.map((nft) => (
                    <Grid item xs={12 / selectedNFTData.length * 3} key={`${nft.id}-risk`}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: nft.riskLevel === 'Low' ? 'success.main' : nft.riskLevel === 'Medium' ? 'warning.main' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {nft.riskLevel}
                      </Typography>
                    </Grid>
                  ))}
                  
                  {/* Collection */}
                  <Grid item xs={3}>
                    <Typography variant="body2">Collection</Typography>
                  </Grid>
                  {selectedNFTData.map((nft) => (
                    <Grid item xs={12 / selectedNFTData.length * 3} key={`${nft.id}-collection`}>
                      <Typography variant="body2">{nft.collection}</Typography>
                    </Grid>
                  ))}
                  
                  {/* Pros */}
                  <Grid item xs={3}>
                    <Typography variant="body2">Pros</Typography>
                  </Grid>
                  {selectedNFTData.map((nft) => (
                    <Grid item xs={12 / selectedNFTData.length * 3} key={`${nft.id}-pros`}>
                      <Box>
                        {nft.pros.map((pro, index) => (
                          <Typography variant="body2" key={index} sx={{ color: 'success.main' }}>
                            <CheckCircleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {pro}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  ))}
                  
                  {/* Cons */}
                  <Grid item xs={3}>
                    <Typography variant="body2">Cons</Typography>
                  </Grid>
                  {selectedNFTData.map((nft) => (
                    <Grid item xs={12 / selectedNFTData.length * 3} key={`${nft.id}-cons`}>
                      <Box>
                        {nft.cons.map((con, index) => (
                          <Typography variant="body2" key={index} sx={{ color: 'error.main' }}>
                            <WarningIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {con}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

  const renderScenarioModeling = () => {
    const returnPotential = calculateReturnPotential();
    
    return (
      <Box>
        <Typography variant="body1" paragraph>
          Model different scenarios to estimate potential returns based on market conditions and holding periods.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Scenario Parameters</Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Investment Amount (ETH)</Typography>
                <TextField
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
                  fullWidth
                  size="small"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Holding Period: {holdingPeriod} months</Typography>
                <Slider
                  value={holdingPeriod}
                  onChange={(_, newValue) => setHoldingPeriod(newValue as number)}
                  min={1}
                  max={36}
                  marks={[
                    { value: 1, label: '1m' },
                    { value: 12, label: '1y' },
                    { value: 24, label: '2y' },
                    { value: 36, label: '3y' },
                  ]}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Market Condition</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={marketCondition}
                    onChange={(e) => setMarketCondition(e.target.value)}
                  >
                    <MenuItem value="bearish">Bearish (Declining Market)</MenuItem>
                    <MenuItem value="neutral">Neutral (Stable Market)</MenuItem>
                    <MenuItem value="bullish">Bullish (Growing Market)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Current NFT Metrics</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Trust Score:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{currentTrustScore}/100</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">Price:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{currentPrice} ETH</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">Risk Level:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{currentRiskLevel}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" gutterBottom>Potential Outcome</Typography>
                
                <Box sx={{ mb: 3, mt: 4, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: returnPotential.isPositive ? 'success.main' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {returnPotential.isPositive ? <TrendingUpIcon sx={{ mr: 1 }} /> : <TrendingDownIcon sx={{ mr: 1 }} />}
                    {returnPotential.potentialValue} ETH
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Estimated value after {holdingPeriod} months</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      {returnPotential.isPositive ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${returnPotential.isPositive ? 'Profit' : 'Loss'}: ${returnPotential.profitLoss} ETH`}
                      secondary={`ROI: ${returnPotential.roiPercentage}%`}
                    />
                  </ListItem>
                </List>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Note: This is a simplified model for demonstration purposes. Actual returns may vary based on market conditions and other factors.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderInvestmentChecklist = () => {
    // Sample checklist based on NFT metrics
    const checklistItems = [
      {
        question: 'Is the trust score above 80?',
        result: currentTrustScore > 80,
        recommendation: currentTrustScore > 80 
          ? 'Good trust score indicates reliability.'
          : 'Consider NFTs with higher trust scores for reduced risk.'
      },
      {
        question: 'Is the risk level acceptable?',
        result: currentRiskLevel !== 'High',
        recommendation: currentRiskLevel !== 'High'
          ? 'Risk level is within acceptable range.'
          : 'High risk level may indicate potential issues.'
      },
      {
        question: 'Is the price reasonable compared to similar NFTs?',
        result: true, // This would be dynamically calculated in a real app
        recommendation: 'Price is within market range for similar assets.'
      },
      {
        question: 'Does the creator have a strong reputation?',
        result: true, // This would be dynamically calculated in a real app
        recommendation: 'Creator has established history of successful projects.'
      },
      {
        question: 'Is there sufficient trading volume?',
        result: false, // This would be dynamically calculated in a real app
        recommendation: 'Low trading volume may indicate liquidity issues.'
      },
      {
        question: 'Are there any fraud indicators?',
        result: true, // This would be dynamically calculated in a real app (true = no fraud)
        recommendation: 'No fraud indicators detected.'
      }
    ];
    
    const passedItems = checklistItems.filter(item => item.result).length;
    const totalItems = checklistItems.length;
    const passRate = (passedItems / totalItems) * 100;
    
    return (
      <Box>
        <Typography variant="body1" paragraph>
          Review this investment checklist to ensure you've considered all important factors before making a decision.
        </Typography>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">Overall Assessment: </Typography>
          <Box sx={{ 
            ml: 2, 
            px: 2, 
            py: 0.5, 
            borderRadius: 1, 
            bgcolor: passRate >= 80 ? 'success.light' : passRate >= 60 ? 'warning.light' : 'error.light',
            color: passRate >= 80 ? 'success.dark' : passRate >= 60 ? 'warning.dark' : 'error.dark',
            display: 'inline-block'
          }}>
            <Typography variant="subtitle1">
              {passRate >= 80 ? 'Recommended' : passRate >= 60 ? 'Proceed with Caution' : 'Not Recommended'}
            </Typography>
          </Box>
        </Box>
        
        <Paper sx={{ p: 2 }}>
          <List>
            {checklistItems.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {item.result 
                      ? <CheckCircleIcon color="success" /> 
                      : <WarningIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.question}
                    secondary={item.recommendation}
                  />
                </ListItem>
                {index < checklistItems.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Recommendation Summary</Typography>
          <Typography variant="body2">
            {passRate >= 80 
              ? 'This NFT meets most investment criteria and appears to be a solid investment opportunity.'
              : passRate >= 60
                ? 'This NFT meets some investment criteria but has potential issues that should be carefully considered.'
                : 'This NFT fails to meet several important investment criteria and may not be a suitable investment at this time.'}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Tooltip title="Decision Support Tools">
        <IconButton onClick={handleOpen} color="primary">
          <AssessmentIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Decision Support Tools
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="decision support tabs">
            <Tab icon={<CompareArrowsIcon />} label="NFT Comparison" />
            <Tab icon={<TimelineIcon />} label="Scenario Modeling" />
            <Tab icon={<AssessmentIcon />} label="Investment Checklist" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            {renderComparisonTool()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderScenarioModeling()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {renderInvestmentChecklist()}
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DecisionSupportTools;
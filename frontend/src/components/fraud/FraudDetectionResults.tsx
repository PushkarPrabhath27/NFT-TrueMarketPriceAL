import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import ImageIcon from '@mui/icons-material/Image';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CodeIcon from '@mui/icons-material/Code';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import ReportIcon from '@mui/icons-material/Report';

interface FraudIndicator {
  id: string;
  type: 'image_similarity' | 'wash_trading' | 'metadata_validation' | 'suspicious_pattern';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: {
    description: string;
    data: any; // This could be image URLs, transaction data, etc.
  }[];
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
}

interface FraudDetectionResultsProps {
  indicators: FraudIndicator[];
}

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
      id={`fraud-detection-tabpanel-${index}`}
      aria-labelledby={`fraud-detection-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const getSeverityColor = (severity: string) => {
  switch(severity) {
    case 'critical': return 'error';
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'default';
  }
};

const getSeverityIcon = (severity: string) => {
  switch(severity) {
    case 'critical': return <ErrorIcon color="error" />;
    case 'high': return <WarningIcon color="error" />;
    case 'medium': return <WarningIcon color="warning" />;
    case 'low': return <InfoIcon color="info" />;
    default: return <InfoIcon />;
  }
};

const getTypeIcon = (type: string) => {
  switch(type) {
    case 'image_similarity': return <ImageIcon />;
    case 'wash_trading': return <SwapHorizIcon />;
    case 'metadata_validation': return <CodeIcon />;
    case 'suspicious_pattern': return <TrendingUpIcon />;
    default: return <InfoIcon />;
  }
};

const FraudDetectionResults: React.FC<FraudDetectionResultsProps> = ({ indicators }) => {
  const [tabValue, setTabValue] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExpandClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Group indicators by type
  const imageSimilarityIndicators = indicators.filter(i => i.type === 'image_similarity');
  const washTradingIndicators = indicators.filter(i => i.type === 'wash_trading');
  const metadataValidationIndicators = indicators.filter(i => i.type === 'metadata_validation');
  const suspiciousPatternIndicators = indicators.filter(i => i.type === 'suspicious_pattern');

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Fraud Detection Results
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="fraud detection tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Findings" />
          <Tab 
            label={`Image Similarity (${imageSimilarityIndicators.length})`} 
            icon={<ImageIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label={`Wash Trading (${washTradingIndicators.length})`} 
            icon={<SwapHorizIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label={`Metadata Issues (${metadataValidationIndicators.length})`} 
            icon={<CodeIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label={`Suspicious Patterns (${suspiciousPatternIndicators.length})`} 
            icon={<TrendingUpIcon />} 
            iconPosition="start" 
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {indicators.map((indicator) => (
            <Grid item xs={12} key={indicator.id}>
              <FraudIndicatorCard 
                indicator={indicator} 
                expanded={expandedId === indicator.id}
                onExpandClick={() => handleExpandClick(indicator.id)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2}>
          {imageSimilarityIndicators.map((indicator) => (
            <Grid item xs={12} key={indicator.id}>
              <FraudIndicatorCard 
                indicator={indicator} 
                expanded={expandedId === indicator.id}
                onExpandClick={() => handleExpandClick(indicator.id)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={2}>
          {washTradingIndicators.map((indicator) => (
            <Grid item xs={12} key={indicator.id}>
              <FraudIndicatorCard 
                indicator={indicator} 
                expanded={expandedId === indicator.id}
                onExpandClick={() => handleExpandClick(indicator.id)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={2}>
          {metadataValidationIndicators.map((indicator) => (
            <Grid item xs={12} key={indicator.id}>
              <FraudIndicatorCard 
                indicator={indicator} 
                expanded={expandedId === indicator.id}
                onExpandClick={() => handleExpandClick(indicator.id)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={2}>
          {suspiciousPatternIndicators.map((indicator) => (
            <Grid item xs={12} key={indicator.id}>
              <FraudIndicatorCard 
                indicator={indicator} 
                expanded={expandedId === indicator.id}
                onExpandClick={() => handleExpandClick(indicator.id)}
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Paper>
  );
};

interface FraudIndicatorCardProps {
  indicator: FraudIndicator;
  expanded: boolean;
  onExpandClick: () => void;
}

const FraudIndicatorCard: React.FC<FraudIndicatorCardProps> = ({ 
  indicator, 
  expanded, 
  onExpandClick 
}) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleReportClick = () => {
    setReportDialogOpen(true);
    // In a real implementation, this would open a dialog for reporting
  };

  const renderEvidenceContent = (evidence: any) => {
    if (indicator.type === 'image_similarity') {
      return (
        <Grid container spacing={2}>
          {evidence.data.map((img: string, index: number) => (
            <Grid item xs={6} md={4} key={index}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={img}
                  alt={`Similar image ${index + 1}`}
                />
                <CardContent>
                  <Typography variant="body2">
                    {index === 0 ? 'Original' : `Similar image ${index}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    } else if (indicator.type === 'wash_trading') {
      return (
        <Box sx={{ overflowX: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Suspicious Transaction Pattern
          </Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Transaction Hash</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>From</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>To</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Price</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {evidence.data.map((tx: any, index: number) => (
                <tr key={index}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{tx.hash.substring(0, 10)}...</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{tx.from.substring(0, 6)}...</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{tx.to.substring(0, 6)}...</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{tx.price} ETH</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    } else {
      return (
        <Typography variant="body2">
          {evidence.description}
        </Typography>
      );
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ mr: 1 }}>
            {getSeverityIcon(indicator.severity)}
          </Box>
          <Typography variant="h6" component="div">
            {indicator.title}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip 
            label={indicator.severity.toUpperCase()} 
            color={getSeverityColor(indicator.severity) as any}
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={indicator.status} 
            variant="outlined"
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {indicator.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="View evidence details">
              <IconButton
                onClick={onExpandClick}
                aria-expanded={expanded}
                aria-label="show more"
                size="small"
              >
                <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" color="text.secondary">
              Evidence Details
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Detected: {indicator.timestamp}
          </Typography>
        </Box>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Evidence
          </Typography>
          
          {indicator.evidence.map((evidence, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                {evidence.description}
              </Typography>
              {renderEvidenceContent(evidence)}
            </Box>
          ))}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              startIcon={<HistoryIcon />}
              size="small"
              variant="outlined"
            >
              View Similar Cases
            </Button>
            <Button 
              startIcon={<ReportIcon />}
              size="small"
              variant="contained"
              color="primary"
              onClick={handleReportClick}
            >
              Report Issue
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default FraudDetectionResults;
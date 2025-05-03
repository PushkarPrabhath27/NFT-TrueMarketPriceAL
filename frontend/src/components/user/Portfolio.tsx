import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  MoreVert as MoreIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface NFTAsset {
  id: string;
  name: string;
  collection: string;
  image: string;
  purchasePrice: number;
  currentValue: number;
  valueChange: number;
  trustScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  lastUpdated: string;
  favorite: boolean;
}

interface PortfolioStats {
  totalValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  highestValue: {
    name: string;
    value: number;
  };
  lowestTrustScore: {
    name: string;
    score: number;
  };
  totalAssets: number;
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
      id={`portfolio-tabpanel-${index}`}
      aria-labelledby={`portfolio-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Mock data for portfolio assets
const mockNFTAssets: NFTAsset[] = [
  {
    id: '1',
    name: 'Bored Ape #1234',
    collection: 'Bored Ape Yacht Club',
    image: 'https://via.placeholder.com/150',
    purchasePrice: 80,
    currentValue: 95,
    valueChange: 18.75,
    trustScore: 85,
    riskLevel: 'Low',
    lastUpdated: '2023-09-15',
    favorite: true
  },
  {
    id: '2',
    name: 'Crypto Punk #5678',
    collection: 'CryptoPunks',
    image: 'https://via.placeholder.com/150',
    purchasePrice: 120,
    currentValue: 110,
    valueChange: -8.33,
    trustScore: 92,
    riskLevel: 'Low',
    lastUpdated: '2023-09-14',
    favorite: false
  },
  {
    id: '3',
    name: 'Azuki #9012',
    collection: 'Azuki',
    image: 'https://via.placeholder.com/150',
    purchasePrice: 40,
    currentValue: 65,
    valueChange: 62.5,
    trustScore: 78,
    riskLevel: 'Medium',
    lastUpdated: '2023-09-13',
    favorite: true
  },
  {
    id: '4',
    name: 'Doodle #3456',
    collection: 'Doodles',
    image: 'https://via.placeholder.com/150',
    purchasePrice: 25,
    currentValue: 20,
    valueChange: -20,
    trustScore: 65,
    riskLevel: 'High',
    lastUpdated: '2023-09-12',
    favorite: false
  },
  {
    id: '5',
    name: 'CloneX #7890',
    collection: 'CloneX',
    image: 'https://via.placeholder.com/150',
    purchasePrice: 55,
    currentValue: 60,
    valueChange: 9.09,
    trustScore: 88,
    riskLevel: 'Low',
    lastUpdated: '2023-09-11',
    favorite: false
  },
];

// Calculate portfolio stats
const calculatePortfolioStats = (assets: NFTAsset[]): PortfolioStats => {
  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalCost = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPercentage = (totalGainLoss / totalCost) * 100;
  
  let highestValueAsset = assets[0];
  let lowestTrustScoreAsset = assets[0];
  
  assets.forEach(asset => {
    if (asset.currentValue > highestValueAsset.currentValue) {
      highestValueAsset = asset;
    }
    if (asset.trustScore < lowestTrustScoreAsset.trustScore) {
      lowestTrustScoreAsset = asset;
    }
  });
  
  return {
    totalValue,
    totalGainLoss,
    gainLossPercentage,
    highestValue: {
      name: highestValueAsset.name,
      value: highestValueAsset.currentValue
    },
    lowestTrustScore: {
      name: lowestTrustScoreAsset.name,
      score: lowestTrustScoreAsset.trustScore
    },
    totalAssets: assets.length
  };
};

export const Portfolio: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [assets, setAssets] = useState<NFTAsset[]>(mockNFTAssets);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [assetMenuAnchorEl, setAssetMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  const portfolioStats = calculatePortfolioStats(assets);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleAssetMenuClick = (event: React.MouseEvent<HTMLButtonElement>, assetId: string) => {
    setAssetMenuAnchorEl(event.currentTarget);
    setSelectedAssetId(assetId);
  };
  
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const handleAssetMenuClose = () => {
    setAssetMenuAnchorEl(null);
    setSelectedAssetId(null);
  };
  
  const handleSort = (criteria: 'value' | 'trustScore' | 'change' | 'date') => {
    let sortedAssets = [...assets];
    
    switch (criteria) {
      case 'value':
        sortedAssets.sort((a, b) => b.currentValue - a.currentValue);
        break;
      case 'trustScore':
        sortedAssets.sort((a, b) => b.trustScore - a.trustScore);
        break;
      case 'change':
        sortedAssets.sort((a, b) => b.valueChange - a.valueChange);
        break;
      case 'date':
        sortedAssets.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
    }
    
    setAssets(sortedAssets);
    handleSortClose();
  };
  
  const handleFilter = (filter: 'all' | 'favorites' | 'highRisk' | 'gainers' | 'losers') => {
    let filteredAssets = [...mockNFTAssets];
    
    switch (filter) {
      case 'favorites':
        filteredAssets = filteredAssets.filter(asset => asset.favorite);
        break;
      case 'highRisk':
        filteredAssets = filteredAssets.filter(asset => asset.riskLevel === 'High');
        break;
      case 'gainers':
        filteredAssets = filteredAssets.filter(asset => asset.valueChange > 0);
        break;
      case 'losers':
        filteredAssets = filteredAssets.filter(asset => asset.valueChange < 0);
        break;
    }
    
    setAssets(filteredAssets);
    handleFilterClose();
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setAssets(mockNFTAssets);
    } else {
      const filteredAssets = mockNFTAssets.filter(
        asset => asset.name.toLowerCase().includes(query) || 
                asset.collection.toLowerCase().includes(query)
      );
      setAssets(filteredAssets);
    }
  };
  
  const handleToggleFavorite = (assetId: string) => {
    const updatedAssets = assets.map(asset => 
      asset.id === assetId ? { ...asset, favorite: !asset.favorite } : asset
    );
    setAssets(updatedAssets);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const getValueChangeColor = (change: number) => {
    return change >= 0 ? 'success.main' : 'error.main';
  };
  
  const getValueChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
  };
  
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'success.main';
      case 'Medium': return 'warning.main';
      case 'High': return 'error.main';
      default: return 'text.secondary';
    }
  };
  
  const filteredAssets = searchQuery.trim() === '' 
    ? assets 
    : assets.filter(asset => 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        asset.collection.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <Paper elevation={3} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="portfolio tabs"
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="NFT Assets" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>
      
      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Portfolio Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total Value</Typography>
                    <Typography variant="h5">{formatCurrency(portfolioStats.totalValue)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total Gain/Loss</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="h5" 
                        color={getValueChangeColor(portfolioStats.totalGainLoss)}
                      >
                        {formatCurrency(portfolioStats.totalGainLoss)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={getValueChangeColor(portfolioStats.totalGainLoss)}
                        sx={{ ml: 1 }}
                      >
                        ({portfolioStats.gainLossPercentage.toFixed(2)}%)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total Assets</Typography>
                    <Typography variant="h5">{portfolioStats.totalAssets}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Highest Value Asset</Typography>
                    <Typography variant="body1">{portfolioStats.highestValue.name}</Typography>
                    <Typography variant="body2">{formatCurrency(portfolioStats.highestValue.value)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Lowest Trust Score</Typography>
                    <Typography variant="body1">{portfolioStats.lowestTrustScore.name}</Typography>
                    <Typography variant="body2">{portfolioStats.lowestTrustScore.score}/100</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Risk Distribution</Typography>
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <Chip 
                        size="small" 
                        label={`${assets.filter(a => a.riskLevel === 'Low').length} Low`} 
                        sx={{ bgcolor: 'success.light', mr: 1 }} 
                      />
                      <Chip 
                        size="small" 
                        label={`${assets.filter(a => a.riskLevel === 'Medium').length} Medium`} 
                        sx={{ bgcolor: 'warning.light', mr: 1 }} 
                      />
                      <Chip 
                        size="small" 
                        label={`${assets.filter(a => a.riskLevel === 'High').length} High`} 
                        sx={{ bgcolor: 'error.light' }} 
                      />
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button variant="outlined" size="small" fullWidth>View Detailed Risk Report</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No recent activity to display
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* NFT Assets Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Search assets..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: '50%' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              size="small"
              sx={{ mr: 1 }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              size="small"
            >
              Sort
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <Grid item xs={12} sm={6} md={4} key={asset.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={asset.image}
                      alt={asset.name}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                      }}
                      onClick={() => handleToggleFavorite(asset.id)}
                    >
                      {asset.favorite ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                    {asset.riskLevel === 'High' && (
                      <Chip
                        icon={<WarningIcon />}
                        label="High Risk"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          bgcolor: 'error.main',
                          color: 'white',
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" component="div" noWrap>
                          {asset.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {asset.collection}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => handleAssetMenuClick(e, asset.id)}>
                        <MoreIcon />
                      </IconButton>
                    </Box>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Current Value</Typography>
                        <Typography variant="body1">{formatCurrency(asset.currentValue)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Change</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getValueChangeIcon(asset.valueChange)}
                          <Typography 
                            variant="body1" 
                            color={getValueChangeColor(asset.valueChange)}
                            sx={{ ml: 0.5 }}
                          >
                            {asset.valueChange > 0 ? '+' : ''}{asset.valueChange.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Trust Score</Typography>
                        <Typography variant="body1">{asset.trustScore}/100</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Risk Level</Typography>
                        <Typography variant="body1" color={getRiskLevelColor(asset.riskLevel)}>
                          {asset.riskLevel}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button variant="outlined" fullWidth size="small">
                      View Details
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">No assets found matching your search criteria.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>
      
      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1" paragraph>
          Detailed analytics about your portfolio performance will be displayed here.
        </Typography>
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Analytics Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We're working on advanced analytics features to help you track and optimize your NFT portfolio performance.
          </Typography>
        </Box>
      </TabPanel>
      
      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem onClick={() => handleSort('value')}>Sort by Value</MenuItem>
        <MenuItem onClick={() => handleSort('trustScore')}>Sort by Trust Score</MenuItem>
        <MenuItem onClick={() => handleSort('change')}>Sort by Price Change</MenuItem>
        <MenuItem onClick={() => handleSort('date')}>Sort by Last Updated</MenuItem>
      </Menu>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => handleFilter('all')}>All Assets</MenuItem>
        <MenuItem onClick={() => handleFilter('favorites')}>Favorites</MenuItem>
        <MenuItem onClick={() => handleFilter('highRisk')}>High Risk</MenuItem>
        <MenuItem onClick={() => handleFilter('gainers')}>Gainers</MenuItem>
        <MenuItem onClick={() => handleFilter('losers')}>Losers</MenuItem>
      </Menu>
      
      {/* Asset Action Menu */}
      <Menu
        anchorEl={assetMenuAnchorEl}
        open={Boolean(assetMenuAnchorEl)}
        onClose={handleAssetMenuClose}
      >
        <MenuItem onClick={handleAssetMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleAssetMenuClose}>Analyze Risk</MenuItem>
        <MenuItem onClick={handleAssetMenuClose}>Update Value</MenuItem>
        <MenuItem onClick={handleAssetMenuClose}>Remove from Portfolio</MenuItem>
      </Menu>
    </Paper>
  );
};

export default Portfolio;
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
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
      style={{ width: '100%', height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%', width: '100%' }}>
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

const Portfolio: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [assets, setAssets] = useState<NFTAsset[]>(mockNFTAssets);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [assetMenuAnchorEl, setAssetMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
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
      default:
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
      default:
        break;
    }
    
    setAssets(filteredAssets);
    handleFilterClose();
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setAssets(mockNFTAssets);
    } else {
      const filteredAssets = mockNFTAssets.filter(asset => 
        asset.name.toLowerCase().includes(query.toLowerCase()) ||
        asset.collection.toLowerCase().includes(query.toLowerCase())
      );
      setAssets(filteredAssets);
    }
  };
  
  const handleToggleFavorite = (assetId: string) => {
    const updatedAssets = assets.map(asset => 
      asset.id === assetId 
        ? { ...asset, favorite: !asset.favorite } 
        : asset
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
  
  const portfolioStats = calculatePortfolioStats(assets);
  
  return (
    <Paper elevation={3} sx={{ p: 0, borderRadius: 2, overflow: 'hidden', width: '100%', height: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="portfolio tabs"
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="Assets" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>Portfolio Summary</Typography>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="h4">{formatCurrency(portfolioStats.totalValue)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getValueChangeIcon(portfolioStats.totalGainLoss)}
                    <Typography 
                      variant="body1" 
                      sx={{ color: getValueChangeColor(portfolioStats.totalGainLoss), ml: 1, fontWeight: 'medium' }}
                    >
                      {formatCurrency(portfolioStats.totalGainLoss)} ({portfolioStats.gainLossPercentage.toFixed(2)}%)
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  mt: 2
                }}>
                  <Typography variant="body2">Total Assets: <Box component="span" sx={{ fontWeight: 'medium' }}>{portfolioStats.totalAssets}</Box></Typography>
                  <Typography variant="body2">Highest Value: <Box component="span" sx={{ fontWeight: 'medium' }}>{portfolioStats.highestValue.name} ({formatCurrency(portfolioStats.highestValue.value)})</Box></Typography>
                  <Typography variant="body2">Lowest Trust Score: <Box component="span" sx={{ fontWeight: 'medium' }}>{portfolioStats.lowestTrustScore.name} ({portfolioStats.lowestTrustScore.score}%)</Box></Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>Risk Distribution</Typography>
                {/* Risk distribution chart would go here */}
                <Box sx={{ height: { xs: 300, md: 340 }, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Low Risk', value: 60, color: 'success.main' },
                          { name: 'Medium Risk', value: 30, color: 'warning.main' },
                          { name: 'High Risk', value: 10, color: 'error.main' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#4caf50" />
                        <Cell fill="#ff9800" />
                        <Cell fill="#f44336" />
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value}%`}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        content={({ payload }) => (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                            {payload?.map((entry) => (
                              <Chip
                                key={entry.value}
                                label={`${entry.value} (${entry.payload.value}%)`}
                                size="small"
                                sx={{
                                  bgcolor: entry.color,
                                  color: 'white',
                                  '& .MuiChip-label': { px: 2 }
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { date: '2023-09-11', value: 350 },
                        { date: '2023-09-12', value: 380 },
                        { date: '2023-09-13', value: 420 },
                        { date: '2023-09-14', value: 390 },
                        { date: '2023-09-15', value: 450 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis
                        tickFormatter={(value) => `${value} ETH`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} ETH`, 'Portfolio Value']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2196f3"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search assets..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              sx={{ mr: 1 }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
            >
              Sort
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
            >
              <MenuItem onClick={() => handleSort('value')}>By Value</MenuItem>
              <MenuItem onClick={() => handleSort('trustScore')}>By Trust Score</MenuItem>
              <MenuItem onClick={() => handleSort('change')}>By Change</MenuItem>
              <MenuItem onClick={() => handleSort('date')}>By Date</MenuItem>
            </Menu>
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
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          {filteredAssets.map((asset) => (
            <Grid item xs={12} sm={6} md={4} key={asset.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={asset.image}
                  alt={asset.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div">
                      {asset.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleToggleFavorite(asset.id)}
                      color={asset.favorite ? 'primary' : 'default'}
                    >
                      {asset.favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {asset.collection}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Current Value:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(asset.currentValue)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Purchase Price:</Typography>
                    <Typography variant="body2">
                      {formatCurrency(asset.purchasePrice)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Change:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getValueChangeIcon(asset.valueChange)}
                      <Typography 
                        variant="body2" 
                        sx={{ color: getValueChangeColor(asset.valueChange), ml: 0.5 }}
                      >
                        {asset.valueChange.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Trust Score:</Typography>
                    <Typography variant="body2">
                      {asset.trustScore}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Risk Level:</Typography>
                    <Chip 
                      label={asset.riskLevel} 
                      size="small" 
                      sx={{ 
                        color: 'white', 
                        bgcolor: getRiskLevelColor(asset.riskLevel),
                        height: 20,
                        '& .MuiChip-label': { px: 1, py: 0 }
                      }} 
                    />
                  </Box>
                </CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    Updated: {asset.lastUpdated}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleAssetMenuClick(e, asset.id)}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
          
          {filteredAssets.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">No assets found matching your criteria.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
        
        <Menu
          anchorEl={assetMenuAnchorEl}
          open={Boolean(assetMenuAnchorEl)}
          onClose={handleAssetMenuClose}
        >
          <MenuItem onClick={handleAssetMenuClose}>View Details</MenuItem>
          <MenuItem onClick={handleAssetMenuClose}>Edit Asset</MenuItem>
          <MenuItem onClick={handleAssetMenuClose}>Remove from Portfolio</MenuItem>
        </Menu>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Portfolio Analytics</Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>Historical Performance</Typography>
                <Box sx={{ 
                  height: 250, 
                  bgcolor: 'background.paper', 
                  p: 2, 
                  borderRadius: 1, 
                  mb: 2,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* Mock chart with trend line */}
                    <Box sx={{ 
                      width: '100%', 
                      height: '80%', 
                      position: 'relative',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      mt: 2
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '60%',
                        background: 'linear-gradient(90deg, #3f51b5 0%, #2196f3 100%)',
                        clipPath: 'polygon(0 100%, 10% 70%, 20% 85%, 30% 50%, 40% 60%, 50% 40%, 60% 50%, 70% 30%, 80% 45%, 90% 20%, 100% 35%, 100% 100%)',
                        opacity: 0.2
                      }} />
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        zIndex: 2
                      }}>
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline 
                            points="0,70 10,50 20,65 30,30 40,40 50,20 60,30 70,10 80,25 90,0 100,15" 
                            fill="none" 
                            stroke="#3f51b5" 
                            strokeWidth="2"
                          />
                        </svg>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption">Jan</Typography>
                      <Typography variant="caption">Feb</Typography>
                      <Typography variant="caption">Mar</Typography>
                      <Typography variant="caption">Apr</Typography>
                      <Typography variant="caption">May</Typography>
                      <Typography variant="caption">Jun</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>Risk Analysis</Typography>
                <Box sx={{ 
                  height: 250, 
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  {/* Radar chart for risk analysis */}
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ 
                      width: 200, 
                      height: 200, 
                      borderRadius: '50%', 
                      border: '1px solid',
                      borderColor: 'divider',
                      position: 'relative'
                    }}>
                      <Box sx={{ 
                        width: 150, 
                        height: 150, 
                        borderRadius: '50%', 
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }} />
                      <Box sx={{ 
                        width: 100, 
                        height: 100, 
                        borderRadius: '50%', 
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }} />
                      <Box sx={{ 
                        width: 50, 
                        height: 50, 
                        borderRadius: '50%', 
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }} />
                      <svg width="200" height="200" viewBox="0 0 200 200">
                        <polygon 
                          points="100,30 140,60 130,120 70,120 60,60" 
                          fill="rgba(63, 81, 181, 0.5)" 
                          stroke="#3f51b5" 
                          strokeWidth="2"
                        />
                      </svg>
                      <Box sx={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)' }}>
                        <Typography variant="caption">Volatility</Typography>
                      </Box>
                      <Box sx={{ position: 'absolute', top: '40%', right: 20 }}>
                        <Typography variant="caption">Liquidity</Typography>
                      </Box>
                      <Box sx={{ position: 'absolute', bottom: 30, right: '30%' }}>
                        <Typography variant="caption">Market Risk</Typography>
                      </Box>
                      <Box sx={{ position: 'absolute', bottom: 30, left: '30%' }}>
                        <Typography variant="caption">Technical Risk</Typography>
                      </Box>
                      <Box sx={{ position: 'absolute', top: '40%', left: 20 }}>
                        <Typography variant="caption">Regulatory</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>Correlation with Market Trends</Typography>
                <Box sx={{ 
                  height: 200, 
                  bgcolor: 'background.paper', 
                  p: 2, 
                  borderRadius: 1,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <Typography variant="body2" gutterBottom>ETH Correlation</Typography>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', height: 10, borderRadius: 5 }}>
                      <Box sx={{ width: '75%', bgcolor: 'primary.main', height: 10, borderRadius: 5 }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption">0</Typography>
                      <Typography variant="caption">0.75</Typography>
                      <Typography variant="caption">1.0</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <Typography variant="body2" gutterBottom>NFT Market Correlation</Typography>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', height: 10, borderRadius: 5 }}>
                      <Box sx={{ width: '90%', bgcolor: 'primary.main', height: 10, borderRadius: 5 }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption">0</Typography>
                      <Typography variant="caption">0.9</Typography>
                      <Typography variant="caption">1.0</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" gutterBottom>Blue Chip NFT Correlation</Typography>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', height: 10, borderRadius: 5 }}>
                      <Box sx={{ width: '60%', bgcolor: 'primary.main', height: 10, borderRadius: 5 }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption">0</Typography>
                      <Typography variant="caption">0.6</Typography>
                      <Typography variant="caption">1.0</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>Diversification Metrics</Typography>
                <Box sx={{ 
                  height: 200, 
                  p: 2, 
                  borderRadius: 1,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ 
                      width: 200, 
                      height: 200, 
                      position: 'relative',
                      borderRadius: '50%',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%', 
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)', 
                        bgcolor: '#3f51b5' 
                      }} />
                      <Box sx={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%', 
                        clipPath: 'polygon(0 0, 100% 0, 0 100%, 0 0)', 
                        bgcolor: '#f50057' 
                      }} />
                      <Box sx={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%', 
                        clipPath: 'polygon(0 100%, 100% 0, 100% 100%, 0 100%)', 
                        bgcolor: '#ff9800' 
                      }} />
                      <Box sx={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%', 
                        clipPath: 'polygon(0 0, 0 100%, 100% 100%, 0 0)', 
                        bgcolor: '#2e7d32' 
                      }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: '#3f51b5', mr: 1 }} />
                      <Typography variant="caption">Art 40%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: '#f50057', mr: 1 }} />
                      <Typography variant="caption">Collectibles 25%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: '#ff9800', mr: 1 }} />
                      <Typography variant="caption">Gaming 20%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: '#2e7d32', mr: 1 }} />
                      <Typography variant="caption">Utility 15%</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default Portfolio;
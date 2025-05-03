import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  Treemap
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';

// Mock data for demonstration
const mockCategoryPerformance = [
  { category: 'Art', avgTrustScore: 78, volume: 1250, growth: 15, liquidity: 82 },
  { category: 'Collectibles', avgTrustScore: 72, volume: 2100, growth: 8, liquidity: 75 },
  { category: 'Gaming', avgTrustScore: 81, volume: 1800, growth: 22, liquidity: 88 },
  { category: 'Metaverse', avgTrustScore: 76, volume: 950, growth: 18, liquidity: 70 },
  { category: 'Music', avgTrustScore: 69, volume: 580, growth: 5, liquidity: 65 },
  { category: 'Sports', avgTrustScore: 74, volume: 1100, growth: 12, liquidity: 79 },
];

const mockTrendData = [
  { month: 'Jan', art: 950, collectibles: 1800, gaming: 1200, metaverse: 600, music: 400, sports: 850 },
  { month: 'Feb', art: 1050, collectibles: 1750, gaming: 1350, metaverse: 700, music: 450, sports: 900 },
  { month: 'Mar', art: 1100, collectibles: 1900, gaming: 1500, metaverse: 800, music: 500, sports: 950 },
  { month: 'Apr', art: 1200, collectibles: 2000, gaming: 1650, metaverse: 850, music: 520, sports: 1000 },
  { month: 'May', art: 1250, collectibles: 2100, gaming: 1800, metaverse: 950, music: 580, sports: 1100 },
];

const mockEmergingCollections = [
  { name: 'Quantum Pixels', category: 'Art', growth: 45, trustScore: 82, volume: 320 },
  { name: 'Meta Legends', category: 'Gaming', growth: 38, trustScore: 79, volume: 280 },
  { name: 'Digital Dreamers', category: 'Metaverse', growth: 32, trustScore: 75, volume: 210 },
  { name: 'Sound Waves', category: 'Music', growth: 28, trustScore: 71, volume: 150 },
  { name: 'Collectible Heroes', category: 'Collectibles', growth: 25, trustScore: 77, volume: 190 },
];

const mockCorrelationData = [
  { category: 'Art', trustScore: 78, volume: 1250, size: 15 },
  { category: 'Collectibles', trustScore: 72, volume: 2100, size: 21 },
  { category: 'Gaming', trustScore: 81, volume: 1800, size: 18 },
  { category: 'Metaverse', trustScore: 76, volume: 950, size: 9.5 },
  { category: 'Music', trustScore: 69, volume: 580, size: 5.8 },
  { category: 'Sports', trustScore: 74, volume: 1100, size: 11 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const MarketSegmentAnalysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('1m');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Art', 'Gaming', 'Collectibles']);
  const [openDialog, setOpenDialog] = useState(false);
  const [customSegmentName, setCustomSegmentName] = useState('');
  const [customSegmentCategories, setCustomSegmentCategories] = useState<string[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCreateCustomSegment = () => {
    // In a real application, this would save the custom segment
    console.log('Created custom segment:', {
      name: customSegmentName,
      categories: customSegmentCategories
    });
    setOpenDialog(false);
    setCustomSegmentName('');
    setCustomSegmentCategories([]);
  };

  const handleCustomCategoryToggle = (category: string) => {
    if (customSegmentCategories.includes(category)) {
      setCustomSegmentCategories(customSegmentCategories.filter(c => c !== category));
    } else {
      setCustomSegmentCategories([...customSegmentCategories, category]);
    }
  };

  // Filter data based on selected categories
  const filteredCategoryPerformance = mockCategoryPerformance.filter(item => 
    selectedCategories.includes(item.category)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Market Segment Analysis</Typography>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={handleTimeRangeChange} label="Time Range">
            <MenuItem value="1w">1 Week</MenuItem>
            <MenuItem value="1m">1 Month</MenuItem>
            <MenuItem value="3m">3 Months</MenuItem>
            <MenuItem value="6m">6 Months</MenuItem>
            <MenuItem value="1y">1 Year</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {mockCategoryPerformance.map(item => (
            <Chip 
              key={item.category}
              label={item.category}
              color={selectedCategories.includes(item.category) ? 'primary' : 'default'}
              onClick={() => handleCategoryToggle(item.category)}
              sx={{ fontWeight: selectedCategories.includes(item.category) ? 'bold' : 'normal' }}
            />
          ))}
        </Box>
        
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
          sx={{ ml: 'auto' }}
        >
          Custom Segment
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Category Performance Comparison */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Category Performance Comparison</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={filteredCategoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgTrustScore" name="Avg Trust Score" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="volume" name="Volume (ETH)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Identification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Trend Identification Across Segments</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  {selectedCategories.includes('Art') && (
                    <Line type="monotone" dataKey="art" stroke="#8884d8" name="Art" />
                  )}
                  {selectedCategories.includes('Collectibles') && (
                    <Line type="monotone" dataKey="collectibles" stroke="#82ca9d" name="Collectibles" />
                  )}
                  {selectedCategories.includes('Gaming') && (
                    <Line type="monotone" dataKey="gaming" stroke="#ffc658" name="Gaming" />
                  )}
                  {selectedCategories.includes('Metaverse') && (
                    <Line type="monotone" dataKey="metaverse" stroke="#ff8042" name="Metaverse" />
                  )}
                  {selectedCategories.includes('Music') && (
                    <Line type="monotone" dataKey="music" stroke="#0088fe" name="Music" />
                  )}
                  {selectedCategories.includes('Sports') && (
                    <Line type="monotone" dataKey="sports" stroke="#00C49F" name="Sports" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Emerging Collection Spotlighting */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Emerging Collection Spotlighting</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Collection</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Growth</TableCell>
                      <TableCell>Trust Score</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockEmergingCollections
                      .filter(collection => selectedCategories.includes(collection.category))
                      .map((collection, index) => (
                        <TableRow key={index}>
                          <TableCell>{collection.name}</TableCell>
                          <TableCell>
                            <Chip label={collection.category} size="small" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                              {collection.growth}%
                            </Box>
                          </TableCell>
                          <TableCell>{collection.trustScore}</TableCell>
                          <TableCell>
                            <Tooltip title="Set Alert">
                              <IconButton size="small">
                                <NotificationsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Button size="small" variant="outlined" sx={{ ml: 1 }}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredCategoryPerformance.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Select at least one category to view emerging collections.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cross-segment Correlation Mapping */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Cross-segment Correlation Mapping</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="trustScore" name="Trust Score" domain={[60, 85]} />
                  <YAxis type="number" dataKey="volume" name="Volume (ETH)" />
                  <ZAxis type="number" dataKey="size" range={[100, 500]} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
                          <p><strong>{data.category}</strong></p>
                          <p>Trust Score: {data.trustScore}</p>
                          <p>Volume: {data.volume} ETH</p>
                          <p>Liquidity: {mockCategoryPerformance.find(c => c.category === data.category)?.liquidity}%</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                  <Scatter 
                    name="Categories" 
                    data={mockCorrelationData.filter(item => selectedCategories.includes(item.category))} 
                    fill="#8884d8"
                  >
                    {mockCorrelationData
                      .filter(item => selectedCategories.includes(item.category))
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Exploration Features */}
        <Grid item xs={12}>
          <Paper>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Volume & Liquidity Analysis" />
              <Tab label="Risk Concentration" />
              <Tab label="Historical Performance" />
            </Tabs>
            
            {/* Volume & Liquidity Analysis Tab */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle1" gutterBottom>Volume & Liquidity by Category</Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={filteredCategoryPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="volume" name="Volume (ETH)" fill="#82ca9d" />
                        <Bar yAxisId="right" dataKey="liquidity" name="Liquidity (%)" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>Key Insights</Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Gaming and Art categories show the highest liquidity rates, making them more suitable for quick trades.
                    </Alert>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Music NFTs have lower liquidity despite growing interest, indicating potential investment risks.
                    </Alert>
                    <Alert severity="success">
                      Collectibles maintain the highest trading volume, suggesting sustained market interest.
                    </Alert>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Risk Concentration Tab */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Risk Concentration Visualization</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <Treemap
                    data={filteredCategoryPerformance.map(item => ({
                      name: item.category,
                      size: item.volume,
                      riskScore: 100 - item.avgTrustScore, // Inverting trust score to get risk
                    }))}
                    dataKey="size"
                    aspectRatio={4/3}
                    stroke="#fff"
                    fill="#8884d8"
                  >
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
                              <p><strong>{data.name}</strong></p>
                              <p>Volume: {data.size} ETH</p>
                              <p>Risk Score: {data.riskScore}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Box size represents trading volume, while color intensity indicates risk level. Larger, darker boxes represent higher risk concentration.
                </Typography>
              </Box>
            )}
            
            {/* Historical Performance Tab */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Historical Performance Comparison</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select categories and time periods to compare historical performance metrics.
                </Alert>
                <Typography variant="body1">
                  This section would implement detailed historical performance comparisons across selected market segments, allowing users to identify long-term trends and make more informed investment decisions.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Custom Segment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Custom Market Segment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Segment Name"
            type="text"
            fullWidth
            variant="outlined"
            value={customSegmentName}
            onChange={(e) => setCustomSegmentName(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle1" gutterBottom>Select Categories</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {mockCategoryPerformance.map(item => (
              <Chip 
                key={item.category}
                label={item.category}
                color={customSegmentCategories.includes(item.category) ? 'primary' : 'default'}
                onClick={() => handleCustomCategoryToggle(item.category)}
              />
            ))}
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Segment Description (Optional)</Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Describe the purpose of this custom segment..."
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateCustomSegment} 
            variant="contained" 
            disabled={!customSegmentName || customSegmentCategories.length === 0}
          >
            Create Segment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketSegmentAnalysis;
import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Tabs, 
  Tab, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Slider,
  Chip,
  Button,
  Divider
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for demonstration
const mockTrustScoreDistribution = [
  { score: '0-10', count: 5 },
  { score: '11-20', count: 12 },
  { score: '21-30', count: 18 },
  { score: '31-40', count: 25 },
  { score: '41-50', count: 30 },
  { score: '51-60', count: 45 },
  { score: '61-70', count: 38 },
  { score: '71-80', count: 28 },
  { score: '81-90', count: 15 },
  { score: '91-100', count: 8 },
];

const mockPriceTrends = [
  { date: '2023-01', floorPrice: 0.5, avgPrice: 0.8, volume: 120 },
  { date: '2023-02', floorPrice: 0.6, avgPrice: 0.9, volume: 150 },
  { date: '2023-03', floorPrice: 0.7, avgPrice: 1.1, volume: 200 },
  { date: '2023-04', floorPrice: 0.9, avgPrice: 1.3, volume: 180 },
  { date: '2023-05', floorPrice: 1.1, avgPrice: 1.5, volume: 220 },
  { date: '2023-06', floorPrice: 1.0, avgPrice: 1.4, volume: 190 },
];

const mockRarityDistribution = [
  { name: 'Common', value: 65 },
  { name: 'Uncommon', value: 20 },
  { name: 'Rare', value: 10 },
  { name: 'Epic', value: 4 },
  { name: 'Legendary', value: 1 },
];

const mockCollectionItems = [
  { id: 1, name: 'NFT #1', trustScore: 85, rarity: 'Rare', price: 1.2, risk: 'Low' },
  { id: 2, name: 'NFT #2', trustScore: 72, rarity: 'Uncommon', price: 0.8, risk: 'Medium' },
  { id: 3, name: 'NFT #3', trustScore: 91, rarity: 'Epic', price: 2.5, risk: 'Low' },
  { id: 4, name: 'NFT #4', trustScore: 65, rarity: 'Common', price: 0.5, risk: 'Medium' },
  { id: 5, name: 'NFT #5', trustScore: 78, rarity: 'Uncommon', price: 0.9, risk: 'Low' },
  { id: 6, name: 'NFT #6', trustScore: 45, rarity: 'Common', price: 0.3, risk: 'High' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CollectionOverviewDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState('trustScore');
  const [filterRarity, setFilterRarity] = useState('All');
  const [trustScoreRange, setTrustScoreRange] = useState<number[]>([0, 100]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
  };

  const handleFilterChange = (event: any) => {
    setFilterRarity(event.target.value);
  };

  const handleTrustScoreRangeChange = (event: Event, newValue: number | number[]) => {
    setTrustScoreRange(newValue as number[]);
  };

  // Filter and sort collection items
  const filteredItems = mockCollectionItems
    .filter(item => {
      if (filterRarity !== 'All' && item.rarity !== filterRarity) return false;
      if (item.trustScore < trustScoreRange[0] || item.trustScore > trustScoreRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'trustScore') return b.trustScore - a.trustScore;
      if (sortBy === 'price') return b.price - a.price;
      return 0;
    });

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', p: 0 }}>
      <Typography variant="h4" sx={{ mb: 3, px: 3, pt: 3 }}>Collection Overview Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ m: 0, width: '100%', px: 3, pb: 3 }}>
        {/* Trust Score Distribution */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6">Trust Score Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockTrustScoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of NFTs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Price Trend Analysis */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6">Price Trend Analysis</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockPriceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="floorPrice" stroke="#8884d8" name="Floor Price (ETH)" />
                  <Line yAxisId="left" type="monotone" dataKey="avgPrice" stroke="#82ca9d" name="Avg Price (ETH)" />
                  <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#ffc658" name="Volume" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Rarity Distribution */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6">Rarity Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockRarityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockRarityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Collection-wide Risk Assessment */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6">Collection-wide Risk Assessment</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">72</Typography>
                  <Typography variant="body2">Overall Trust Score</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">Low</Typography>
                  <Typography variant="body2">Risk Level</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">95%</Typography>
                  <Typography variant="body2">Verified Metadata</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Risk Factors:</Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label="Low Liquidity" size="small" sx={{ mr: 1, mb: 1, bgcolor: '#ff9800', color: '#ffffff' }} />
                <Chip label="Price Volatility" size="small" sx={{ mr: 1, mb: 1, bgcolor: '#ff9800', color: '#ffffff' }} />
                <Chip label="New Creator" size="small" sx={{ mr: 1, mb: 1, bgcolor: '#ff9800', color: '#ffffff' }} />
                <Chip label="Strong Community" size="small" sx={{ mr: 1, mb: 1, bgcolor: '#4caf50', color: '#ffffff' }} />
                <Chip label="Verified Contract" size="small" sx={{ mr: 1, mb: 1, bgcolor: '#4caf50', color: '#ffffff' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Collection Exploration Tools */}
        <Grid item xs={12}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6">Collection Explorer</Typography>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Grid View" />
                  <Tab label="Comparative Analysis" />
                  <Tab label="Historical Trends" />
                </Tabs>
              </Box>
              
              <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select value={sortBy} onChange={handleSortChange} label="Sort By">
                    <MenuItem value="trustScore">Trust Score</MenuItem>
                    <MenuItem value="price">Price</MenuItem>
                    <MenuItem value="rarity">Rarity</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Filter Rarity</InputLabel>
                  <Select value={filterRarity} onChange={handleFilterChange} label="Filter Rarity">
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Common">Common</MenuItem>
                    <MenuItem value="Uncommon">Uncommon</MenuItem>
                    <MenuItem value="Rare">Rare</MenuItem>
                    <MenuItem value="Epic">Epic</MenuItem>
                    <MenuItem value="Legendary">Legendary</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ width: 200, ml: 2 }}>
                  <Typography variant="body2" gutterBottom>Trust Score Range</Typography>
                  <Slider
                    value={trustScoreRange}
                    onChange={handleTrustScoreRangeChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                  />
                </Box>
                
                <Button variant="outlined" sx={{ ml: 'auto' }}>Export Data</Button>
                <Button variant="contained">Identify Outliers</Button>
              </Box>
              
              {tabValue === 0 && (
                <Grid container spacing={2}>
                  {filteredItems.map(item => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="h6">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Rarity: {item.rarity}</Typography>
                          <Typography variant="body2" color="text.secondary">Price: {item.price} ETH</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>Trust Score:</Typography>
                            <Box
                              sx={{
                                width: '100%',
                                bgcolor: 'grey.300',
                                borderRadius: 5,
                                height: 10,
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${item.trustScore}%`,
                                  bgcolor: item.trustScore > 80 ? 'success.main' : item.trustScore > 50 ? 'warning.main' : 'error.main',
                                  borderRadius: 5,
                                  height: 10,
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ ml: 1 }}>{item.trustScore}</Typography>
                          </Box>
                          <Chip 
                            label={item.risk} 
                            size="small" 
                            sx={{ mt: 1 }}
                            color={item.risk === 'Low' ? 'success' : item.risk === 'Medium' ? 'warning' : 'error'}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {tabValue === 1 && (
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="trustScore" name="Trust Score" domain={[0, 100]} />
                    <YAxis type="number" dataKey="price" name="Price (ETH)" />
                    <ZAxis type="category" dataKey="rarity" name="Rarity" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="NFTs" data={filteredItems} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
              
              {tabValue === 2 && (
                <Typography variant="body1">Historical trend visualization would be implemented here, showing how the collection has evolved over time in terms of trust scores, prices, and other metrics.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CollectionOverviewDashboard;
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  LocalOffer as LocalOfferIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface CollectionStats {
  floorPrice: number;
  floorPriceChange: number;
  volume24h: number;
  volumeChange: number;
  holders: number;
  holdersChange: number;
  listings: number;
  listingsChange: number;
  averagePrice: number;
  averagePriceChange: number;
}

interface MarketMetrics {
  label: string;
  value: number;
  change: number;
  info: string;
}

interface CollectionOverviewProps {
  collectionName: string;
  description: string;
  stats: CollectionStats;
  trustScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  marketMetrics: MarketMetrics[];
  volumeHistory: Array<{ date: string; volume: number }>;
}

const CollectionOverview: React.FC<CollectionOverviewProps> = ({
  collectionName,
  description,
  stats,
  trustScore,
  riskLevel,
  marketMetrics,
  volumeHistory,
}) => {
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'success.main' : 'error.main';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'Low':
        return 'success.main';
      case 'Medium':
        return 'warning.main';
      case 'High':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', p: 0 }}>
      <Grid container spacing={2} sx={{ m: 0, width: '100%' }}>
        {/* Collection Header */}
        <Grid item xs={12}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                  {collectionName}
                </Typography>
                <Box>
                  <Chip
                    label={`Trust Score: ${trustScore}%`}
                    color={trustScore >= 70 ? 'success' : trustScore >= 50 ? 'warning' : 'error'}
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`Risk: ${riskLevel}`}
                    sx={{ bgcolor: getRiskLevelColor(riskLevel), color: 'white' }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6" gutterBottom>
                Key Metrics
              </Typography>
              <Grid container spacing={2} sx={{ m: 0, width: '100%' }}>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Floor Price
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" component="span">
                        {formatCurrency(stats.floorPrice)}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: getChangeColor(stats.floorPriceChange),
                          ml: 1,
                        }}
                      >
                        {getChangeIcon(stats.floorPriceChange)}
                        <Typography variant="body2">
                          {formatNumber(Math.abs(stats.floorPriceChange))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      24h Volume
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" component="span">
                        {formatCurrency(stats.volume24h)}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: getChangeColor(stats.volumeChange),
                          ml: 1,
                        }}
                      >
                        {getChangeIcon(stats.volumeChange)}
                        <Typography variant="body2">
                          {formatNumber(Math.abs(stats.volumeChange))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Holders
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" component="span">
                        {stats.holders.toLocaleString()}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: getChangeColor(stats.holdersChange),
                          ml: 1,
                        }}
                      >
                        {getChangeIcon(stats.holdersChange)}
                        <Typography variant="body2">
                          {formatNumber(Math.abs(stats.holdersChange))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Active Listings
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" component="span">
                        {stats.listings.toLocaleString()}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: getChangeColor(stats.listingsChange),
                          ml: 1,
                        }}
                      >
                        {getChangeIcon(stats.listingsChange)}
                        <Typography variant="body2">
                          {formatNumber(Math.abs(stats.listingsChange))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6" gutterBottom>
                Market Analysis
              </Typography>
              {marketMetrics.map((metric, index) => (
                <Box key={metric.label} sx={{ mb: index < marketMetrics.length - 1 ? 2 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">{metric.label}</Typography>
                      <Tooltip title={metric.info}>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ mr: 1 }}>
                        {formatNumber(metric.value)}%
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: getChangeColor(metric.change),
                        }}
                      >
                        {getChangeIcon(metric.change)}
                        <Typography variant="body2">
                          {formatNumber(Math.abs(metric.change))}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Math.max(metric.value, 0), 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Volume History Chart */}
        <Grid item xs={12}>
          <Card elevation={1} sx={{ height: '100%', width: '100%', m: 0 }}>
            <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6" gutterBottom>
                Trading Volume History
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={volumeHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tickFormatter={(value) => `${value} ETH`} />
                    <RechartsTooltip
                      formatter={(value: number) => [`${value} ETH`, 'Volume']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Bar dataKey="volume" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CollectionOverview;
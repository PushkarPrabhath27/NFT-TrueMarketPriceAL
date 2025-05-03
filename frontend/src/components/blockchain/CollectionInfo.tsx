import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface CollectionStats {
  floorPrice: number;
  totalVolume: number;
  holders: number;
  items: number;
  averagePrice: number;
  marketCap: number;
}

interface PriceHistory {
  date: string;
  price: number;
}

interface CollectionInfoProps {
  name: string;
  description: string;
  stats: CollectionStats;
  priceHistory: PriceHistory[];
  verified: boolean;
  category: string;
  blockchain: string;
}

const StatItem: React.FC<{ label: string; value: string | number; tooltip?: string }> = ({
  label,
  value,
  tooltip,
}) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip}>
          <IconButton size="small" sx={{ ml: 0.5 }}>
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
    <Typography variant="h6">{value}</Typography>
  </Box>
);

const CollectionInfo: React.FC<CollectionInfoProps> = ({
  name,
  description,
  stats,
  priceHistory,
  verified,
  category,
  blockchain,
}) => {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', my: 2 }}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {name}
            {verified && (
              <Tooltip title="Verified Collection">
                <IconButton color="primary" size="small">
                  <InfoOutlined />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
          <Typography color="text.secondary" paragraph>
            {description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Category: {category}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Blockchain: {blockchain}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StatItem
              label="Floor Price"
              value={formatCurrency(stats.floorPrice)}
              tooltip="Lowest price of available NFTs in the collection"
            />
            <StatItem
              label="Total Volume"
              value={formatCurrency(stats.totalVolume)}
              tooltip="Total trading volume of the collection"
            />
            <StatItem
              label="Market Cap"
              value={formatCurrency(stats.marketCap)}
              tooltip="Total market value of the collection"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatItem
              label="Holders"
              value={formatNumber(stats.holders)}
              tooltip="Number of unique holders"
            />
            <StatItem
              label="Items"
              value={formatNumber(stats.items)}
              tooltip="Total number of NFTs in the collection"
            />
            <StatItem
              label="Average Price"
              value={formatCurrency(stats.averagePrice)}
              tooltip="Average sale price over the last 30 days"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Price History
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Bar dataKey="price" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CollectionInfo;
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Grid,
  Chip,
  Link,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Twitter, Language, VerifiedUser } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface CreatorStats {
  totalSales: number;
  totalVolume: number;
  averagePrice: number;
  collections: number;
  uniqueBuyers: number;
  successRate: number;
}

interface SalesDistribution {
  name: string;
  value: number;
}

interface CreatorProfileProps {
  name: string;
  avatar: string;
  bio: string;
  verified: boolean;
  joinDate: string;
  website?: string;
  twitter?: string;
  stats: CreatorStats;
  salesDistribution: SalesDistribution[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CreatorProfile: React.FC<CreatorProfileProps> = ({
  name,
  avatar,
  bio,
  verified,
  joinDate,
  website,
  twitter,
  stats,
  salesDistribution,
}) => {
  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', my: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={avatar}
            alt={name}
            sx={{ width: 80, height: 80, mr: 2 }}
          />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5">{name}</Typography>
              {verified && (
                <Tooltip title="Verified Creator">
                  <VerifiedUser color="primary" />
                </Tooltip>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Joined {joinDate}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {website && (
                <IconButton
                  component={Link}
                  href={website}
                  target="_blank"
                  size="small"
                >
                  <Language />
                </IconButton>
              )}
              {twitter && (
                <IconButton
                  component={Link}
                  href={`https://twitter.com/${twitter}`}
                  target="_blank"
                  size="small"
                >
                  <Twitter />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>

        <Typography variant="body1" paragraph>
          {bio}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Sales
            </Typography>
            <Typography variant="h6">{formatNumber(stats.totalSales)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Volume
            </Typography>
            <Typography variant="h6">{formatCurrency(stats.totalVolume)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Average Price
            </Typography>
            <Typography variant="h6">{formatCurrency(stats.averagePrice)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Collections
            </Typography>
            <Typography variant="h6">{stats.collections}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Unique Buyers
            </Typography>
            <Typography variant="h6">{formatNumber(stats.uniqueBuyers)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Success Rate
            </Typography>
            <Typography variant="h6">{stats.successRate}%</Typography>
          </Grid>
        </Grid>

        <Box sx={{ height: 300 }}>
          <Typography variant="h6" gutterBottom>
            Sales Distribution
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={salesDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {salesDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreatorProfile;
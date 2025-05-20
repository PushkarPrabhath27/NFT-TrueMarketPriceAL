import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface Collection {
  name: string;
  floorPrice: number;
  volume: number;
  items: number;
  holders: number;
}

interface CreatorStats {
  totalSales: number;
  avgPrice: number;
  totalVolume: number;
  uniqueCollectors: number;
}

interface CreatorHistory {
  date: string;
  sales: number;
  volume: number;
}

interface CreatorProfileProps {
  address: string;
  name: string;
  bio: string;
  avatar: string;
  isVerified: boolean;
  joinDate: string;
  collections: Collection[];
  stats: CreatorStats;
  history: CreatorHistory[];
  trustScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({
  address,
  name,
  bio,
  avatar,
  isVerified,
  joinDate,
  collections,
  stats,
  history,
  trustScore,
  riskLevel,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'Low':
        return '#4caf50';
      case 'Medium':
        return '#ff9800';
      case 'High':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const chartData = {
    labels: history.map(item => item.date),
    datasets: [
      {
        label: 'Sales Volume (ETH)',
        data: history.map(item => item.volume),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Grid container spacing={3}>
        {/* Creator Profile Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={avatar}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="h5" component="h1">
                      {name}
                    </Typography>
                    {isVerified && (
                      <Tooltip title="Verified Creator">
                        <VerifiedIcon sx={{ ml: 1, color: '#2196f3' }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {address}
                  </Typography>
                  <Typography variant="body1">{bio}</Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Member since
                  </Typography>
                  <Typography variant="body1">{joinDate}</Typography>
                  <Chip
                    label={`Trust Score: ${trustScore}%`}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                  <Chip
                    label={`Risk Level: ${riskLevel}`}
                    sx={{
                      mt: 1,
                      ml: 1,
                      bgcolor: getRiskLevelColor(riskLevel),
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Creator Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Creator Stats
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Sales
                </Typography>
                <Typography variant="h4">
                  {formatNumber(stats.totalSales)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Price
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(stats.avgPrice)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Volume
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(stats.totalVolume)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Unique Collectors
                </Typography>
                <Typography variant="h4">
                  {formatNumber(stats.uniqueCollectors)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sales History Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales History
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Collections Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Collections
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Collection Name</TableCell>
                      <TableCell align="right">Floor Price</TableCell>
                      <TableCell align="right">Volume</TableCell>
                      <TableCell align="right">Items</TableCell>
                      <TableCell align="right">Holders</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.name}>
                        <TableCell component="th" scope="row">
                          {collection.name}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(collection.floorPrice)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(collection.volume)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(collection.items)}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(collection.holders)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreatorProfile;
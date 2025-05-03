import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface OwnershipData {
  date: string;
  uniqueOwners: number;
  totalSupply: number;
}

interface OwnershipDistribution {
  ownerAddress: string;
  tokenCount: number;
  percentage: number;
}

interface OwnershipGraphProps {
  ownershipHistory: OwnershipData[];
  currentDistribution: OwnershipDistribution[];
  collectionName: string;
}

const OwnershipGraph: React.FC<OwnershipGraphProps> = ({
  ownershipHistory,
  currentDistribution,
  collectionName,
}) => {
  const theme = useTheme();

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="text.secondary">
            Unique Owners: {payload[0].value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Supply: {payload[1].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', my: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Ownership Analysis - {collectionName}
        </Typography>

        <Box sx={{ mt: 4, height: 300 }}>
          <Typography variant="subtitle1" gutterBottom>
            Ownership History
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={ownershipHistory}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="uniqueOwners" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={theme.palette.primary.main}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="totalSupply" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={theme.palette.secondary.main}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={theme.palette.secondary.main}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="uniqueOwners"
                stroke={theme.palette.primary.main}
                fillOpacity={1}
                fill="url(#uniqueOwners)"
              />
              <Area
                type="monotone"
                dataKey="totalSupply"
                stroke={theme.palette.secondary.main}
                fillOpacity={1}
                fill="url(#totalSupply)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current Distribution
          </Typography>
          <Box sx={{ mt: 2 }}>
            {currentDistribution.map((owner, index) => (
              <Box
                key={owner.ownerAddress}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  p: 1,
                  bgcolor: index % 2 === 0 ? 'action.hover' : 'transparent',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {formatAddress(owner.ownerAddress)}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
                  {owner.tokenCount} tokens
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                  {formatPercentage(owner.percentage)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OwnershipGraph;
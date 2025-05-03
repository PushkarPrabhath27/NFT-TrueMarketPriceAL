import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip, Divider } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface PredictionTimeframe {
  estimate: number;
  upper: number;
  lower: number;
}

interface PricePredictionProps {
  prediction: {
    oneMonth: PredictionTimeframe;
    threeMonths: PredictionTimeframe;
    sixMonths: PredictionTimeframe;
  };
}

const PricePrediction: React.FC<PricePredictionProps> = ({ prediction }) => {
  // Helper function to calculate percentage change
  const calculateChange = (estimate: number, currentValue: number) => {
    return ((estimate - currentValue) / currentValue) * 100;
  };

  // Get trend icon based on percentage change
  const getTrendIcon = (percentChange: number) => {
    if (percentChange > 5) return <TrendingUpIcon color="success" />;
    if (percentChange < -5) return <TrendingDownIcon color="error" />;
    return <TrendingFlatIcon color="action" />;
  };

  // Get color based on percentage change
  const getTrendColor = (percentChange: number) => {
    if (percentChange > 5) return 'success.main';
    if (percentChange < -5) return 'error.main';
    return 'text.primary';
  };

  // Mock current price (in a real app, this would come from props or context)
  const currentPrice = 78.5;
  const currency = 'ETH';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Price Predictions
          <Tooltip title="Future price projections with confidence intervals based on historical data and market trends">
            <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
          </Tooltip>
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            These predictions are based on historical trends, market conditions, and NFT-specific factors.
            Confidence intervals represent the range within which the actual price is likely to fall.
          </Typography>
        </Box>

        {/* 1 Month Prediction */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            1 Month Forecast
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="h6" color={getTrendColor(calculateChange(prediction.oneMonth.estimate, currentPrice))}>
              {prediction.oneMonth.estimate} {currency}
            </Typography>
            <Box sx={{ ml: 1 }}>
              {getTrendIcon(calculateChange(prediction.oneMonth.estimate, currentPrice))}
            </Box>
            <Typography 
              variant="body2" 
              color={getTrendColor(calculateChange(prediction.oneMonth.estimate, currentPrice))}
              sx={{ ml: 1 }}
            >
              ({calculateChange(prediction.oneMonth.estimate, currentPrice).toFixed(1)}%)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Lower: {prediction.oneMonth.lower} {currency}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upper: {prediction.oneMonth.upper} {currency}
            </Typography>
          </Box>
        </Box>

        {/* 3 Month Prediction */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            3 Month Forecast
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="h6" color={getTrendColor(calculateChange(prediction.threeMonths.estimate, currentPrice))}>
              {prediction.threeMonths.estimate} {currency}
            </Typography>
            <Box sx={{ ml: 1 }}>
              {getTrendIcon(calculateChange(prediction.threeMonths.estimate, currentPrice))}
            </Box>
            <Typography 
              variant="body2" 
              color={getTrendColor(calculateChange(prediction.threeMonths.estimate, currentPrice))}
              sx={{ ml: 1 }}
            >
              ({calculateChange(prediction.threeMonths.estimate, currentPrice).toFixed(1)}%)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Lower: {prediction.threeMonths.lower} {currency}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upper: {prediction.threeMonths.upper} {currency}
            </Typography>
          </Box>
        </Box>

        {/* 6 Month Prediction */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            6 Month Forecast
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="h6" color={getTrendColor(calculateChange(prediction.sixMonths.estimate, currentPrice))}>
              {prediction.sixMonths.estimate} {currency}
            </Typography>
            <Box sx={{ ml: 1 }}>
              {getTrendIcon(calculateChange(prediction.sixMonths.estimate, currentPrice))}
            </Box>
            <Typography 
              variant="body2" 
              color={getTrendColor(calculateChange(prediction.sixMonths.estimate, currentPrice))}
              sx={{ ml: 1 }}
            >
              ({calculateChange(prediction.sixMonths.estimate, currentPrice).toFixed(1)}%)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Lower: {prediction.sixMonths.lower} {currency}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upper: {prediction.sixMonths.upper} {currency}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> These predictions are estimates based on current data and market conditions. 
            Actual prices may vary due to unforeseen market events, regulatory changes, or other factors.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PricePrediction;
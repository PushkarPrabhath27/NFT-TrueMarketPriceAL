import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';

interface TrustScoreBadgeProps {
  tokenId: string;
  score?: number;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface PricePredictionChartProps {
  tokenId: string;
  data?: {
    timestamp: string;
    price: number;
    confidence: number;
  }[];
  loading?: boolean;
}

interface RiskAssessmentSummaryProps {
  tokenId: string;
  risks?: {
    category: string;
    level: 'low' | 'medium' | 'high';
    description: string;
  }[];
  loading?: boolean;
}

export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  tokenId,
  score,
  loading = false,
  size = 'medium'
}) => {
  const theme = useTheme();
  
  const getDimensions = () => {
    switch (size) {
      case 'small': return { width: 100, height: 100 };
      case 'large': return { width: 200, height: 200 };
      default: return { width: 150, height: 150 };
    }
  };

  const { width, height } = getDimensions();

  return (
    <Card
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        position: 'relative'
      }}
    >
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant={size === 'small' ? 'h6' : 'h4'}
            sx={{ color: '#1976d2' }} /* explicit primary.main color */
          >
            {score}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Trust Score
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export const PricePredictionChart: React.FC<PricePredictionChartProps> = ({
  tokenId,
  data,
  loading = false
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Price Prediction
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 200 }}>
            {/* Implement chart visualization using your preferred charting library */}
            <Typography color="text.secondary">
              Chart visualization to be implemented
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const RiskAssessmentSummary: React.FC<RiskAssessmentSummaryProps> = ({
  tokenId,
  risks,
  loading = false
}) => {
  const theme = useTheme();

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return '#2e7d32'; // success.main
      case 'medium': return '#ff9800'; // warning.main
      case 'high': return '#d32f2f'; // error.main
      default: return '#757575'; // grey.500
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Risk Assessment
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : risks?.length ? (
          <Box>
            {risks.map((risk, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: getRiskColor(risk.level) }}
                >
                  {risk.category} - {risk.level.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {risk.description}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            No risk factors identified
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
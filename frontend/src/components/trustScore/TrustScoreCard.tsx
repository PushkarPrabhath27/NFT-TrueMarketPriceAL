import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface TrustScoreCardProps {
  score: number; // 0-100 score
  confidence: number; // 0-100 confidence level
}

const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ score, confidence }) => {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50'; // Green for high trust
    if (score >= 60) return '#8bc34a'; // Light green for good trust
    if (score >= 40) return '#ffc107'; // Amber for moderate trust
    if (score >= 20) return '#ff9800'; // Orange for low trust
    return '#f44336'; // Red for very low trust
  };

  const scoreColor = getScoreColor(score);
  
  // Calculate the progress value (0-100)
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={normalizedScore}
            size={160}
            thickness={5}
            sx={{ color: scoreColor }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" component="div" color="text.primary">
              {Math.round(normalizedScore)}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="h5" component="div" gutterBottom>
          Trust Score
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
            Confidence: {confidence}%
          </Typography>
          <Tooltip title="Confidence indicates the reliability of the trust score based on available data and analysis.">
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="text.secondary" align="center">
          {getScoreDescription(normalizedScore)}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Helper function to get description based on score
const getScoreDescription = (score: number) => {
  if (score >= 80) return 'Excellent trust rating with minimal concerns';
  if (score >= 60) return 'Good trust rating with some minor concerns';
  if (score >= 40) return 'Moderate trust rating with several concerns';
  if (score >= 20) return 'Low trust rating with significant concerns';
  return 'Very low trust rating with critical concerns';
};

export default TrustScoreCard;
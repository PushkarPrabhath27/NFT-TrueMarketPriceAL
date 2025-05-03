import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Tooltip, Grid } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface Factor {
  name: string;
  score: number;
  weight: number;
}

interface TrustFactorsBreakdownProps {
  factors: Factor[];
}

const TrustFactorsBreakdown: React.FC<TrustFactorsBreakdownProps> = ({ factors }) => {
  // Sort factors by weight (descending)
  const sortedFactors = [...factors].sort((a, b) => b.weight - a.weight);

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50'; // Green for high score
    if (score >= 60) return '#8bc34a'; // Light green for good score
    if (score >= 40) return '#ffc107'; // Amber for moderate score
    if (score >= 20) return '#ff9800'; // Orange for low score
    return '#f44336'; // Red for very low score
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Trust Factor Breakdown
          <Tooltip title="Factors that contribute to the overall trust score, weighted by importance">
            <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
          </Tooltip>
        </Typography>

        <Grid container spacing={2}>
          {sortedFactors.map((factor) => (
            <Grid item xs={12} key={factor.name}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    {factor.name} 
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      (Weight: {Math.round(factor.weight * 100)}%)
                    </Typography>
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color={getScoreColor(factor.score)}>
                    {factor.score}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={factor.score} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: getScoreColor(factor.score),
                    }
                  }} 
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            The overall trust score is calculated by combining these individual factors, weighted by their relative importance. 
            Higher weights indicate more significant impact on the final score.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrustFactorsBreakdown;
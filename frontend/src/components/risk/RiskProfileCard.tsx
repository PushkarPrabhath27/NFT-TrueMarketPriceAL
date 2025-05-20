import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import ChipWrapper from '../common/ChipWrapper.tsx';

interface RiskProfileCardProps {
  overallRisk: string;
  factors: {
    name: string;
    level: string;
    score: number;
  }[];
}

const RiskProfileCard: React.FC<RiskProfileCardProps> = ({ overallRisk, factors }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Risk Profile
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="body1" sx={{ mr: 2 }}>
          Overall Risk Level:
        </Typography>
        <ChipWrapper 
          label={overallRisk} 
          chipColor={overallRisk} 
          size="medium"
          sx={{ fontWeight: 'bold' }} 
        />
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        This assessment represents the current risk profile based on multiple factors.
        Lower risk indicates higher stability and reliability.
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {factors.map((factor, index) => (
          <Grid item xs={12} key={index}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1 
            }}>
              <Typography variant="body2">{factor.name}</Typography>
              <ChipWrapper 
                label={factor.level} 
                chipColor={factor.level} 
                size="small"
                sx={{ fontWeight: 'bold' }} 
              />
            </Box>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: 'grey.200', 
              borderRadius: 5,
              mb: 2 
            }}>
              <Box 
                sx={{
                  width: `${factor.score}%`,
                  height: '100%',
                  bgcolor: 
                    factor.level === 'Very Low' ? '#4caf50' : // success.light
                    factor.level === 'Low' ? '#2e7d32' : // success.main
                    factor.level === 'Medium' ? '#ff9800' : // warning.main
                    factor.level === 'High' ? '#ef5350' : // error.light
                    '#d32f2f', // error.main
                  borderRadius: 5,
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default RiskProfileCard;
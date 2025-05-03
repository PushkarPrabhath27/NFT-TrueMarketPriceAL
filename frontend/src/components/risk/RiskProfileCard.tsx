import React from 'react';
import { Paper, Typography, Box, Chip, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

interface RiskProfileCardProps {
  overallRisk: string;
  factors: {
    name: string;
    level: string;
    score: number;
  }[];
}

const RiskLevelChip = styled(Chip)(({ theme, color }) => ({
  fontWeight: 'bold',
  backgroundColor: 
    color === 'Very Low' ? theme.palette.success.light :
    color === 'Low' ? theme.palette.success.main :
    color === 'Medium' ? theme.palette.warning.main :
    color === 'High' ? theme.palette.error.light :
    theme.palette.error.main,
  color: 
    color === 'Very Low' || color === 'Low' ? theme.palette.success.contrastText :
    color === 'Medium' ? theme.palette.warning.contrastText :
    theme.palette.error.contrastText,
}));

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
        <RiskLevelChip 
          label={overallRisk} 
          color={overallRisk} 
          size="medium" 
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
              <RiskLevelChip 
                label={factor.level} 
                color={factor.level} 
                size="small" 
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
                    factor.level === 'Very Low' ? 'success.light' :
                    factor.level === 'Low' ? 'success.main' :
                    factor.level === 'Medium' ? 'warning.main' :
                    factor.level === 'High' ? 'error.light' :
                    'error.main',
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
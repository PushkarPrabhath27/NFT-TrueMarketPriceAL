import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Divider,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface RiskFactor {
  name: string;
  level: string;
  score: number;
  description?: string;
  impact?: string;
  mitigationSteps?: string[];
  historicalTrend?: 'improving' | 'stable' | 'worsening';
}

interface RiskFactorBreakdownProps {
  factors: RiskFactor[];
}

const getRiskColor = (level: string) => {
  switch(level) {
    case 'Very Low': return 'success.light';
    case 'Low': return 'success.main';
    case 'Medium': return 'warning.main';
    case 'High': return 'error.light';
    case 'Very High': return 'error.main';
    default: return 'grey.500';
  }
};

const getTrendIcon = (trend?: 'improving' | 'stable' | 'worsening') => {
  if (!trend) return null;
  
  return (
    <Chip 
      size="small" 
      label={trend.charAt(0).toUpperCase() + trend.slice(1)}
      color={
        trend === 'improving' ? 'success' :
        trend === 'stable' ? 'default' : 'error'
      }
      sx={{ ml: 1 }}
    />
  );
};

const RiskFactorBreakdown: React.FC<RiskFactorBreakdownProps> = ({ factors }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Risk Factor Analysis
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Detailed breakdown of each risk factor with severity indicators and mitigation recommendations.
      </Typography>

      <Box sx={{ mt: 2 }}>
        {factors.map((factor, index) => (
          <Accordion 
            key={index}
            expanded={expanded === `panel${index}`} 
            onChange={handleChange(`panel${index}`)}
            sx={{ 
              mb: 1,
              '&:before': { display: 'none' },
              boxShadow: 'none',
              border: 1,
              borderColor: 'divider'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}bh-content`}
              id={`panel${index}bh-header`}
              sx={{
                backgroundColor: expanded === `panel${index}` ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1">
                    {factor.name}
                    {getTrendIcon(factor.historicalTrend)}
                  </Typography>
                  <Chip 
                    label={factor.level}
                    size="small"
                    sx={{ 
                      bgcolor: getRiskColor(factor.level),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Box sx={{ width: '100%', mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={factor.score} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 5,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getRiskColor(factor.level),
                        borderRadius: 5,
                      }
                    }}
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {factor.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Description:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {factor.description}
                    </Typography>
                  </Grid>
                )}
                
                {factor.impact && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Potential Impact:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {factor.impact}
                    </Typography>
                  </Grid>
                )}
                
                {factor.mitigationSteps && factor.mitigationSteps.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Mitigation Recommendations:</strong>
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                      {factor.mitigationSteps.map((step, idx) => (
                        <Typography component="li" variant="body2" key={idx}>
                          {step}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
};

export default RiskFactorBreakdown;
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Grid
} from '@mui/material';
import ChipWrapper from '../common/ChipWrapper.tsx';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  implemented?: boolean;
  actionLink?: string;
}

interface MitigationRecommendationsProps {
  recommendations: Recommendation[];
  onImplementToggle?: (id: string, implemented: boolean) => void;
}

// Use custom styling instead of relying on theme.palette.*.contrastText
// Define color mappings with explicit text colors to avoid theme.palette.*.contrastText issues
const getImpactColor = (impact: string) => {
  switch(impact) {
    case 'high': return { bgColor: '#d32f2f', textColor: '#ffffff' };
    case 'medium': return { bgColor: '#ff9800', textColor: '#ffffff' };
    case 'low': return { bgColor: '#4caf50', textColor: '#ffffff' };
    default: return { bgColor: '#9e9e9e', textColor: '#000000' };
  }
};

const getEffortColor = (effort: string) => {
  switch(effort) {
    case 'high': return { bgColor: '#d32f2f', textColor: '#ffffff' };
    case 'medium': return { bgColor: '#ff9800', textColor: '#ffffff' };
    case 'low': return { bgColor: '#4caf50', textColor: '#ffffff' };
    default: return { bgColor: '#9e9e9e', textColor: '#000000' };
  }
};

const MitigationRecommendations: React.FC<MitigationRecommendationsProps> = ({
  recommendations,
  onImplementToggle
}) => {
  const handleImplementToggle = (id: string, currentValue: boolean) => {
    if (onImplementToggle) {
      onImplementToggle(id, !currentValue);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Risk Mitigation Recommendations
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Actionable steps to reduce identified risks and improve the NFT's risk profile.
      </Typography>

      <List sx={{ width: '100%' }}>
        {recommendations.map((recommendation, index) => (
          <React.Fragment key={recommendation.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              alignItems="flex-start"
              sx={{
                py: 2,
                backgroundColor: recommendation.implemented ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ mt: 0 }}>
                {recommendation.implemented ? 
                  <CheckCircleOutlineIcon color="success" /> : 
                  <ErrorOutlineIcon color="action" />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {recommendation.title}
                    </Typography>
                    <ChipWrapper 
                      size="small" 
                      label={`Impact: ${(recommendation.impact && typeof recommendation.impact === 'string' && recommendation.impact.length > 0 ? recommendation.impact.charAt(0).toUpperCase() + recommendation.impact.slice(1) : 'N/A')}`}
                      customBgColor={getImpactColor(recommendation.impact).bgColor}
                      customTextColor={getImpactColor(recommendation.impact).textColor}
                    />
                    <ChipWrapper 
                      size="small" 
                      label={`Effort: ${(recommendation.effort && typeof recommendation.effort === 'string' && recommendation.effort.length > 0 ? recommendation.effort.charAt(0).toUpperCase() + recommendation.effort.slice(1) : 'N/A')}`}
                      customBgColor={getEffortColor(recommendation.effort).bgColor}
                      customTextColor={getEffortColor(recommendation.effort).textColor}
                    />
                    {recommendation.implemented && (
                      <ChipWrapper 
                        size="small" 
                        label="Implemented"
                        customBgColor="#4caf50"
                        customTextColor="#ffffff"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.primary" component="span">
                        {recommendation.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        {recommendation.actionLink && (
                          <Button 
                            size="small" 
                            endIcon={<ArrowForwardIcon />}
                            href={recommendation.actionLink}
                            target="_blank"
                          >
                            Learn more
                          </Button>
                        )}
                        <Button 
                          size="small" 
                          variant={recommendation.implemented ? "outlined" : "contained"}
                          sx={{
                            backgroundColor: recommendation.implemented ? 'transparent' : '#1976d2', // primary color
                            color: recommendation.implemented ? '#4caf50' : '#ffffff', // success color for text when outlined
                            borderColor: recommendation.implemented ? '#4caf50' : 'transparent',
                            '&:hover': {
                              backgroundColor: recommendation.implemented ? 'rgba(76, 175, 80, 0.04)' : '#1565c0',
                              borderColor: recommendation.implemented ? '#4caf50' : 'transparent'
                            }
                          }}
                          onClick={() => handleImplementToggle(recommendation.id, !!recommendation.implemented)}
                        >
                          {recommendation.implemented ? "Mark as Not Implemented" : "Mark as Implemented"}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default MitigationRecommendations;
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
  Chip,
  Button,
  Grid
} from '@mui/material';
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

const getImpactColor = (impact: string) => {
  switch(impact) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'default';
  }
};

const getEffortColor = (effort: string) => {
  switch(effort) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'default';
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
                    <Chip 
                      size="small" 
                      label={`Impact: ${recommendation.impact.charAt(0).toUpperCase() + recommendation.impact.slice(1)}`}
                      color={getImpactColor(recommendation.impact)}
                    />
                    <Chip 
                      size="small" 
                      label={`Effort: ${recommendation.effort.charAt(0).toUpperCase() + recommendation.effort.slice(1)}`}
                      color={getEffortColor(recommendation.effort)}
                    />
                    {recommendation.implemented && (
                      <Chip 
                        size="small" 
                        label="Implemented"
                        color="success"
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
                          color={recommendation.implemented ? "success" : "primary"}
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
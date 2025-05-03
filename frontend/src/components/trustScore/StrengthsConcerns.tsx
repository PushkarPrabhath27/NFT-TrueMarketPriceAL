import React from 'react';
import { Card, CardContent, Typography, Box, Divider, List, ListItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

interface Insight {
  title: string;
  description: string;
}

interface StrengthsConcernsProps {
  strengths: Insight[];
  concerns: Insight[];
}

const StrengthsConcerns: React.FC<StrengthsConcernsProps> = ({ strengths, concerns }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Strengths & Concerns
          <Tooltip title="Key strengths and potential concerns identified in the trust analysis">
            <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
          </Tooltip>
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Strengths Section */}
          <Box sx={{ flex: 1, mr: { md: 2 } }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Strengths
            </Typography>
            <List dense>
              {strengths.map((strength, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36, color: 'success.main' }}>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={strength.title}
                    secondary={strength.description}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
              {strengths.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                  No significant strengths identified.
                </Typography>
              )}
            </List>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Divider sx={{ my: 2, display: { xs: 'block', md: 'none' } }} />

          {/* Concerns Section */}
          <Box sx={{ flex: 1, ml: { md: 2 } }}>
            <Typography variant="subtitle1" color="error" gutterBottom>
              Concerns
            </Typography>
            <List dense>
              {concerns.map((concern, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36, color: 'warning.main' }}>
                    <WarningIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={concern.title}
                    secondary={concern.description}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
              {concerns.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                  No significant concerns identified.
                </Typography>
              )}
            </List>
          </Box>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            These insights are based on comprehensive analysis of the NFT's metadata, transaction history, creator reputation, and market performance. They highlight key factors that contribute to or detract from the overall trust score.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StrengthsConcerns;
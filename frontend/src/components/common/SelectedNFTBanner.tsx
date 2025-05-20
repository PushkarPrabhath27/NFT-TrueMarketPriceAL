/**
 * SelectedNFTBanner.tsx
 * 
 * A component that displays information about the currently selected NFT.
 * This provides visual confirmation to the user about which NFT they are viewing.
 */

import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { useNFT } from '../../context/NFTContext';

/**
 * SelectedNFTBanner component displays information about the currently selected NFT
 */
const SelectedNFTBanner: React.FC = () => {
  const { nftData } = useNFT();
  
  if (!nftData) return null;
  
  // Determine trust score color based on score value
  const getTrustScoreColor = (score: number) => {
    if (score > 80) return 'success';
    if (score > 60) return 'primary';
    return 'warning';
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">
          Currently Viewing:
        </Typography>
        <Typography variant="h6">
          {nftData.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Collection: {nftData.collection} • Creator: {nftData.creator}
        </Typography>
      </Box>
      <Chip 
        label={`Trust Score: ${nftData.trustScore}`}
        color={getTrustScoreColor(nftData.trustScore)}
      />
    </Paper>
  );
};

export default SelectedNFTBanner;
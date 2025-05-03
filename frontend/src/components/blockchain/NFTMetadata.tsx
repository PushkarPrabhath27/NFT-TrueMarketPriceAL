import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  CardMedia,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

interface NFTMetadataProps {
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: NFTAttribute[];
  collectionName: string;
  creator: string;
  tokenStandard: string;
  blockchain: string;
}

const AttributeChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '& .MuiChip-label': {
    fontSize: '0.875rem',
  },
}));

const NFTMetadata: React.FC<NFTMetadataProps> = ({
  tokenId,
  name,
  description,
  imageUrl,
  attributes,
  collectionName,
  creator,
  tokenStandard,
  blockchain,
}) => {
  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', my: 2 }}>
      <CardMedia
        component="img"
        height="300"
        image={imageUrl}
        alt={name}
        sx={{ objectFit: 'contain' }}
      />
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {name}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Token ID: {tokenId}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Collection
            </Typography>
            <Typography variant="body1">{collectionName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Creator
            </Typography>
            <Typography variant="body1">{creator}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Token Standard
            </Typography>
            <Typography variant="body1">{tokenStandard}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Blockchain
            </Typography>
            <Typography variant="body1">{blockchain}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {description}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Attributes
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attributes.map((attr, index) => (
              <AttributeChip
                key={index}
                label={`${attr.trait_type}: ${attr.value}`}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NFTMetadata;
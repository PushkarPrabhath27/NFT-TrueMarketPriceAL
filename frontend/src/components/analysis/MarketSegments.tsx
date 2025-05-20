import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Mock data for demonstration
const mockSegments = [
  { segment: 'Art', volume: 1200, avgPrice: 2.5, trustScore: 85 },
  { segment: 'Gaming', volume: 950, avgPrice: 1.8, trustScore: 78 },
  { segment: 'Collectibles', volume: 1500, avgPrice: 3.2, trustScore: 90 },
  { segment: 'Music', volume: 400, avgPrice: 2.1, trustScore: 72 },
  { segment: 'Metaverse', volume: 700, avgPrice: 2.9, trustScore: 80 },
];

const MarketSegments: React.FC = () => {
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        NFT Market Segments Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Segment Breakdown
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Segment</TableCell>
                      <TableCell align="right">Volume</TableCell>
                      <TableCell align="right">Avg Price (ETH)</TableCell>
                      <TableCell align="right">Trust Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockSegments.map((row) => (
                      <TableRow key={row.segment}>
                        <TableCell>{row.segment}</TableCell>
                        <TableCell align="right">{row.volume}</TableCell>
                        <TableCell align="right">{row.avgPrice}</TableCell>
                        <TableCell align="right">{row.trustScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insights
              </Typography>
              <Typography variant="body1" paragraph>
                The NFT market is divided into several key segments, each with unique characteristics and trends. Art and Collectibles lead in volume and trust, while Gaming and Metaverse are rapidly growing. Monitoring segment trust scores helps identify emerging opportunities and risks.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MarketSegments;
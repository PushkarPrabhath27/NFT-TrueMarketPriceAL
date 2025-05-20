import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MarketSegmentAnalysis from '../components/collection/MarketSegmentAnalysis.tsx';

// Add error boundary for robustness
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return <Box sx={{p:3}}><Typography color="error">Something went wrong loading the market analysis. Please try again later.</Typography></Box>;
    }
    return this.props.children;
  }
}

function MarketAnalysis() {
  return (
    <ErrorBoundary>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          NFT Market Analysis
        </Typography>
        <Paper sx={{ p: 0 }}>
          <MarketSegmentAnalysis />
        </Paper>
      </Box>
    </ErrorBoundary>
  );
}

export default MarketAnalysis;
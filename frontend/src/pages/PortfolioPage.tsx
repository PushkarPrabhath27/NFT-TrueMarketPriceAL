import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Portfolio from '../components/user/Portfolio.tsx';

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
      return <Box sx={{p:3}}><Typography color="error">Something went wrong loading your portfolio. Please try again later.</Typography></Box>;
    }
    return this.props.children;
  }
}

function PortfolioPage() {
  return (
    <ErrorBoundary>
      <Box sx={{ 
        flexGrow: 1, 
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          NFT Portfolio
        </Typography>
        <Box sx={{ 
          flexGrow: 1, 
          width: '100%',
          display: 'flex',
          mb: 3
        }}>
          <Portfolio />
        </Box>
      </Box>
    </ErrorBoundary>
  );
}

export default PortfolioPage;
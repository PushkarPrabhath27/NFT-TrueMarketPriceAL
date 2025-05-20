/**
 * ErrorState.tsx
 * 
 * A reusable error state component that provides a consistent error experience
 * across the application when there are issues fetching data from the Hathor blockchain.
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * ErrorState component displays an error message with an optional retry button
 */
const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
      <Typography variant="body1" color="error" sx={{ mt: 2 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" color="primary" onClick={onRetry} sx={{ mt: 2 }}>
          Retry
        </Button>
      )}
    </Box>
  );
};

export default ErrorState;
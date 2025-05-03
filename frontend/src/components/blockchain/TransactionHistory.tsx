import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Link,
  Chip,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SwapHoriz, LocalOffer, ShoppingCart } from '@mui/icons-material';

interface Transaction {
  id: string;
  type: 'transfer' | 'list' | 'sale';
  from: string;
  to: string;
  price?: number;
  timestamp: string;
  marketplace?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  tokenId: string;
}

const TransactionChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'transfer':
      return <SwapHoriz />;
    case 'list':
      return <LocalOffer />;
    case 'sale':
      return <ShoppingCart />;
    default:
      return null;
  }
};

const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETH',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(num);
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, tokenId }) => {
  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', my: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Transaction History
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Token ID: {tokenId}
        </Typography>

        <Stepper orientation="vertical">
          {transactions.map((transaction, index) => (
            <Step key={transaction.id} active={true}>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ color: 'primary.main' }}>
                    {getTransactionIcon(transaction.type)}
                  </Box>
                )}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1">
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </Typography>
                  {transaction.price && (
                    <TransactionChip
                      label={formatCurrency(transaction.price)}
                      color="primary"
                      size="small"
                    />
                  )}
                  {transaction.marketplace && (
                    <TransactionChip
                      label={transaction.marketplace}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ my: 1 }}>
                  <Typography variant="body2">
                    From:{' '}
                    <Tooltip title={transaction.from}>
                      <Link href={`https://etherscan.io/address/${transaction.from}`} target="_blank">
                        {formatAddress(transaction.from)}
                      </Link>
                    </Tooltip>
                  </Typography>
                  <Typography variant="body2">
                    To:{' '}
                    <Tooltip title={transaction.to}>
                      <Link href={`https://etherscan.io/address/${transaction.to}`} target="_blank">
                        {formatAddress(transaction.to)}
                      </Link>
                    </Tooltip>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
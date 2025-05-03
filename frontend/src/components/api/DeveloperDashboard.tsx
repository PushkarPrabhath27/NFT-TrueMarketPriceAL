import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: 'active' | 'inactive';
}

interface UsageMetrics {
  timestamp: string;
  requests: number;
  latency: number;
}

const DeveloperDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with actual API calls
  const apiKeys: ApiKey[] = [
    {
      id: '1',
      name: 'Production API Key',
      key: 'nft_prod_key_123',
      created: '2023-01-01',
      lastUsed: '2023-06-15',
      status: 'active'
    }
  ];

  const usageData: UsageMetrics[] = [
    { timestamp: '2023-06-01', requests: 1200, latency: 250 },
    { timestamp: '2023-06-02', requests: 1500, latency: 245 },
    { timestamp: '2023-06-03', requests: 1800, latency: 260 }
  ];

  const generateNewApiKey = async () => {
    setLoading(true);
    try {
      // Implement API key generation logic
      setLoading(false);
    } catch (err) {
      setError('Failed to generate API key');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Developer Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* API Keys Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">API Keys</Typography>
              <Button
                variant="contained"
                onClick={generateNewApiKey}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate New Key'}
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>API Key</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>
                        <Typography variant="code" sx={{ bgcolor: theme.palette.grey[100], p: 1, borderRadius: 1 }}>
                          {key.key}
                        </Typography>
                      </TableCell>
                      <TableCell>{key.created}</TableCell>
                      <TableCell>{key.lastUsed}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: key.status === 'active' ? 'success.main' : 'error.main',
                            textTransform: 'capitalize'
                          }}
                        >
                          {key.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color={key.status === 'active' ? 'error' : 'primary'}
                          size="small"
                        >
                          {key.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Usage Metrics Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              API Usage Metrics
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="requests"
                    stroke={theme.palette.primary.main}
                    name="Requests"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="latency"
                    stroke={theme.palette.secondary.main}
                    name="Latency (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Development Tools Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Development Tools
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: theme.palette.grey[50],
                    cursor: 'pointer',
                    '&:hover': { bgcolor: theme.palette.grey[100] }
                  }}
                >
                  <Typography variant="h6">API Playground</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Test API endpoints interactively
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: theme.palette.grey[50],
                    cursor: 'pointer',
                    '&:hover': { bgcolor: theme.palette.grey[100] }
                  }}
                >
                  <Typography variant="h6">Webhooks</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure event notifications
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: theme.palette.grey[50],
                    cursor: 'pointer',
                    '&:hover': { bgcolor: theme.palette.grey[100] }
                  }}
                >
                  <Typography variant="h6">SDK Downloads</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access client libraries and SDKs
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DeveloperDashboard;
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider,
  useTheme,
} from '@mui/material';

interface EndpointDoc {
  path: string;
  method: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  responses: {
    code: number;
    description: string;
    example: string;
  }[];
}

interface ApiSection {
  title: string;
  description: string;
  endpoints: EndpointDoc[];
}

const ApiDocumentation: React.FC = () => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);

  const apiSections: ApiSection[] = [
    {
      title: 'Trust Score',
      description: 'Endpoints for retrieving and analyzing NFT trust scores',
      endpoints: [
        {
          path: '/api/v1/trust-score/:tokenId',
          method: 'GET',
          description: 'Get trust score details for a specific NFT',
          parameters: [
            {
              name: 'tokenId',
              type: 'string',
              required: true,
              description: 'The unique identifier of the NFT'
            }
          ],
          responses: [
            {
              code: 200,
              description: 'Success',
              example: JSON.stringify({
                trustScore: 85,
                confidence: 0.92,
                factors: [
                  { name: 'Historical Performance', score: 90 },
                  { name: 'Market Liquidity', score: 82 }
                ]
              }, null, 2)
            }
          ]
        }
      ]
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const renderEndpoint = (endpoint: EndpointDoc) => (
    <Paper
      elevation={2}
      sx={{ p: 3, my: 2, borderRadius: 2 }}
      key={endpoint.path}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="code"
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            mr: 2
          }}
        >
          {endpoint.method}
        </Typography>
        <Typography variant="h6">{endpoint.path}</Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {endpoint.description}
      </Typography>

      <Typography variant="h6" sx={{ mb: 2 }}>Parameters</Typography>
      {endpoint.parameters.map(param => (
        <Box key={param.name} sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            {param.name}
            {param.required && (
              <Typography
                component="span"
                sx={{ color: theme.palette.error.main, ml: 1 }}
              >
                required
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Type: {param.type}
          </Typography>
          <Typography variant="body2">{param.description}</Typography>
        </Box>
      ))}

      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Responses</Typography>
      {endpoint.responses.map(response => (
        <Box key={response.code} sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            {response.code} - {response.description}
          </Typography>
          <Paper
            sx={{
              bgcolor: theme.palette.grey[900],
              p: 2,
              mt: 1,
              borderRadius: 1,
              '& pre': { margin: 0 }
            }}
          >
            <pre>
              <code>{response.example}</code>
            </pre>
          </Paper>
        </Box>
      ))}
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        API Documentation
      </Typography>
      
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        sx={{ mb: 4 }}
      >
        {apiSections.map((section, index) => (
          <Tab key={section.title} label={section.title} />
        ))}
      </Tabs>

      {apiSections.map((section, index) => (
        <div
          key={section.title}
          role="tabpanel"
          hidden={selectedTab !== index}
        >
          {selectedTab === index && (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {section.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                {section.description}
              </Typography>
              {section.endpoints.map(renderEndpoint)}
            </Box>
          )}
        </div>
      ))}
    </Container>
  );
};

export default ApiDocumentation;
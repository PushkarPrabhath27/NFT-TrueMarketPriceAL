import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CollectionsIcon from '@mui/icons-material/Collections';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';

// Import the collection and creator analysis components
import {
  CollectionOverviewDashboard,
  CreatorProfileInterface,
  MarketSegmentAnalysis
} from '../components/collection';

const CollectionAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Breadcrumbs navigation */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
            href="#"
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            <CollectionsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Collection & Creator Analysis
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom>
          Collection & Creator Analysis
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Analyze entire collections and creator profiles to identify trends, opportunities, and risks.
        </Typography>

        {/* Navigation tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            aria-label="collection analysis tabs"
          >
            <Tab icon={<CollectionsIcon />} label="Collection Overview" />
            <Tab icon={<PersonIcon />} label="Creator Profile" />
            <Tab icon={<BarChartIcon />} label="Market Segments" />
          </Tabs>
        </Paper>

        {/* Tab content */}
        {activeTab === 0 && <CollectionOverviewDashboard />}
        {activeTab === 1 && <CreatorProfileInterface />}
        {activeTab === 2 && <MarketSegmentAnalysis />}
      </Box>
    </Container>
  );
};

export default CollectionAnalysisPage;
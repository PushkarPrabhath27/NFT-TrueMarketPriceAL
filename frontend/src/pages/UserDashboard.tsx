import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { Person as PersonIcon, Wallet as WalletIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { UserProfile, Portfolio, NotificationCenter } from '../components/user/index.ts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-dashboard-tabpanel-${index}`}
      aria-labelledby={`user-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

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
      return <Box sx={{p:3}}><Typography color="error">Something went wrong.</Typography></Box>;
    }
    return this.props.children;
  }
}

function UserDashboard() {
  const [tabValue, setTabValue] = useState(0);
  // Defensive: ensure tabValue is always valid
  const safeTabValue = [0,1,2].includes(tabValue) ? tabValue : 0;
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  return (
    <ErrorBoundary>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Dashboard
        </Typography>
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={safeTabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<PersonIcon />} label="Profile" />
            <Tab icon={<WalletIcon />} label="Portfolio" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
          </Tabs>
        </Paper>
        <TabPanel value={safeTabValue} index={0}>
          <UserProfile />
        </TabPanel>
        <TabPanel value={safeTabValue} index={1}>
          <Portfolio />
        </TabPanel>
        <TabPanel value={safeTabValue} index={2}>
          <NotificationCenter />
        </TabPanel>
      </Box>
    </ErrorBoundary>
  );
}

export default UserDashboard;
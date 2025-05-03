import React, { useState } from 'react';
import { Box, Grid, Typography, Paper, Tabs, Tab } from '@mui/material';
import { Person as PersonIcon, Wallet as WalletIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { UserProfile, Portfolio, NotificationCenter } from '../components/user';

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

function UserDashboard() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Dashboard
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
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

      <TabPanel value={tabValue} index={0}>
        <UserProfile />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Portfolio />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <NotificationCenter />
      </TabPanel>
    </Box>
  );
}

export default UserDashboard;
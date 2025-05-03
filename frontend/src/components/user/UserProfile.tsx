import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Switch, 
  FormControlLabel, 
  Slider, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Divider,
  Card,
  CardContent,
  Avatar,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Security as SecurityIcon, Settings as SettingsIcon } from '@mui/icons-material';

interface UserPreferences {
  dashboardLayout: string;
  defaultView: string;
  riskTolerance: number;
  alertSensitivity: number;
  dataDisplayPreferences: {
    showConfidenceIntervals: boolean;
    showHistoricalData: boolean;
    showPredictions: boolean;
    colorTheme: string;
    chartType: string;
  };
}

interface UserProfileData {
  username: string;
  email: string;
  avatar: string;
  apiKeys: string[];
  subscription: {
    plan: string;
    expiresAt: string;
    features: string[];
  };
  usageStats: {
    apiCalls: number;
    dashboardViews: number;
    savedNFTs: number;
  };
  privacySettings: {
    sharePortfolio: boolean;
    shareAnalytics: boolean;
    publicProfile: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  dashboardLayout: 'grid',
  defaultView: 'trustScore',
  riskTolerance: 50,
  alertSensitivity: 70,
  dataDisplayPreferences: {
    showConfidenceIntervals: true,
    showHistoricalData: true,
    showPredictions: true,
    colorTheme: 'light',
    chartType: 'line'
  }
};

const mockUserData: UserProfileData = {
  username: 'nft_investor',
  email: 'investor@example.com',
  avatar: 'https://via.placeholder.com/150',
  apiKeys: ['api-key-1', 'api-key-2'],
  subscription: {
    plan: 'Premium',
    expiresAt: '2023-12-31',
    features: ['Advanced Analytics', 'API Access', 'Portfolio Tracking']
  },
  usageStats: {
    apiCalls: 1250,
    dashboardViews: 325,
    savedNFTs: 47
  },
  privacySettings: {
    sharePortfolio: false,
    shareAnalytics: true,
    publicProfile: true
  }
};

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
      id={`user-profile-tabpanel-${index}`}
      aria-labelledby={`user-profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const UserProfile: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [userData, setUserData] = useState<UserProfileData>(mockUserData);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreferenceChange = (field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDisplayPreferenceChange = (field: keyof typeof preferences.dataDisplayPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      dataDisplayPreferences: {
        ...prev.dataDisplayPreferences,
        [field]: value
      }
    }));
  };

  const handlePrivacySettingChange = (field: keyof typeof userData.privacySettings, value: boolean) => {
    setUserData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [field]: value
      }
    }));
  };

  const handleSavePreferences = () => {
    // In a real app, this would save to backend
    console.log('Saving preferences:', preferences);
    // Show success message or notification
  };

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
    // In a real app, this would save to backend
    console.log('Saving user profile:', userData);
    // Show success message or notification
  };

  return (
    <Paper elevation={3} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="user profile tabs"
          variant="fullWidth"
        >
          <Tab label="Profile" icon={<Avatar src={userData.avatar} sx={{ width: 24, height: 24 }} />} />
          <Tab label="Preferences" icon={<SettingsIcon />} />
          <Tab label="Security & API" icon={<SecurityIcon />} />
        </Tabs>
      </Box>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={userData.avatar} sx={{ width: 80, height: 80, mr: 2 }} />
            <Box>
              <Typography variant="h5">{userData.username}</Typography>
              <Typography variant="body1" color="text.secondary">{userData.email}</Typography>
              <Typography variant="body2" color="primary">{userData.subscription.plan} Plan</Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={isEditingProfile ? <SaveIcon /> : <EditIcon />}
            onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
          >
            {isEditingProfile ? 'Save Profile' : 'Edit Profile'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Subscription Details</Typography>
                <Typography variant="body2">Plan: {userData.subscription.plan}</Typography>
                <Typography variant="body2">Expires: {userData.subscription.expiresAt}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Features:</Typography>
                <ul>
                  {userData.subscription.features.map((feature, index) => (
                    <li key={index}><Typography variant="body2">{feature}</Typography></li>
                  ))}
                </ul>
                <Button variant="contained" size="small" sx={{ mt: 1 }}>Upgrade Plan</Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Usage Statistics</Typography>
                <Typography variant="body2">API Calls: {userData.usageStats.apiCalls}</Typography>
                <Typography variant="body2">Dashboard Views: {userData.usageStats.dashboardViews}</Typography>
                <Typography variant="body2">Saved NFTs: {userData.usageStats.savedNFTs}</Typography>
                <Button variant="outlined" size="small" sx={{ mt: 2 }}>View Detailed Stats</Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userData.privacySettings.sharePortfolio}
                          onChange={(e) => handlePrivacySettingChange('sharePortfolio', e.target.checked)}
                        />
                      }
                      label="Share my portfolio with other users"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userData.privacySettings.shareAnalytics}
                          onChange={(e) => handlePrivacySettingChange('shareAnalytics', e.target.checked)}
                        />
                      }
                      label="Contribute anonymous data to improve analytics"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userData.privacySettings.publicProfile}
                          onChange={(e) => handlePrivacySettingChange('publicProfile', e.target.checked)}
                        />
                      }
                      label="Make my profile visible to other users"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Preferences Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>Dashboard Preferences</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Layout</Typography>
            <Select
              fullWidth
              value={preferences.dashboardLayout}
              onChange={(e) => handlePreferenceChange('dashboardLayout', e.target.value)}
            >
              <MenuItem value="grid">Grid Layout</MenuItem>
              <MenuItem value="list">List Layout</MenuItem>
              <MenuItem value="compact">Compact Layout</MenuItem>
              <MenuItem value="expanded">Expanded Layout</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Default View</Typography>
            <Select
              fullWidth
              value={preferences.defaultView}
              onChange={(e) => handlePreferenceChange('defaultView', e.target.value)}
            >
              <MenuItem value="trustScore">Trust Score</MenuItem>
              <MenuItem value="price">Price Intelligence</MenuItem>
              <MenuItem value="risk">Risk Assessment</MenuItem>
              <MenuItem value="fraud">Fraud Detection</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Risk Tolerance: {preferences.riskTolerance}%
            </Typography>
            <Slider
              value={preferences.riskTolerance}
              onChange={(e, value) => handlePreferenceChange('riskTolerance', value)}
              aria-labelledby="risk-tolerance-slider"
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Alert Sensitivity: {preferences.alertSensitivity}%
            </Typography>
            <Slider
              value={preferences.alertSensitivity}
              onChange={(e, value) => handlePreferenceChange('alertSensitivity', value)}
              aria-labelledby="alert-sensitivity-slider"
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Display Preferences</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.dataDisplayPreferences.showConfidenceIntervals}
                  onChange={(e) => handleDisplayPreferenceChange('showConfidenceIntervals', e.target.checked)}
                />
              }
              label="Show confidence intervals"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.dataDisplayPreferences.showHistoricalData}
                  onChange={(e) => handleDisplayPreferenceChange('showHistoricalData', e.target.checked)}
                />
              }
              label="Show historical data"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.dataDisplayPreferences.showPredictions}
                  onChange={(e) => handleDisplayPreferenceChange('showPredictions', e.target.checked)}
                />
              }
              label="Show predictions"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Color Theme</Typography>
            <Select
              fullWidth
              value={preferences.dataDisplayPreferences.colorTheme}
              onChange={(e) => handleDisplayPreferenceChange('colorTheme', e.target.value)}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System Default</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Chart Type</Typography>
            <Select
              fullWidth
              value={preferences.dataDisplayPreferences.chartType}
              onChange={(e) => handleDisplayPreferenceChange('chartType', e.target.value)}
            >
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="radar">Radar Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSavePreferences}
              startIcon={<SaveIcon />}
            >
              Save Preferences
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Security & API Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>API Access Management</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1">Your API Keys</Typography>
                <Box sx={{ mt: 2 }}>
                  {userData.apiKeys.map((key, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={key}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                      <IconButton color="error" sx={{ ml: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                  Generate New API Key
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1">Security Settings</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Button variant="outlined" fullWidth>Change Password</Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="outlined" fullWidth>Enable Two-Factor Authentication</Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="outlined" fullWidth>Manage Connected Wallets</Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="outlined" fullWidth>View Login History</Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};
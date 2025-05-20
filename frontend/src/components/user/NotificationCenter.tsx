import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Badge,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'price' | 'risk' | 'security' | 'system';
  title: string;
  message: string;
  assetName?: string;
  assetImage?: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
}

interface NotificationSettings {
  priceAlerts: boolean;
  riskAlerts: boolean;
  securityAlerts: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  alertThreshold: number;
}

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
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Mock data for notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'price',
    title: 'Price Alert',
    message: 'Bored Ape #1234 has increased by 15% in the last 24 hours.',
    assetName: 'Bored Ape #1234',
    assetImage: 'https://via.placeholder.com/40',
    timestamp: '2023-09-15T10:30:00',
    read: false,
    urgent: false
  },
  {
    id: '2',
    type: 'risk',
    title: 'Risk Alert',
    message: 'Unusual activity detected in the CryptoPunks collection. Your asset may be affected.',
    assetName: 'Crypto Punk #5678',
    assetImage: 'https://via.placeholder.com/40',
    timestamp: '2023-09-14T15:45:00',
    read: false,
    urgent: true
  },
  {
    id: '3',
    type: 'security',
    title: 'Security Alert',
    message: 'New login detected from an unrecognized device. Please verify this was you.',
    timestamp: '2023-09-13T08:20:00',
    read: true,
    urgent: true
  },
  {
    id: '4',
    type: 'price',
    title: 'Price Alert',
    message: 'Floor price for Azuki collection has dropped by 10% in the last 24 hours.',
    assetName: 'Azuki #9012',
    assetImage: 'https://via.placeholder.com/40',
    timestamp: '2023-09-12T14:10:00',
    read: true,
    urgent: false
  },
  {
    id: '5',
    type: 'system',
    title: 'System Notification',
    message: 'Your subscription will expire in 7 days. Please renew to maintain access to premium features.',
    timestamp: '2023-09-11T09:00:00',
    read: false,
    urgent: false
  },
];

const defaultSettings: NotificationSettings = {
  priceAlerts: true,
  riskAlerts: true,
  securityAlerts: true,
  systemAlerts: true,
  emailNotifications: true,
  pushNotifications: false,
  alertThreshold: 10
};

const NotificationCenter: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationMenuAnchorEl, setNotificationMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  const urgentCount = notifications.filter(notification => notification.urgent && !notification.read).length;
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  
  const handleNotificationMenuClick = (event: React.MouseEvent<HTMLButtonElement>, notificationId: string) => {
    setNotificationMenuAnchorEl(event.currentTarget);
    setSelectedNotificationId(notificationId);
  };

  
  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchorEl(null);
    setSelectedNotificationId(null);
  };

  
  const handleFilter = (filter: 'all' | 'unread' | 'urgent' | 'price' | 'risk' | 'security' | 'system') => {
    let filteredNotifications = [...mockNotifications];
    
    switch (filter) {
      case 'unread':
        filteredNotifications = filteredNotifications.filter(notification => !notification.read);
        break;
      case 'urgent':
        filteredNotifications = filteredNotifications.filter(notification => notification.urgent);
        break;
      case 'price':
        filteredNotifications = filteredNotifications.filter(notification => notification.type === 'price');
        break;
      case 'risk':
        filteredNotifications = filteredNotifications.filter(notification => notification.type === 'risk');
        break;
      case 'security':
        filteredNotifications = filteredNotifications.filter(notification => notification.type === 'security');
        break;
      case 'system':
        filteredNotifications = filteredNotifications.filter(notification => notification.type === 'system');
        break;
    }
    
    setNotifications(filteredNotifications);
    handleFilterClose();
  };

  
  const handleMarkAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    handleNotificationMenuClose();
  };

  
  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    setNotifications(updatedNotifications);
  };

  
  const handleDeleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
    setNotifications(updatedNotifications);
    handleNotificationMenuClose();
  };

  
  const handleClearAll = () => {
    setNotifications([]);
  };

  
  const handleSettingChange = (setting: keyof NotificationSettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price':
        return <TrendingUpIcon color="primary" />;
      case 'risk':
        return <WarningIcon color="warning" />;
      case 'security':
        return <SecurityIcon color="error" />;
      case 'system':
        return <NotificationsIcon color="info" />;
      default:
        return <NotificationsIcon />;
    }
  };

  
  return (
    <Paper elevation={3} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="notification tabs"
          variant="fullWidth"
        >
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} />
                  Notifications
                </Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Settings
              </Box>
            } 
          />
        </Tabs>
      </Box>
      
      {/* Notifications Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2 }}>
          <Typography variant="h6" component="div">
            {unreadCount > 0 ? (
              <Badge badgeContent={unreadCount} color="error" max={99}>
                Notifications
              </Badge>
            ) : (
              'Notifications'
            )}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              sx={{ mr: 1 }}
            >
              Filter
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={handleMarkAllAsRead}
              >
                Mark All Read
              </Button>
            )}
          </Box>
        </Box>
        
        {notifications.length > 0 ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider variant="inset" component="li" />}
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.read ? 'inherit' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  {notification.assetImage ? (
                    <ListItemAvatar>
                      <Avatar alt={notification.assetName} src={notification.assetImage} />
                    </ListItemAvatar>
                  ) : (
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          component="span"
                          variant="subtitle1"
                          color="text.primary"
                          sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                        >
                          {notification.title}
                        </Typography>
                        {notification.urgent && (
                          <Chip 
                            label="Urgent" 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1, height: 20, color: '#ffffff' }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="more options"
                      onClick={(e) => handleNotificationMenuClick(e, notification.id)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up! We'll notify you when there's something new.
            </Typography>
          </Box>
        )}
        
        {notifications.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 2, mb: 2 }}>
            <Button variant="text" color="error" onClick={handleClearAll}>
              Clear All Notifications
            </Button>
          </Box>
        )}
      </TabPanel>
      
      {/* Settings Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ px: 2 }}>
          <Typography variant="h6" gutterBottom>Notification Settings</Typography>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Alert Types
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <TrendingUpIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Price Alerts" 
                secondary="Notifications about significant price changes in your NFT assets" 
              />
              <Switch
                edge="end"
                checked={settings.priceAlerts}
                onChange={(e) => handleSettingChange('priceAlerts', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Risk Alerts" 
                secondary="Notifications about potential risks affecting your NFT assets" 
              />
              <Switch
                edge="end"
                checked={settings.riskAlerts}
                onChange={(e) => handleSettingChange('riskAlerts', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Security Alerts" 
                secondary="Notifications about security events related to your account" 
              />
              <Switch
                edge="end"
                checked={settings.securityAlerts}
                onChange={(e) => handleSettingChange('securityAlerts', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="System Notifications" 
                secondary="General system announcements and updates" 
              />
              <Switch
                edge="end"
                checked={settings.systemAlerts}
                onChange={(e) => handleSettingChange('systemAlerts', e.target.checked)}
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Delivery Methods
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Email Notifications" 
                secondary="Receive notifications via email" 
              />
              <Switch
                edge="end"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Push Notifications" 
                secondary="Receive push notifications in your browser" 
              />
              <Switch
                edge="end"
                checked={settings.pushNotifications}
                onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Alert Preferences
          </Typography>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" gutterBottom>
              Alert me when price changes by at least {settings.alertThreshold}%
            </Typography>
            <Box sx={{ px: 2 }}>
              <Tooltip title={`${settings.alertThreshold}%`} placement="top" arrow>
                <Box>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={settings.alertThreshold}
                    onChange={(e) => handleSettingChange('alertThreshold', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </Box>
              </Tooltip>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">1%</Typography>
                <Typography variant="caption" color="text.secondary">25%</Typography>
                <Typography variant="caption" color="text.secondary">50%</Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, mb: 2, textAlign: 'center' }}>
            <Button variant="contained" color="primary">
              Save Settings
            </Button>
          </Box>
        </Box>
      </TabPanel>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => handleFilter('all')}>All Notifications</MenuItem>
        <MenuItem onClick={() => handleFilter('unread')}>Unread</MenuItem>
        <MenuItem onClick={() => handleFilter('urgent')}>Urgent</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleFilter('price')}>Price Alerts</MenuItem>
        <MenuItem onClick={() => handleFilter('risk')}>Risk Alerts</MenuItem>
        <MenuItem onClick={() => handleFilter('security')}>Security Alerts</MenuItem>
        <MenuItem onClick={() => handleFilter('system')}>System Notifications</MenuItem>
      </Menu>
      
      {/* Notification Action Menu */}
      <Menu
        anchorEl={notificationMenuAnchorEl}
        open={Boolean(notificationMenuAnchorEl)}
        onClose={handleNotificationMenuClose}
      >
        {selectedNotificationId && (
          <>
            <MenuItem onClick={() => handleMarkAsRead(selectedNotificationId)}>
              Mark as Read
            </MenuItem>
            <MenuItem onClick={() => handleDeleteNotification(selectedNotificationId)}>
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
};

export default NotificationCenter;
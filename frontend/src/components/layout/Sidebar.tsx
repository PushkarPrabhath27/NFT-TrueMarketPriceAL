import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider, Box, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  Collections as CollectionsIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Collections', icon: <CollectionsIcon />, path: '/collections' },
  { text: 'Creators', icon: <PersonIcon />, path: '/creators' },
  { text: 'Market Analysis', icon: <TrendingUpIcon />, path: '/market' },
  { text: 'Portfolio', icon: <AssessmentIcon />, path: '/portfolio' },
];

const secondaryMenuItems = [
  { text: 'Security', icon: <SecurityIcon />, path: '/security' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Help & Support', icon: <HelpIcon />, path: '/help' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar /> {/* This creates space for the AppBar */}
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(63, 81, 181, 0.08)',
                  borderLeft: '4px solid #3f51b5',
                  '& .MuiListItemIcon-root': {
                    color: '#3f51b5',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(63, 81, 181, 0.04)',
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Support & Settings
          </Typography>
        </Box>
        <List>
          {secondaryMenuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
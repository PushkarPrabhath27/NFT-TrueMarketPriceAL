import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider, Box, Typography, useTheme } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const drawerWidth = 280;

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

// Motion variants for animations
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.35,
      ease: "easeOut",
    },
  }),
};

// Styled motion component for list items
const MotionListItem = motion(ListItem);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          background: isDark 
            ? theme.palette.background.paper // Use theme opaque background for better performance
            : theme.palette.background.default, // Use theme opaque background for better performance
          // backdropFilter: 'blur(10px)', // Removed for performance
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[2], // Use a simpler theme shadow
        },
      }}
    >
      <Toolbar /> {/* This creates space for the AppBar */}
      <Box 
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        sx={{ 
          overflow: 'auto', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          px: 2, // Add horizontal padding
        }}
      >
        <Box 
          component={motion.div}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          sx={{ 
            mb: 2, 
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: isDark
                ? 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)'
                : 'linear-gradient(90deg, #3a86ff 0%, #7209b7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
            }}
          >
            NFT TRUST SCORE
          </Typography>
        </Box>
        
        <List>
          {menuItems.map((item, i) => (
            <MotionListItem 
              button 
              key={item.text} 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              whileHover={{ scale: 1.03, x: 5, transition: { duration: 0.2, ease: "easeOut" } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } }}
              sx={{
                my: 0.5,
                borderRadius: '12px',
                overflow: 'hidden',
                '&.Mui-selected': {
                  background: isDark
                    ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(129, 140, 248, 0.15) 100%)'
                    : 'linear-gradient(90deg, rgba(58, 134, 255, 0.15) 0%, rgba(114, 9, 183, 0.15) 100%)',
                  borderLeft: isDark
                    ? '4px solid #38bdf8'
                    : '4px solid #3a86ff',
                  '& .MuiListItemIcon-root': {
                    color: isDark ? '#38bdf8' : '#3a86ff',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: isDark ? '#f1f5f9' : '#1e293b',
                  },
                },
                '&:hover': {
                  background: isDark
                    ? 'rgba(56, 189, 248, 0.05)'
                    : 'rgba(58, 134, 255, 0.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.95rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </MotionListItem>
          ))}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Divider sx={{ 
          my: 2,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        }} />
        
        <Box 
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: (menuItems.length * 0.07) + 0.1, duration: 0.4, ease: "easeOut" }}
          sx={{ px: 1, mb: 1 }}
        >
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            Support & Settings
          </Typography>
        </Box>
        
        <List>
          {secondaryMenuItems.map((item, i) => (
            <MotionListItem 
              button 
              key={item.text} 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
              custom={i + menuItems.length}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              whileHover={{ scale: 1.03, x: 5, transition: { duration: 0.2, ease: "easeOut" } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } }}
              sx={{
                my: 0.5,
                borderRadius: '12px',
                overflow: 'hidden',
                '&.Mui-selected': {
                  background: isDark
                    ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(129, 140, 248, 0.15) 100%)'
                    : 'linear-gradient(90deg, rgba(58, 134, 255, 0.15) 0%, rgba(114, 9, 183, 0.15) 100%)',
                  borderLeft: isDark
                    ? '4px solid #38bdf8'
                    : '4px solid #3a86ff',
                  '& .MuiListItemIcon-root': {
                    color: isDark ? '#38bdf8' : '#3a86ff',
                  },
                },
                '&:hover': {
                  background: isDark
                    ? 'rgba(56, 189, 248, 0.05)'
                    : 'rgba(58, 134, 255, 0.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.95rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </MotionListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
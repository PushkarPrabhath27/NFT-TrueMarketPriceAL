import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Avatar, Box, InputBase, alpha, styled } from '@mui/material';
import { Search as SearchIcon, Notifications as NotificationsIcon, Settings as SettingsIcon } from '@mui/icons-material';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Header: React.FC = () => {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          NFT TrustScore
        </Typography>
        
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search NFTs..."
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex' }}>
          <IconButton size="large" color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton size="large" color="inherit">
            <SettingsIcon />
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar alt="User Profile" src="/static/images/avatar/1.jpg" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
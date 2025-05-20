import React, { useState, useRef } from 'react';
import { useNFT } from '../../context/NFTContext.tsx';
import { AppBar, Toolbar, Typography, IconButton, Badge, Avatar, Box, InputBase, alpha, styled, Popper, Paper, CircularProgress, List, ListItem, ListItemText, useTheme } from '@mui/material';
import { Search as SearchIcon, Notifications as NotificationsIcon, Settings as SettingsIcon, AccountCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[700], 0.5) : alpha(theme.palette.grey[200], 0.7),
  // backdropFilter: 'blur(10px)', // Removed for performance
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[600], 0.6) : alpha(theme.palette.grey[300], 0.8),
    boxShadow: theme.shadows[1],
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  transition: 'all 0.3s ease',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.7) : alpha(theme.palette.common.black, 0.6),
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create(['width', 'background-color']),
    width: '100%',
    fontSize: '0.95rem',
    [theme.breakpoints.up('md')]: {
      width: '25ch',
      '&:focus': {
        width: '35ch',
      },
    },
  },
}));

const Header: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setShowResult(false);
    setSearchError(null);
    setSearchResult(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (e.target.value.trim()) {
        handleSearch(e.target.value.trim());
      }
    }, 500);
  };

  // Import the NFT context hook
  const { searchNFT, setSelectedNFT } = useNFT();

  const handleSearch = async (query: string) => {
    setSearching(true);
    setSearchError(null);
    setShowResult(false);
    
    try {
      // Call the searchNFT function from the NFT context
      const result = await searchNFT(query);
      
      if (result.success && result.data && result.data.length > 0) {
        // Use the first result
        setSearchResult(result.data[0]);
        setShowResult(true);
      } else {
        setSearchError('No NFTs found matching your search.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError(err.message || 'Failed to fetch NFT data from Hathor blockchain.');
    } finally {
      setSearching(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      if (timerRef.current) clearTimeout(timerRef.current);
      handleSearch(searchValue.trim());
    }
  };

  // Animation variants
  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.07,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: theme.palette.background.paper, // Use theme opaque background
        // backdropFilter: 'blur(10px)', // Removed for performance
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1], // Use a simpler theme shadow
      }}>
      <Toolbar component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <Box 
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            mr: 2
          }}
        >
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 700,
              background: isDark
                ? 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)'
                : 'linear-gradient(90deg, #3a86ff 0%, #7209b7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
            }}
          >
            NFT TrustScore
          </Typography>
        </Box>
        <Box sx={{ position: 'relative' }}>
          <Search 
            component={motion.div} 
            whileHover={{ scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }} 
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <SearchIconWrapper
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
            >
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search NFTs or Collections..."
              inputProps={{ 'aria-label': 'search' }}
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              inputRef={inputRef}
              autoComplete="off"
            />
          </Search>
          <Popper open={showResult || searching || !!searchError} anchorEl={inputRef.current} placement="bottom-start" style={{ zIndex: 1301 }}>
            <Paper 
              component={motion.div}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              sx={{ 
                width: 320, 
                mt: 1, 
                p: 2,
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                background: isDark 
                  ? 'rgba(15, 23, 42, 0.85)' 
                  : 'rgba(255, 255, 255, 0.85)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                boxShadow: isDark 
                  ? '0 10px 25px rgba(0, 0, 0, 0.2)'
                  : '0 10px 25px rgba(0, 0, 0, 0.1)',
              }}
            >
              {searching && (
                <Box 
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <CircularProgress size={20} />
                  <Typography variant="body2">Searching...</Typography>
                </Box>
              )}
              {searchError && (
                <Typography color="error" variant="body2">{searchError}</Typography>
              )}
              {searchResult && !searching && !searchError && (
                <List>
                  <ListItem 
                    component={motion.li}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    sx={{ 
                      borderRadius: '8px',
                      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                      mb: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <ListItemText
                      primary={<>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            color: isDark ? '#f1f5f9' : '#1e293b',
                          }}
                        >
                          {searchResult.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Collection: {searchResult.collection}
                        </Typography>
                      </>}
                      secondary={<>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 1,
                            p: 1,
                            borderRadius: '6px',
                            background: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(58, 134, 255, 0.1)',
                          }}
                        >
                          <Typography variant="body2">
                            Trust Score: <Box component="span" sx={{ 
                              fontWeight: 700,
                              color: isDark ? '#38bdf8' : '#3a86ff',
                            }}>{searchResult.trustScore}</Box>
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>Owner: {searchResult.owner}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>History:</Typography>
                        <Box sx={{ pl: 1 }}>
                          {searchResult.history.map((h: any, idx: number) => (
                            <Typography 
                              key={idx} 
                              variant="caption" 
                              sx={{ 
                                display: 'block',
                                borderLeft: `2px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(58, 134, 255, 0.3)'}`,
                                pl: 1,
                                py: 0.5,
                              }}
                            >
                              {h.date}: {h.event}
                            </Typography>
                          ))}
                        </Box>
                      </>}
                    />
                  </ListItem>
                </List>
              )}
            </Paper>
          </Popper>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton 
            component={motion.button}
            custom={0}
            initial="hidden"
            animate="visible"
            variants={iconVariants}
            whileHover={{ scale: 1.1, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } }}
            size="large" 
            color="inherit"
            sx={{ 
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
            }}
          >
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            component={motion.button}
            custom={1}
            initial="hidden"
            animate="visible"
            variants={iconVariants}
            whileHover={{ scale: 1.1, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } }}
            size="large"
            color="inherit"
            sx={{ 
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
            }}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            component={motion.button}
            custom={2}
            initial="hidden"
            animate="visible"
            variants={iconVariants}
            whileHover={{ scale: 1.1, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } }}
            size="large"
            edge="end"
            color="inherit"
            sx={{ 
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
            }}
          >
            <Avatar 
              alt="User" 
              src="/static/images/avatar/1.jpg" 
              sx={{ 
                width: 32, 
                height: 32,
                border: `2px solid ${isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(58, 134, 255, 0.5)'}`,
              }} 
            />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
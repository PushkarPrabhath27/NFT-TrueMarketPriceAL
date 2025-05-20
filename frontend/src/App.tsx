import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Dashboard from './pages/Dashboard.tsx';
import DashboardWithRiskAndFraud from './pages/DashboardWithRiskAndFraud.tsx';
import CollectionAnalysisPage from './pages/CollectionAnalysisPage.tsx';
import Header from './components/layout/Header.tsx';
import Sidebar from './components/layout/Sidebar.tsx';
import UserDashboard from './pages/UserDashboard.tsx';
import MarketAnalysis from './pages/MarketAnalysis.tsx';
import PortfolioPage from './pages/PortfolioPage.tsx';
import futuristicTheme from './theme/futuristicTheme.tsx';
import { NFTProvider } from './context/NFTContext.tsx';

// Import fonts
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function App() {
  // State for theme mode (light/dark)
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  
  // Toggle theme mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Apply theme mode from localStorage or system preference on initial load
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode === 'light' || savedMode === 'dark') {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
  }, []);
  
  // Save theme mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    // Apply a class to the body for global styling if needed
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${mode}-mode`);
  }, [mode]);

  // Create theme based on current mode
  const theme = React.useMemo(() => futuristicTheme(mode), [mode]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: mode === 'light' 
          ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        transition: 'background 0.5s ease-in-out',
        position: 'relative',
      }}>
        {/* Theme toggle button */}
        <IconButton
          onClick={toggleColorMode}
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1100,
            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
        
        <NFTProvider>
          <Router>
            <Box sx={{ display: 'flex', height: '100vh' }}>
            <Header />
            <Sidebar />
            <Box 
              component={motion.main} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              sx={{ 
                flexGrow: 1, 
                p: 3, 
                mt: 8, 
                ml: { sm: 30 },
                overflow: 'auto',
                transition: 'all 0.3s ease-in-out',
                '& > *': {
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  background: mode === 'dark' 
                    ? 'rgba(15, 23, 42, 0.6)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  boxShadow: mode === 'dark'
                    ? '0 10px 30px rgba(0, 0, 0, 0.2)'
                    : '0 10px 30px rgba(0, 0, 0, 0.1)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                }
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/advanced" element={<DashboardWithRiskAndFraud />} />
                <Route path="/collections" element={<CollectionAnalysisPage />} />
                <Route path="/creators" element={<UserDashboard />} />
                <Route path="/market" element={<MarketAnalysis />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/security" element={<UserDashboard />} />
                <Route path="/settings" element={<UserDashboard />} />
                <Route path="/help" element={<UserDashboard />} />
              </Routes>
            </Box>
            </Box>
          </Router>
        </NFTProvider>
      </Box>
    </ThemeProvider>
  );
}

export default App;
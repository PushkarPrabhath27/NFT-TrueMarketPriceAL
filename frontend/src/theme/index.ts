import { createTheme, alpha } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Create a theme instance for both light and dark modes
export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: '#3a86ff',
            light: '#5e9bff',
            dark: '#2563eb',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#7209b7',
            light: '#9d4edd',
            dark: '#560bad',
            contrastText: '#ffffff',
          },
          background: {
            default: '#f8fafc',
            paper: alpha('#ffffff', 0.8),
          },
          text: {
            primary: '#1e293b',
            secondary: '#475569',
          },
          divider: alpha('#94a3b8', 0.2),
        }
      : {
          // Dark mode palette
          primary: {
            main: '#38bdf8',
            light: '#7dd3fc',
            dark: '#0284c7',
            contrastText: '#0f172a',
          },
          secondary: {
            main: '#a855f7',
            light: '#c084fc',
            dark: '#7e22ce',
            contrastText: '#ffffff',
          },
          background: {
            default: '#0f172a',
            paper: alpha('#1e293b', 0.8),
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
          },
          divider: alpha('#64748b', 0.2),
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'light' ? '#f1f1f1' : '#1e293b',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? '#c1c1c1' : '#475569',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: mode === 'light' ? '#a1a1a1' : '#64748b',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          background: mode === 'light' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.7))',
          boxShadow: mode === 'light'
            ? '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            : '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          border: mode === 'light' 
            ? '1px solid rgba(255, 255, 255, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0 12px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.15) inset'
              : '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.07) inset',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #3a86ff, #5e60ce)'
            : 'linear-gradient(135deg, #38bdf8, #818cf8)',
          '&:hover': {
            background: mode === 'light'
              ? 'linear-gradient(135deg, #2563eb, #4338ca)'
              : 'linear-gradient(135deg, #0284c7, #6366f1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          background: mode === 'light' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.6))',
          boxShadow: mode === 'light'
            ? '0 4px 16px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            : '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: mode === 'light'
            ? '1px solid rgba(0, 0, 0, 0.05)'
            : '1px solid rgba(255, 255, 255, 0.05)',
        },
        head: {
          fontWeight: 600,
          background: mode === 'light'
            ? 'rgba(0, 0, 0, 0.02)'
            : 'rgba(255, 255, 255, 0.02)',
        },
      },
    },
  },
});

// Create and export the theme
const futuristicTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));

export default futuristicTheme;
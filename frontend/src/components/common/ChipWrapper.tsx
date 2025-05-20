import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Define color mappings with explicit text colors to avoid theme.palette.*.contrastText issues
const getColorMapping = (color: string) => {
  switch(color) {
    // Standard MUI colors
    case 'primary': return { bgColor: '#3f51b5', textColor: '#ffffff' };
    case 'secondary': return { bgColor: '#f50057', textColor: '#ffffff' };
    case 'success': return { bgColor: '#4caf50', textColor: '#ffffff' };
    case 'warning': return { bgColor: '#ff9800', textColor: '#ffffff' };
    case 'error': return { bgColor: '#d32f2f', textColor: '#ffffff' };
    case 'info': return { bgColor: '#2196f3', textColor: '#ffffff' };
    case 'default': return { bgColor: '#e0e0e0', textColor: '#000000' };
    
    // Risk level colors
    case 'Very Low': return { bgColor: '#4caf50', textColor: '#ffffff' };
    case 'Low': return { bgColor: '#2e7d32', textColor: '#ffffff' };
    case 'Medium': return { bgColor: '#ff9800', textColor: '#ffffff' };
    case 'High': return { bgColor: '#ef5350', textColor: '#ffffff' };
    case 'Very High': return { bgColor: '#d32f2f', textColor: '#ffffff' };
    
    // Trend colors
    case 'improving': return { bgColor: '#4caf50', textColor: '#ffffff' };
    case 'stable': return { bgColor: '#9e9e9e', textColor: '#000000' };
    case 'worsening': return { bgColor: '#d32f2f', textColor: '#ffffff' };
    
    // Default fallback
    default: return { bgColor: '#757575', textColor: '#ffffff' };
  }
};

interface ChipWrapperProps extends Omit<ChipProps, 'color'> {
  chipColor?: string;
  customBgColor?: string;
  customTextColor?: string;
}

/**
 * ChipWrapper component that doesn't rely on theme.palette.*.contrastText properties
 * This component avoids the "Cannot read properties of undefined (reading 'contrastText')" error
 * by using explicit background and text colors instead of theme-dependent color properties.
 */
const ChipWrapper: React.FC<ChipWrapperProps> = ({ 
  chipColor, 
  customBgColor,
  customTextColor,
  sx,
  ...props 
}) => {
  // If custom colors are provided, use them directly
  if (customBgColor && customTextColor) {
    return (
      <Chip
        {...props}
        sx={{ 
          backgroundColor: customBgColor,
          color: customTextColor,
          ...sx
        }}
      />
    );
  }
  
  // Otherwise use our predefined color mappings
  const colorMapping = getColorMapping(chipColor || 'default');
  
  return (
    <Chip
      {...props}
      sx={{ 
        backgroundColor: colorMapping.bgColor,
        color: colorMapping.textColor,
        ...sx
      }}
    />
  );
};

export default ChipWrapper;
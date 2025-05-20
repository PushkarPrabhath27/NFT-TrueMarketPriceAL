import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend
);

interface ComparisonItem {
  name: string;
  data: number[];
  color: string;
}

interface ComparativeRiskAnalysisProps {
  labels: string[];
  comparisonItems: ComparisonItem[];
  timeframes?: string[];
}

const ComparativeRiskAnalysis: React.FC<ComparativeRiskAnalysisProps> = ({
  labels,
  comparisonItems,
  timeframes = ['Current', '1 Month Ago', '3 Months Ago']
}) => {
  const theme = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[0]);

  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: string,
  ) => {
    if (newTimeframe !== null) {
      setSelectedTimeframe(newTimeframe);
    }
  };

  // Prepare chart data
  const chartData = {
    labels,
    datasets: comparisonItems.map(item => ({
      label: item.name,
      data: item.data,
      backgroundColor: `${item.color}33`, // Add transparency
      borderColor: item.color,
      borderWidth: 2,
      pointBackgroundColor: item.color,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: item.color,
      pointRadius: 4,
    }))
  };

  // Chart options with explicit color values instead of theme.palette references
  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: '#e0e0e0', // explicit divider color
        },
        grid: {
          color: '#e0e0e0', // explicit divider color
        },
        pointLabels: {
          color: '#000000', // explicit text.primary color
          font: {
            size: 12,
            family: theme.typography.fontFamily,
          },
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
          color: '#757575', // explicit text.secondary color
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            family: theme.typography.fontFamily,
          },
        },
      },
      tooltip: {
        backgroundColor: '#ffffff', // explicit background.paper color
        titleColor: '#000000', // explicit text.primary color
        bodyColor: '#757575', // explicit text.secondary color
        borderColor: '#e0e0e0', // explicit divider color
        borderWidth: 1,
        padding: 12,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 3,
        usePointStyle: true,
        callbacks: {
          title: (tooltipItems: any) => {
            return labels[tooltipItems[0].dataIndex];
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Comparative Risk Analysis
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={selectedTimeframe}
          exclusive
          onChange={handleTimeframeChange}
          size="small"
          aria-label="timeframe selection"
        >
          {timeframes.map((timeframe) => (
            <ToggleButton key={timeframe} value={timeframe}>
              {timeframe}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ height: 350, position: 'relative' }}>
        <Radar data={chartData} options={chartOptions} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        This radar chart compares risk factors across different NFTs or time periods.
        Lower values indicate lower risk.
      </Typography>
    </Paper>
  );
};

export default ComparativeRiskAnalysis;
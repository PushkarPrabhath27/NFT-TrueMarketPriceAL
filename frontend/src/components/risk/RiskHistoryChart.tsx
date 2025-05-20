import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RiskHistoryDataPoint {
  date: string;
  value: number;
}

interface RiskHistoryData {
  [key: string]: RiskHistoryDataPoint[];
}

interface RiskHistoryChartProps {
  historyData: RiskHistoryData;
  timeframes?: string[];
}

const RiskHistoryChart: React.FC<RiskHistoryChartProps> = ({
  historyData,
  timeframes = ['1 Month', '3 Months', '6 Months', '1 Year']
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[1]);
  const [selectedFactor, setSelectedFactor] = useState(Object.keys(historyData)[0]);
  
  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: string,
  ) => {
    if (newTimeframe !== null) {
      setSelectedTimeframe(newTimeframe);
    }
  };

  const handleFactorChange = (event: SelectChangeEvent) => {
    setSelectedFactor(event.target.value);
  };

  // Filter data based on selected timeframe
  const filterDataByTimeframe = (data: RiskHistoryDataPoint[]) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let monthsToSubtract = 3; // Default to 3 months
    
    if (selectedTimeframe === '1 Month') monthsToSubtract = 1;
    else if (selectedTimeframe === '6 Months') monthsToSubtract = 6;
    else if (selectedTimeframe === '1 Year') monthsToSubtract = 12;
    
    const cutoffDate = new Date(now.setMonth(now.getMonth() - monthsToSubtract));
    
    return data.filter(point => new Date(point.date) >= cutoffDate);
  };

  const filteredData = historyData[selectedFactor] ? 
    filterDataByTimeframe(historyData[selectedFactor]) : [];

  // Prepare chart data
  const chartData = {
    labels: filteredData.map(point => point.date),
    datasets: [
      {
        label: selectedFactor,
        data: filteredData.map(point => point.value),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#2196f3',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      }
    ]
  };

  // Chart options with explicit colors to avoid theme.palette.contrastText errors
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        min: Math.max(0, Math.min(...filteredData.map(point => point.value)) - 10),
        max: Math.min(100, Math.max(...filteredData.map(point => point.value)) + 10),
        title: {
          display: true,
          text: 'Risk Score (lower is better)',
          color: '#000000' // explicit text color
        },
        ticks: {
          callback: (value: number) => `${value}`,
          color: '#757575' // explicit text color
        },
        grid: {
          color: '#e0e0e0' // explicit grid color
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#000000' // explicit text color
        },
        ticks: {
          color: '#757575' // explicit text color
        },
        grid: {
          color: '#e0e0e0' // explicit grid color
        }
      },
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: '#000000' // explicit text color
        }
      },
      tooltip: {
        backgroundColor: '#ffffff', // explicit background color
        titleColor: '#000000', // explicit title color
        bodyColor: '#757575', // explicit body color
        borderColor: '#e0e0e0', // explicit border color
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `Risk Score: ${context.raw}`,
        },
      },
    },
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Risk Evolution Over Time
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="risk-factor-select-label">Risk Factor</InputLabel>
          <Select
            labelId="risk-factor-select-label"
            id="risk-factor-select"
            value={selectedFactor}
            label="Risk Factor"
            onChange={handleFactorChange}
          >
            {Object.keys(historyData).map((factor) => (
              <MenuItem key={factor} value={factor}>
                {factor}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
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
        {filteredData.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              No historical data available for the selected timeframe
            </Typography>
          </Box>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Track how risk factors have evolved over time to identify trends and improvements.
      </Typography>
    </Paper>
  );
};

export default RiskHistoryChart;
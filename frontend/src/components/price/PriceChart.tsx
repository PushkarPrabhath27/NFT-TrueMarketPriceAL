import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface PricePoint {
  date: string;
  price: number;
}

interface KeyEvent {
  date: string;
  event: string;
  impact: 'positive' | 'negative' | 'neutral';
}

interface PriceData {
  currentPrice: number;
  currency: string;
  fairValueEstimate: number;
  confidenceBands: {
    upper: number;
    lower: number;
  };
  history: PricePoint[];
  keyEvents: KeyEvent[];
}

interface PriceChartProps {
  priceData: PriceData;
}

const PriceChart: React.FC<PriceChartProps> = ({ priceData }) => {
  const [timeRange, setTimeRange] = useState<string>('all');

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (timeRange === 'all') return priceData.history;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    if (timeRange === '1m') cutoffDate.setMonth(now.getMonth() - 1);
    if (timeRange === '3m') cutoffDate.setMonth(now.getMonth() - 3);
    if (timeRange === '6m') cutoffDate.setMonth(now.getMonth() - 6);
    if (timeRange === '1y') cutoffDate.setFullYear(now.getFullYear() - 1);
    
    return priceData.history.filter(point => new Date(point.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();
  
  // Find key events that fall within the filtered date range
  const filteredEvents = priceData.keyEvents.filter(event => {
    const eventDate = new Date(event.date);
    return filteredData.some(point => {
      const pointDate = new Date(point.date);
      // Check if the event date is close to any point date (within a few days)
      return Math.abs(eventDate.getTime() - pointDate.getTime()) < 5 * 24 * 60 * 60 * 1000;
    });
  });

  // Create annotations for key events
  const annotations: any = {};
  filteredEvents.forEach((event, index) => {
    const eventDate = new Date(event.date);
    // Find the closest data point
    const closestPoint = filteredData.reduce((prev, curr) => {
      const prevDate = new Date(prev.date);
      const currDate = new Date(curr.date);
      const prevDiff = Math.abs(eventDate.getTime() - prevDate.getTime());
      const currDiff = Math.abs(eventDate.getTime() - currDate.getTime());
      return prevDiff < currDiff ? prev : curr;
    });
    
    const pointIndex = filteredData.findIndex(p => p.date === closestPoint.date);
    
    annotations[`event${index}`] = {
      type: 'point',
      xValue: formatDate(closestPoint.date),
      yValue: closestPoint.price,
      backgroundColor: event.impact === 'positive' ? 'rgba(76, 175, 80, 0.8)' : 
                      event.impact === 'negative' ? 'rgba(244, 67, 54, 0.8)' : 
                      'rgba(255, 193, 7, 0.8)',
      borderColor: 'white',
      borderWidth: 2,
      radius: 6,
      label: {
        content: event.event,
        enabled: true,
        position: 'top',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: 5,
        borderRadius: 3,
        font: {
          size: 10,
        },
      },
    };
  });

  // Prepare data for chart
  const chartData = {
    labels: filteredData.map(point => formatDate(point.date)),
    datasets: [
      {
        label: 'Price History',
        data: filteredData.map(point => point.price),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#3f51b5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3f51b5',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Fair Value Estimate',
        data: Array(filteredData.length).fill(priceData.fairValueEstimate),
        borderColor: 'rgba(76, 175, 80, 0.7)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Upper Confidence Band',
        data: Array(filteredData.length).fill(priceData.confidenceBands.upper),
        borderColor: 'rgba(76, 175, 80, 0.3)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Lower Confidence Band',
        data: Array(filteredData.length).fill(priceData.confidenceBands.lower),
        borderColor: 'rgba(76, 175, 80, 0.3)',
        borderWidth: 1,
        pointRadius: 0,
        fill: '-1',
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} ${priceData.currency}`;
          },
        },
      },
      annotation: {
        annotations: annotations,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666',
        },
      },
      y: {
        title: {
          display: true,
          text: priceData.currency,
          color: '#666',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#666',
          callback: (value: any) => `${value} ${priceData.currency}`,
        },
      },
    },
  };

  const handleTimeRangeChange = (event: React.MouseEvent<HTMLElement>, newTimeRange: string) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            Price History & Fair Value
            <Tooltip title="Historical price data with fair value estimate and confidence bands">
              <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
            </Tooltip>
          </Typography>
          
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
            aria-label="time range"
          >
            <ToggleButton value="1m" aria-label="1 month">
              1M
            </ToggleButton>
            <ToggleButton value="3m" aria-label="3 months">
              3M
            </ToggleButton>
            <ToggleButton value="6m" aria-label="6 months">
              6M
            </ToggleButton>
            <ToggleButton value="1y" aria-label="1 year">
              1Y
            </ToggleButton>
            <ToggleButton value="all" aria-label="all time">
              All
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Current Price
            </Typography>
            <Typography variant="h6">
              {priceData.currentPrice} {priceData.currency}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Fair Value Estimate
            </Typography>
            <Typography variant="h6" color={priceData.fairValueEstimate > priceData.currentPrice ? 'success.main' : 'error.main'}>
              {priceData.fairValueEstimate} {priceData.currency}
              <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                ({((priceData.fairValueEstimate - priceData.currentPrice) / priceData.currentPrice * 100).toFixed(1)}%)
              </Typography>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ height: 300, mt: 2 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>

        {filteredEvents.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              Key Events:
            </Typography>
            {filteredEvents.map((event, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box 
                  sx={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    bgcolor: event.impact === 'positive' ? 'success.main' : 
                             event.impact === 'negative' ? 'error.main' : 
                             'warning.main',
                    mr: 1
                  }} 
                />
                <Typography variant="body2">
                  {formatDate(event.date)}: {event.event}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceChart;
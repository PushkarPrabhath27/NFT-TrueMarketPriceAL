import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
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
  Filler
} from 'chart.js';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

interface RiskDataPoint {
  date: string;
  overallRisk: number;
  factors: {
    name: string;
    value: number;
  }[];
  events?: {
    date: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

interface RiskEvolutionTrackerProps {
  historicalData: RiskDataPoint[];
  title?: string;
  subtitle?: string;
}

const RiskEvolutionTracker: React.FC<RiskEvolutionTrackerProps> = ({
  historicalData,
  title = 'Risk Evolution Over Time',
  subtitle = 'Track how risk factors have changed over time'
}) => {
  const [timeRange, setTimeRange] = useState<string>('1m');
  const [selectedFactor, setSelectedFactor] = useState<string>('overall');

  const handleTimeRangeChange = (event: React.MouseEvent<HTMLElement>, newTimeRange: string) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  const handleFactorChange = (event: React.MouseEvent<HTMLElement>, newFactor: string) => {
    if (newFactor !== null) {
      setSelectedFactor(newFactor);
    }
  };

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(timeRange) {
      case '1w':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0); // Beginning of time
    }
    
    return historicalData.filter(dataPoint => new Date(dataPoint.date) >= cutoffDate);
  }, [historicalData, timeRange]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const labels = filteredData.map(d => d.date);
    
    const datasets = [];
    
    if (selectedFactor === 'overall') {
      datasets.push({
        label: 'Overall Risk',
        data: filteredData.map(d => d.overallRisk),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      });
    } else {
      // Find the selected factor in each data point
      const factorData = filteredData.map(d => {
        const factor = d.factors.find(f => f.name === selectedFactor);
        return factor ? factor.value : null;
      });
      
      datasets.push({
        label: selectedFactor,
        data: factorData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4
      });
    }
    
    return { labels, datasets };
  }, [filteredData, selectedFactor]);

  // Extract all unique factor names
  const factorNames = React.useMemo(() => {
    const names = new Set<string>();
    historicalData.forEach(dataPoint => {
      dataPoint.factors.forEach(factor => {
        names.add(factor.name);
      });
    });
    return Array.from(names);
  }, [historicalData]);

  // Extract events for the selected time period
  const relevantEvents = React.useMemo(() => {
    return filteredData
      .flatMap(d => d.events || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Risk Level'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {subtitle}
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Time Range
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            aria-label="time range"
            size="small"
          >
            <ToggleButton value="1w" aria-label="1 week">
              1W
            </ToggleButton>
            <ToggleButton value="1m" aria-label="1 month">
              1M
            </ToggleButton>
            <ToggleButton value="3m" aria-label="3 months">
              3M
            </ToggleButton>
            <ToggleButton value="1y" aria-label="1 year">
              1Y
            </ToggleButton>
            <ToggleButton value="all" aria-label="all time">
              All
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        
        <Grid item>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Risk Factor
          </Typography>
          <ToggleButtonGroup
            value={selectedFactor}
            exclusive
            onChange={handleFactorChange}
            aria-label="risk factor"
            size="small"
          >
            <ToggleButton value="overall" aria-label="overall risk">
              Overall
            </ToggleButton>
            {factorNames.map(name => (
              <ToggleButton key={name} value={name} aria-label={name}>
                {name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Grid>
      </Grid>
      
      <Box sx={{ height: 300, mb: 3 }}>
        <Line data={chartData} options={chartOptions} />
      </Box>
      
      {relevantEvents.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Key Events
            <Tooltip title="Significant events that may have impacted risk levels">
              <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
            </Tooltip>
          </Typography>
          
          <Grid container spacing={2}>
            {relevantEvents.slice(0, 3).map((event, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {event.date}
                    </Typography>
                    <Typography variant="body2">
                      {event.description}
                    </Typography>
                    <Box 
                      sx={{ 
                        mt: 1, 
                        display: 'inline-block', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        backgroundColor: 
                          event.impact === 'positive' ? 'success.light' :
                          event.impact === 'negative' ? 'error.light' :
                          'grey.200'
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold">
                        {event.impact.charAt(0).toUpperCase() + event.impact.slice(1)} Impact
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {relevantEvents.length > 3 && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2" color="primary">
                +{relevantEvents.length - 3} more events
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default RiskEvolutionTracker;
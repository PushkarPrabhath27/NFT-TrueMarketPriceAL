import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RiskDimension {
  name: string;
  value: number; // 0-100 scale
  maxValue: number;
  description?: string;
}

interface RiskRadarChartProps {
  dimensions: RiskDimension[];
  title?: string;
  subtitle?: string;
}

const RiskRadarChart: React.FC<RiskRadarChartProps> = ({ 
  dimensions, 
  title = 'Multi-Dimensional Risk Assessment',
  subtitle = 'Visualization of risk across key dimensions'
}) => {
  // Prepare data for radar chart
  const labels = dimensions.map(dim => dim.name);
  const values = dimensions.map(dim => dim.value);
  const maxValues = dimensions.map(dim => dim.maxValue);
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Current Risk',
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
      },
      {
        label: 'Maximum Risk',
        data: maxValues,
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderColor: 'rgba(54, 162, 235, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointBackgroundColor: 'rgba(54, 162, 235, 0.5)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const dimension = dimensions[index];
            return [
              `${context.dataset.label}: ${context.raw}`,
              dimension.description ? `Description: ${dimension.description}` : ''
            ].filter(Boolean);
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {subtitle}
      </Typography>
      
      <Box sx={{ height: 350, position: 'relative' }}>
        <Radar data={data} options={options} />
      </Box>
    </Paper>
  );
};

export default RiskRadarChart;
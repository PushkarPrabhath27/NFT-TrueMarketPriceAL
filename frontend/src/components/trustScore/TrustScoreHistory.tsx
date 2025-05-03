import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
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

interface HistoryPoint {
  date: string;
  score: number;
}

interface TrustScoreHistoryProps {
  history: HistoryPoint[];
}

const TrustScoreHistory: React.FC<TrustScoreHistoryProps> = ({ history }) => {
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Prepare data for chart
  const chartData = {
    labels: history.map(point => formatDate(point.date)),
    datasets: [
      {
        label: 'Trust Score',
        data: history.map(point => point.score),
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
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
          title: (tooltipItems: any) => {
            return tooltipItems[0].label;
          },
          label: (context: any) => {
            return `Trust Score: ${context.parsed.y}`;
          },
        },
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
        min: Math.max(0, Math.min(...history.map(point => point.score)) - 10),
        max: Math.min(100, Math.max(...history.map(point => point.score)) + 10),
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#666',
        },
      },
    },
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Trust Score History
          <Tooltip title="Historical evolution of the trust score over time">
            <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
          </Tooltip>
        </Typography>

        <Box sx={{ height: 300, mt: 2 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {getTrendAnalysis(history)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Helper function to analyze the trend
const getTrendAnalysis = (history: HistoryPoint[]) => {
  if (history.length < 2) return 'Insufficient data to analyze trend.';

  const firstScore = history[0].score;
  const lastScore = history[history.length - 1].score;
  const difference = lastScore - firstScore;
  const percentChange = ((difference / firstScore) * 100).toFixed(1);

  if (difference > 5) {
    return `The trust score has shown significant improvement (${percentChange}%) over this period, indicating positive developments in the NFT's trust factors.`;
  } else if (difference > 0) {
    return `The trust score has shown slight improvement (${percentChange}%) over this period, suggesting gradual positive developments.`;
  } else if (difference === 0) {
    return 'The trust score has remained stable over this period, indicating consistent performance.';
  } else if (difference > -5) {
    return `The trust score has shown a slight decline (${percentChange}%) over this period, which may warrant monitoring.`;
  } else {
    return `The trust score has shown a significant decline (${percentChange}%) over this period, which may indicate concerning developments that require attention.`;
  }
};

export default TrustScoreHistory;
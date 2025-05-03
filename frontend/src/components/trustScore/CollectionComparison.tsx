import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

interface ComparisonItem {
  name: string;
  score: number;
}

interface CollectionComparisonProps {
  collectionData: ComparisonItem[];
}

const CollectionComparison: React.FC<CollectionComparisonProps> = ({ collectionData }) => {
  // Prepare data for chart
  const chartData = {
    labels: collectionData.map(item => item.name),
    datasets: [
      {
        label: 'Trust Score',
        data: collectionData.map(item => item.score),
        backgroundColor: collectionData.map(item => 
          item.name === 'This NFT' ? '#3f51b5' : 'rgba(63, 81, 181, 0.5)'
        ),
        borderColor: collectionData.map(item => 
          item.name === 'This NFT' ? '#303f9f' : 'rgba(48, 63, 159, 0.5)'
        ),
        borderWidth: 1,
        borderRadius: 4,
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
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#666',
        },
      },
    },
  };

  // Find this NFT's position in the collection
  const thisNft = collectionData.find(item => item.name === 'This NFT');
  const collectionAvg = collectionData.find(item => item.name === 'Collection Average');
  
  let positionAnalysis = '';
  if (thisNft && collectionAvg) {
    const difference = thisNft.score - collectionAvg.score;
    if (difference > 10) {
      positionAnalysis = `This NFT's trust score is significantly higher (${difference.toFixed(1)} points) than the collection average, placing it among the more trustworthy assets in this collection.`;
    } else if (difference > 0) {
      positionAnalysis = `This NFT's trust score is slightly higher (${difference.toFixed(1)} points) than the collection average, indicating above-average trustworthiness.`;
    } else if (difference === 0) {
      positionAnalysis = `This NFT's trust score is exactly at the collection average.`;
    } else if (difference > -10) {
      positionAnalysis = `This NFT's trust score is slightly lower (${Math.abs(difference).toFixed(1)} points) than the collection average, suggesting some minor concerns relative to other assets in this collection.`;
    } else {
      positionAnalysis = `This NFT's trust score is significantly lower (${Math.abs(difference).toFixed(1)} points) than the collection average, indicating more substantial concerns compared to other assets in this collection.`;
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Collection Comparison
          <Tooltip title="How this NFT's trust score compares to others in the same collection">
            <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
          </Tooltip>
        </Typography>

        <Box sx={{ height: 300, mt: 2 }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {positionAnalysis}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CollectionComparison;
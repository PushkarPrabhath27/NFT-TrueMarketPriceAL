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

interface ComparativeItem {
  name: string;
  price: number;
}

interface ComparativePricingProps {
  comparativeData: ComparativeItem[];
}

const ComparativePricing: React.FC<ComparativePricingProps> = ({ comparativeData }) => {
  // Prepare data for chart
  const chartData = {
    labels: comparativeData.map(item => item.name),
    datasets: [
      {
        label: 'Price (ETH)',
        data: comparativeData.map(item => item.price),
        backgroundColor: comparativeData.map(item => 
          item.name === 'This NFT' ? '#f50057' : 'rgba(245, 0, 87, 0.5)'
        ),
        borderColor: comparativeData.map(item => 
          item.name === 'This NFT' ? '#c51162' : 'rgba(197, 17, 98, 0.5)'
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
        callbacks: {
          label: (context: any) => {
            return `Price: ${context.parsed.y} ETH`;
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
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#666',
          callback: (value: any) => `${value} ETH`,
        },
      },
    },
  };

  // Find this NFT's position in the comparison
  const thisNft = comparativeData.find(item => item.name === 'This NFT');
  const collectionAvg = comparativeData.find(item => item.name === 'Collection Average');
  const floorPrice = comparativeData.find(item => item.name === 'Collection Floor');
  
  let priceAnalysis = '';
  if (thisNft && collectionAvg && floorPrice) {
    const aboveFloor = ((thisNft.price - floorPrice.price) / floorPrice.price * 100).toFixed(1);
    const vsAverage = ((thisNft.price - collectionAvg.price) / collectionAvg.price * 100).toFixed(1);
    
    if (Number(vsAverage) < -10) {
      priceAnalysis = `This NFT is priced ${Math.abs(Number(vsAverage))}% below the collection average and ${aboveFloor}% above the floor price, suggesting it may be undervalued compared to similar NFTs in this collection.`;
    } else if (Number(vsAverage) > 10) {
      priceAnalysis = `This NFT is priced ${vsAverage}% above the collection average and ${aboveFloor}% above the floor price, indicating a premium valuation that may reflect unique attributes or higher perceived value.`;
    } else {
      priceAnalysis = `This NFT is priced close to the collection average (${vsAverage}% difference) and ${aboveFloor}% above the floor price, suggesting a fair market valuation relative to other NFTs in this collection.`;
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          Comparative Pricing
          <Tooltip title="How this NFT's price compares to others in the same collection and similar NFTs">
            <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
          </Tooltip>
        </Typography>

        <Box sx={{ height: 300, mt: 2 }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {priceAnalysis}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ComparativePricing;
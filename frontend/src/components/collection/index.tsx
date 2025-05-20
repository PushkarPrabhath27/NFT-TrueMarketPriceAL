import React from 'react';
import CollectionOverviewDashboard from './CollectionOverviewDashboard.tsx';
import MarketSegmentAnalysis from '../analysis/MarketSegments.tsx';
import CollectionOverview from '../analysis/CollectionOverview.tsx';
import CollectionInfo from '../blockchain/CollectionInfo.tsx';
import CreatorProfile from '../creator/CreatorProfile.tsx';

// Re-export components for easier imports
export { 
  CollectionOverviewDashboard, 
  MarketSegmentAnalysis, 
  CollectionOverview, 
  CollectionInfo,
  CreatorProfile 
};

// Creator Profile Interface with proper implementation
export const CreatorProfileInterface: React.FC<{ creatorAddress?: string }> = ({ creatorAddress }) => {
  const [creatorData, setCreatorData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const mockData = {
          address: creatorAddress || '0x1234...5678',
          name: 'NFT Creator',
          bio: 'Digital artist and NFT creator passionate about blockchain technology.',
          avatar: 'https://via.placeholder.com/150',
          isVerified: true,
          joinDate: '2021-01-01',
          collections: [
            {
              name: 'Collection 1',
              floorPrice: 0.5,
              volume: 100,
              items: 1000,
              holders: 500
            },
            {
              name: 'Collection 2',
              floorPrice: 0.8,
              volume: 150,
              items: 1500,
              holders: 750
            }
          ],
          stats: {
            totalSales: 1500,
            avgPrice: 1.2,
            totalVolume: 1800,
            uniqueCollectors: 950
          },
          history: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            sales: Math.floor(Math.random() * 50) + 10,
            volume: Math.random() * 100 + 20
          })),
          trustScore: 85,
          riskLevel: 'Low' as const
        };

        setCreatorData(mockData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch creator data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [creatorAddress]);

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <p>Loading creator profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'red' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!creatorData) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <p>No creator data available.</p>
      </div>
    );
  }

  return <CreatorProfile {...creatorData} />;
};
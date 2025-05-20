/**
 * NFTContext.tsx
 * 
 * Context provider to manage the selected NFT state across all components.
 * This provides a central state management solution for the application.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { NFTData } from '../blockchain/hathor/transformation/DataTransformer.ts';
import hathorApi from '../services/api.ts';

interface NFTContextType {
  selectedNFT: string | null;
  setSelectedNFT: (nftId: string | null) => void;
  nftData: NFTData | null;
  loading: boolean;
  error: string | null;
  searchNFT: (query: string) => Promise<any>;
}

const NFTContext = createContext<NFTContextType | null>(null);

interface NFTProviderProps {
  children: React.ReactNode;
}

/**
 * NFT Provider component that wraps the application and provides NFT context
 */
export const NFTProvider: React.FC<NFTProviderProps> = ({ children }) => {
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [nftData, setNFTData] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedNFT) {
      fetchNFTData(selectedNFT);
    } else {
      // Clear data when no NFT is selected
      setNFTData(null);
    }
  }, [selectedNFT]);
  
  /**
   * Fetch NFT data from the Hathor blockchain API
   */
  const fetchNFTData = async (nftId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await hathorApi.getNFTData(nftId);
      setNFTData(response.data);
    } catch (err: any) {
      console.error('Error fetching NFT data:', err);
      setError(err.message || 'Failed to fetch NFT data');
      setNFTData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search for NFTs on the Hathor blockchain
   */
  const searchNFT = async (query: string) => {
    try {
      return await hathorApi.searchNFT(query);
    } catch (err: any) {
      console.error('Error searching NFTs:', err);
      throw err;
    }
  };
  
  return (
    <NFTContext.Provider value={{ 
      selectedNFT, 
      setSelectedNFT, 
      nftData, 
      loading, 
      error,
      searchNFT
    }}>
      {children}
    </NFTContext.Provider>
  );
};

/**
 * Hook to use the NFT context
 */
export const useNFT = () => {
  const context = useContext(NFTContext);
  if (!context) {
    throw new Error('useNFT must be used within an NFTProvider');
  }
  return context;
};

/**
 * Export the API service for use in components
 */
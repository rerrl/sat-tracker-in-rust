import { useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface BitcoinPriceResponse {
  success: boolean;
  price?: number;
  cached?: boolean;
  cacheAge?: number;
  timestamp?: number;
  stale?: boolean;
  message?: string;
  error?: string;
}

export const useBitcoinPrice = () => {
  const query = useQuery<BitcoinPriceResponse>({
    queryKey: ['bitcoinPrice'],
    queryFn: async (): Promise<BitcoinPriceResponse> => {
      const response = await invoke('fetch_bitcoin_price');
      return response as BitcoinPriceResponse;
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 25 * 1000, // Consider data stale after 25 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    price: query.data?.price || 115420, // Fallback price
    loading: query.isLoading,
    error: query.error?.message || null,
  };
};

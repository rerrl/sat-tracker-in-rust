import { useQuery } from "@tanstack/react-query";
import { TauriService, BitcoinHistoricalPriceData } from "../services/tauriService";

export const useBitcoinHistoricalPrices = (enabled: boolean = true) => {
  const query = useQuery<BitcoinHistoricalPriceData[]>({
    queryKey: ["bitcoinHistoricalPrices"],
    queryFn: async () => {
      const data = await TauriService.fetchBitcoinHistoricalPrices();
      // Sort oldest-first for easy balance calculation
      return [...data].sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
    },
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hour — prices don't change often
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });

  return {
    prices: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
};

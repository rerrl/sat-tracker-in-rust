import { useQuery } from "@tanstack/react-query";
import { TauriService, PortfolioMetrics } from "../services/tauriService";

export const usePortfolioMetrics = (isDatabaseInitialized: boolean) => {
  const {
    data: portfolioMetrics,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolioMetrics'],
    queryFn: async (): Promise<PortfolioMetrics> => {
      console.log("Fetching portfolio metrics");
      return await TauriService.getPortfolioMetrics();
    },
    enabled: isDatabaseInitialized,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  return {
    portfolioMetrics: portfolioMetrics || null,
    loading,
    error: error ? (error instanceof Error ? error.message : "Failed to load metrics") : null,
    refetch: () => refetch(),
  };
};

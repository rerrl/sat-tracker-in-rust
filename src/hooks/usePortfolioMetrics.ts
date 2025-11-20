import { useQuery } from "@tanstack/react-query";
import { TauriService, OverviewMetrics } from "../services/tauriService";

export const usePortfolioMetrics = (isDatabaseInitialized: boolean) => {
  const {
    data: portfolioMetrics,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolioMetrics'],
    queryFn: async (): Promise<OverviewMetrics> => {
      console.log("Fetching overview metrics");
      return await TauriService.getOverviewMetrics();
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

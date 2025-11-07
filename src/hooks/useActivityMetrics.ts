import { useQuery } from "@tanstack/react-query";
import { TauriService, ActivityMetrics } from "../services/tauriService";

export const useActivityMetrics = (isDatabaseInitialized: boolean) => {
  const {
    data: activityMetrics,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activityMetrics'],
    queryFn: async (): Promise<ActivityMetrics> => {
      console.log("Fetching activity metrics");
      return await TauriService.getActivityMetrics();
    },
    enabled: isDatabaseInitialized,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  return {
    activityMetrics: activityMetrics || null,
    loading,
    error: error ? (error instanceof Error ? error.message : "Failed to load activity metrics") : null,
    refetch: () => refetch(),
  };
};

import { useQuery } from "@tanstack/react-query";
import { TauriService, UnifiedEvent } from "../services/tauriService";

export const useCombinedEvents = (isDatabaseInitialized: boolean) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["combinedEvents"],
    queryFn: async () => {
      console.log("Fetching all unified events");
      let allEvents: UnifiedEvent[] = [];
      let currentPage = 0;
      let hasMore = true;
      let totalCount = 0;

      while (hasMore) {
        const result = await TauriService.getUnifiedEvents(
          currentPage,
          1000
        );
        allEvents = [...allEvents, ...result.events];
        hasMore = result.has_more;
        totalCount = result.total_count;
        currentPage++;
      }

      return {
        events: allEvents,
        totalCount,
      };
    },
    enabled: isDatabaseInitialized,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  return {
    events: data?.events || [],
    totalCount: data?.totalCount || 0,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to load events"
      : null,
    refetch,
  };
};

// Keep the existing transaction mutations for backward compatibility
export { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from './useTransactions';

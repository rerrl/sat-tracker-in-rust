import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TauriService, BalanceChangeEvent, CreateBalanceChangeEventRequest, UpdateBalanceChangeEventRequest } from "../services/tauriService";

export const useEvents = (isDatabaseInitialized: boolean) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log("Fetching all events");
      let allEvents: BalanceChangeEvent[] = [];
      let currentPage = 0;
      let hasMore = true;
      let totalCount = 0;

      while (hasMore) {
        const result = await TauriService.getBalanceChangeEvents(currentPage, 1000);
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
    error: error ? (error instanceof Error ? error.message : "Failed to load events") : null,
    refetch,
  };
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateBalanceChangeEventRequest) => 
      TauriService.createBalanceChangeEvent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['activityMetrics'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateBalanceChangeEventRequest }) => 
      TauriService.updateBalanceChangeEvent(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['activityMetrics'] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => TauriService.deleteBalanceChangeEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['activityMetrics'] });
    },
  });
};

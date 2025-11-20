import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TauriService,
  ExchangeTransaction,
  CreateExchangeTransactionRequest,
  UpdateExchangeTransactionRequest,
} from "../services/tauriService";

export const useExchangeTransactions = (isDatabaseInitialized: boolean) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["exchangeTransactions"],
    queryFn: async () => {
      console.log("Fetching all exchange transactions");
      let allTransactions: ExchangeTransaction[] = [];
      let currentPage = 0;
      let hasMore = true;
      let totalCount = 0;

      while (hasMore) {
        const result = await TauriService.getExchangeTransactions(
          currentPage,
          1000
        );
        allTransactions = [...allTransactions, ...result.transactions];
        hasMore = result.has_more;
        totalCount = result.total_count;
        currentPage++;
      }

      return {
        transactions: allTransactions,
        totalCount,
      };
    },
    enabled: isDatabaseInitialized,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  return {
    transactions: data?.transactions || [],
    totalCount: data?.totalCount || 0,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to load transactions"
      : null,
    refetch,
  };
};

export const useCreateExchangeTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateExchangeTransactionRequest) =>
      TauriService.createExchangeTransaction(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });
    },
  });
};

export const useUpdateExchangeTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: UpdateExchangeTransactionRequest;
    }) => TauriService.updateExchangeTransaction(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });
    },
  });
};

export const useDeleteExchangeTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TauriService.deleteExchangeTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });
    },
  });
};

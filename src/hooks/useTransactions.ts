import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TauriService,
  ExchangeTransaction,
  CreateBitcoinTransactionRequest,
  UpdateBitcoinTransactionRequest,
} from "../services/tauriService";

export const useTransactions = (isDatabaseInitialized: boolean) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      console.log("Fetching all transactions");
      let allTransactions: ExchangeTransaction[] = [];
      let currentPage = 0;
      let hasMore = true;
      let totalCount = 0;

      while (hasMore) {
        const result = await TauriService.getBitcoinTransactions(
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

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBitcoinTransactionRequest) =>
      TauriService.createBitcoinTransaction(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: UpdateBitcoinTransactionRequest;
    }) => TauriService.updateBitcoinTransaction(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TauriService.deleteBitcoinTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });
    },
  });
};

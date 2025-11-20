import { QueryClient } from "@tanstack/react-query";

export const invalidateAfterUnifiedEventDataChange = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["unifiedEvents"] });
  queryClient.invalidateQueries({ queryKey: ["portfolioMetrics"] });
  queryClient.invalidateQueries({ queryKey: ["activityMetrics"] });
};

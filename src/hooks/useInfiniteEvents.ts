import { useState, useCallback, useRef, useEffect } from "react";
import { TauriService, UnifiedEvent } from "../services/tauriService";
import { useQueryClient } from "@tanstack/react-query";

interface InfiniteEventsResult {
  events: UnifiedEvent[];
  totalCount: number;
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  /** Refetch from page 0, used after mutations */
  refetch: () => Promise<void>;
  error: string | null;
}

const PAGE_SIZE = 100;

export function useInfiniteEvents(
  enabled: boolean
): InfiniteEventsResult {
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPageRef = useRef(0);
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);

  const loadInitialPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await TauriService.getUnifiedEvents(0, PAGE_SIZE);
      if (!mountedRef.current) return;
      setEvents(result.events);
      setTotalCount(result.total_count);
      setHasMore(result.has_more);
      currentPageRef.current = 0;
    } catch (e) {
      if (!mountedRef.current) return;
      setError(
        e instanceof Error ? e.message : "Failed to load events"
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;
    loadInitialPage();
    return () => {
      mountedRef.current = false;
    };
  }, [enabled, loadInitialPage]);

  // Listen for query cache invalidation on ['unifiedEvents']
  // so we auto-refetch when create/edit/delete mutations happen
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "unifiedEvents"
      ) {
        loadInitialPage();
      }
    });

    return () => unsubscribe();
  }, [enabled, queryClient, loadInitialPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPageRef.current + 1;
      const result = await TauriService.getUnifiedEvents(
        nextPage,
        PAGE_SIZE
      );
      if (!mountedRef.current) return;
      setEvents((prev) => [...prev, ...result.events]);
      setHasMore(result.has_more);
      currentPageRef.current = nextPage;
    } catch (e) {
      if (!mountedRef.current) return;
      setError(
        e instanceof Error ? e.message : "Failed to load more events"
      );
    } finally {
      if (mountedRef.current) setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  return {
    events,
    totalCount,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch: loadInitialPage,
    error,
  };
}
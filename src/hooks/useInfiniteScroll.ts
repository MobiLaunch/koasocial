import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>;
  pageSize?: number;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setItems(result.data);
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor && result.data.length >= pageSize);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    
    setLoadingMore(true);
    try {
      const result = await fetchFn(cursor);
      setItems(prev => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor && result.data.length >= pageSize);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFn, cursor, loadingMore, hasMore, pageSize]);

  const refresh = useCallback(() => {
    setCursor(undefined);
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  // Initial load
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Intersection observer for sentinel
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        { rootMargin: '200px' }
      );
      
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, loadMore]
  );

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    sentinelRef,
  };
}

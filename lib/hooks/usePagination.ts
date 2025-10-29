import { useState, useCallback, useRef } from 'react';

import { Meal } from '@/types/meal';

interface PaginationState {
  items: Meal[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
}

interface UsePaginationOptions {
  initialPageSize?: number;
  loadMoreSize?: number;
  maxItems?: number;
}

export function usePagination(options: UsePaginationOptions = {}): {
  items: Meal[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  setItems: (items: Meal[]) => void;
  appendItems: (newItems: Meal[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  lastItemElementRef: (node: HTMLDivElement | null) => void;
  markLoadComplete: () => void;
  initialPageSize: number;
  loadMoreSize: number;
} {
  const {
    initialPageSize = 6, // Load 6 items initially for fast first paint
    loadMoreSize = 6, // Load 6 more items on scroll
    maxItems = 50, // Maximum items to prevent memory issues
  } = options;

  const [state, setState] = useState<PaginationState>({
    items: [],
    isLoading: false,
    hasMore: true,
    error: null,
    page: 0,
  });

  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setItems = useCallback(
    (items: Meal[]) => {
      setState(prev => ({
        ...prev,
        items: items.slice(0, maxItems), // Limit total items
        hasMore: items.length < maxItems,
        page: 0,
      }));
    },
    [maxItems]
  );

  const appendItems = useCallback(
    (newItems: Meal[]) => {
      setState(prev => {
        const combinedItems = [...prev.items, ...newItems];
        const limitedItems = combinedItems.slice(0, maxItems);

        return {
          ...prev,
          items: limitedItems,
          hasMore:
            combinedItems.length < maxItems && newItems.length === loadMoreSize,
          page: prev.page + 1,
          isLoading: false,
          error: null,
        };
      });
    },
    [loadMoreSize, maxItems]
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const reset = useCallback(() => {
    setState({
      items: [],
      isLoading: false,
      hasMore: true,
      error: null,
      page: 0,
    });
    loadingRef.current = false;

    // Clear any pending loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // Intersection Observer for infinite scroll
  const lastItemElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingRef.current) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && state.hasMore && !state.isLoading) {
            loadingRef.current = true;

            // Clear any existing timeout
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }

            // Only show loading state if it takes more than 200ms
            loadingTimeoutRef.current = setTimeout(() => {
              setState(prev => ({ ...prev, isLoading: true }));
            }, 200);
          }
        },
        {
          rootMargin: '500px', // Trigger 500px before the element comes into view for much smoother loading
        }
      );

      if (node) observerRef.current.observe(node);
      lastItemRef.current = node;
    },
    [state.hasMore, state.isLoading]
  );

  const markLoadComplete = useCallback(() => {
    loadingRef.current = false;

    // Clear loading timeout and reset loading state
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  return {
    ...state,
    setItems,
    appendItems,
    setLoading,
    setError,
    reset,
    lastItemElementRef,
    markLoadComplete,
    initialPageSize,
    loadMoreSize,
  };
}

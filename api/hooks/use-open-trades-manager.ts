import { useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '../types';
import { useGetOpenTradesQuery } from './trade-service';
import { OpenTradesData, OpenTradeDataSchemaType, OpenOrderDataSchemaType } from '../schema';

interface UseOpenTradesManagerOptions {
  account: number;
}

interface UseOpenTradesManagerReturn {
  data: OpenTradesData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidateAndRefetch: () => Promise<void>;
  // Future optimistic update methods
  optimisticUpdateTrade: (tradeId: number, updates: Partial<OpenTradeDataSchemaType>) => void;
  optimisticUpdateOrder: (orderId: string, updates: Partial<OpenOrderDataSchemaType>) => void;
  // Stability improvements
  hasStableData: boolean;
  isApiHealthy: boolean;
}

/**
 * Shared hook for managing open trades with smart caching and request deduplication.
 * Prevents multiple simultaneous refetches for the same account.
 * Enhanced with stability features to prevent flickering when API fails but WebSocket remains stable.
 */
export function useOpenTradesManager({
  account,
}: UseOpenTradesManagerOptions): UseOpenTradesManagerReturn {
  const queryClient = useQueryClient();
  const pendingRefetchRef = useRef<Promise<void> | null>(null);
  const lastSuccessfulDataRef = useRef<OpenTradesData | null>(null);
  
  // Minimum time between refetches to prevent spam (in milliseconds)
  const REFETCH_DEBOUNCE_MS = 100;

  const {
    data: openTrades,
    isLoading,
    error,
    refetch: originalRefetch,
    dataUpdatedAt,
    isError,
  } = useGetOpenTradesQuery({
    account,
  });

  // Track API health and data stability
  const isApiHealthy = useMemo(() => {
    return !isError && !error;
  }, [isError, error]);

  // Store last successful data for stability during API failures
  const stableData = useMemo(() => {
    if (openTrades) {
      lastSuccessfulDataRef.current = openTrades;
      return openTrades;
    }
    
    // If API is failing but we have previous successful data, return that
    // This prevents flickering when API temporarily fails
    if (!isApiHealthy && lastSuccessfulDataRef.current) {
      return lastSuccessfulDataRef.current;
    }
    
    return openTrades;
  }, [openTrades, isApiHealthy]);

  const hasStableData = useMemo(() => {
    return Boolean(stableData || lastSuccessfulDataRef.current);
  }, [stableData]);

  // Smart refetch that prevents multiple simultaneous calls
  const refetch = useCallback(async (): Promise<void> => {
    const now = Date.now();
    
    // If there's already a pending refetch, return that promise
    if (pendingRefetchRef.current) {
      return pendingRefetchRef.current;
    }

    // If we've refetched very recently, skip this call
    // Use React Query's dataUpdatedAt instead of manual tracking
    if (dataUpdatedAt && now - dataUpdatedAt < REFETCH_DEBOUNCE_MS) {
      return Promise.resolve();
    }

    // Create new refetch promise
    const refetchPromise = (async () => {
      try {
        await originalRefetch();
      } finally {
        pendingRefetchRef.current = null;
      }
    })();

    pendingRefetchRef.current = refetchPromise;
    return refetchPromise;
  }, [originalRefetch, dataUpdatedAt]);

  // Invalidate and refetch with smart deduplication
  const invalidateAndRefetch = useCallback(async (): Promise<void> => {
    // If there's already a pending operation, wait for it
    if (pendingRefetchRef.current) {
      await pendingRefetchRef.current;
    }

    // Invalidate the query cache
    await queryClient.invalidateQueries({
      queryKey: [QueryKeys.GET_OPEN_TRADES, account],
    });

    // Then perform smart refetch
    return refetch();
  }, [queryClient, account, refetch]);

  // Optimistic update for trades (foundation for future feature)
  const optimisticUpdateTrade = useCallback(
    (tradeId: number, updates: Partial<OpenTradeDataSchemaType>) => {
      const queryKey = [QueryKeys.GET_OPEN_TRADES, account];
      const currentData = queryClient.getQueryData<OpenTradesData>(queryKey);
      
      if (currentData) {
        const updatedData = {
          ...currentData,
          open_trades: currentData.open_trades?.map((trade) =>
            trade.trade_id === tradeId ? { ...trade, ...updates } : trade
          ),
        };
        
        queryClient.setQueryData(queryKey, updatedData);
        // Also update our stable data reference
        lastSuccessfulDataRef.current = updatedData;
      }
    },
    [queryClient, account]
  );

  // Optimistic update for orders (foundation for future feature)
  const optimisticUpdateOrder = useCallback(
    (orderId: string, updates: Partial<OpenOrderDataSchemaType>) => {
      const queryKey = [QueryKeys.GET_OPEN_TRADES, account];
      const currentData = queryClient.getQueryData<OpenTradesData>(queryKey);
      
      if (currentData) {
        const updatedData = {
          ...currentData,
          open_orders: currentData.open_orders?.map((order) =>
            order.order_id === orderId ? { ...order, ...updates } : order
          ),
        };
        
        queryClient.setQueryData(queryKey, updatedData);
        // Also update our stable data reference
        lastSuccessfulDataRef.current = updatedData;
      }
    },
    [queryClient, account]
  );

  return useMemo(() => ({
    data: stableData,
    isLoading: isLoading && !hasStableData, // Don't show loading if we have stable data
    error: hasStableData ? null : error, // Don't show error if we have stable data to fall back to
    refetch,
    invalidateAndRefetch,
    optimisticUpdateTrade,
    optimisticUpdateOrder,
    hasStableData,
    isApiHealthy,
  }), [
    stableData,
    isLoading,
    hasStableData,
    error,
    refetch,
    invalidateAndRefetch,
    optimisticUpdateTrade,
    optimisticUpdateOrder,
    isApiHealthy,
  ]);
} 
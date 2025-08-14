import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ApiRoutes, QueryKeys } from '../types';
import { useAuthenticatedApi } from '../services/api';
import { TradeHistoryData, TradeHistoryInput } from '../schema/trade-history'

export const useGetTradeHistory = (
  variables: TradeHistoryInput,
  options?: Partial<UseQueryOptions<TradeHistoryData, Error>>
) => {
  const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<TradeHistoryData>();
  
  return useQuery({
    queryKey: [QueryKeys.GET_TRADE_HISTORY, variables.account, variables.page],
    queryFn: function () {
      return fetchFromApi(
        `${ApiRoutes.GET_TRADE_HISTORY}/${variables.account}?page=${variables.page ?? 1}`
      );
    },
    enabled: Boolean(variables.account) && isLoaded && isSignedIn,
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication failed')) {
        return false;
      }
      return failureCount < 3;
    },
    ...(options ?? {}),
  });
};

export const useGetBTTradeHistory = (
  variables: TradeHistoryInput,
  options?: Partial<UseQueryOptions<TradeHistoryData, Error>>
) => {
  const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<TradeHistoryData>();
  
  return useQuery({
    queryKey: [QueryKeys.GET_BT_TRADE_HISTORY, variables.account],
    queryFn: function () {
      return fetchFromApi(
        `${ApiRoutes.GET_BT_TRADE_HISTORY}/${variables.account}?page=${variables.page ?? 1}`
      );
    },
    enabled: Boolean(variables.account) && isLoaded && isSignedIn,
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication failed')) {
        return false;
      }
      return failureCount < 3;
    },
    ...(options ?? {}),
  });
};
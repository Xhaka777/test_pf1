import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions
} from '@tanstack/react-query';
import { ApiRoutes, QueryKeys } from '../types';
import { useAuthenticatedApi } from '../services/api';
import { AccountTypeEnum } from '@/constants/enums';
import { Metrics, SymbolInfo } from '../schema/metrics';

export function useGetMetricsByFilters(
    id: number,
    params?: {
        start_date: string;
        end_date: string;
    },
    options?: Partial<UseQueryOptions<Metrics, Error>>
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<Metrics>();

    const queryParams = new URLSearchParams(params || {}).toString();

    return useQuery<Metrics>({
        queryKey: [`${QueryKeys.GET_METRICS}-${id}-${queryParams}`],
        queryFn: () => {
            const url = `${ApiRoutes.GET_METRICS}/${id}${params?.start_date && params?.end_date ? `?${queryParams}` : ''}`;
            return fetchFromApi(url);
        },
        enabled: isLoaded && isSignedIn && !!id,
        staleTime: 0,
        ...options
    });
}

export function useGetMetrics(
    id: number,
    options?: Partial<UseQueryOptions<Metrics, Error>>
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<Metrics>();

    return useQuery<Metrics>({
        queryKey: [QueryKeys.GET_METRICS, id],
        queryFn: () => {
            const url = `${ApiRoutes.GET_METRICS}/${id}`;
            return fetchFromApi(url);
        },
        enabled: isLoaded && isSignedIn && !!id,
        staleTime: 0,
        ...options
    });
}

export function useGetSymbolInfo(
    exchange: string,
    server: string,
    symbol: string,
    options?: Partial<UseQueryOptions<SymbolInfo, Error>>
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<SymbolInfo>();

    return useQuery<SymbolInfo>({
        queryKey: [QueryKeys.GET_SYMBOL_INFO, exchange, server, symbol],
        queryFn: () => {
            const url = `${ApiRoutes.GET_SYMBOL_INFO}/${exchange}/${server}/${symbol}`;
            return fetchFromApi(url);
        },
        enabled: isLoaded && isSignedIn && !!exchange && !!server && !!symbol,
        staleTime: 0,
        ...options
    });
}
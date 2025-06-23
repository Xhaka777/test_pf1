import { useQuery, UseQueryOptions, useMutation, QueryClient } from '@tanstack/react-query';
import { ApiRoutes, QueryKeys } from '../types';
import { useAuthenticatedApi } from '../services/api'
import {
    PaginatedUserPlatform,
    PaginatedUserPlatformBroker,
    SymbolFavorite,
    SymbolFavoritesResponse,
} from '../schema/user';
import { useQueryClient } from '@tanstack/react-query';

export function useGetUserPlatform(
    params: {
        limit?: number;
    },
    options?: Partial<UseQueryOptions<PaginatedUserPlatform, Error>>,
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<PaginatedUserPlatform>();

    const query = new URLSearchParams({ limit: String(params?.limit ?? 10) });

    return useQuery<PaginatedUserPlatform>({
        queryKey: [QueryKeys.USER_PLATFORMS],
        queryFn: () => fetchFromApi(`${ApiRoutes.USER_PLATFORMS}?${query.toString()}`),
        staleTime: 0, //MAYBE I SHOULD CHANGE IT TO 5 MINUTES
        enabled: isLoaded && isSignedIn,
        retry: (failureCount, error) => {
            if (error.message.includes('Authentication failed')) {
                return false;
            }
            return failureCount < 3;
        },
        ...(options ?? {}),
    })
}

export function useGetUserPlatformBrokers(
    params: {
        limit?: number;
    },
    id?: number,
    options?: Partial<UseQueryOptions<PaginatedUserPlatformBroker, Error>>,
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<PaginatedUserPlatformBroker>();

    const query = new URLSearchParams({ limit: String(params?.limit ?? 10) });

    return useQuery<PaginatedUserPlatformBroker>({
        queryKey: [QueryKeys.USER_PLATFORM, id, params],
        queryFn: () => fetchFromApi(`${ApiRoutes.USER_PLATFORM}/${id}/brokers?${query.toString()}`),
        staleTime: 0,
        enabled: !!id,
        ...(options ?? {}),
    })
}

//Get user's favorite symbols in order
export function useGetUserFavorites(
    options?: Partial<UseQueryOptions<SymbolFavoritesResponse, Error>>,
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<SymbolFavoritesResponse>();

    return useQuery<SymbolFavoritesResponse>({
        queryKey: [QueryKeys.USER_FAVORITES],
        queryFn: () => fetchFromApi(`${ApiRoutes.USER_FAVORITES}`),
        staleTime: 0,
        ...(options ?? {})

    })
}

//Add a new favorite symbol
export function useAddUserFavorite() {
    const { fetchFromApi } = useAuthenticatedApi<SymbolFavorite>();
    const queryClient = useQueryClient();

    return useMutation<SymbolFavorite, Error, { symbol: string; order?: number }>({
        mutationFn: ({ symbol, order }) => fetchFromApi(ApiRoutes.USER_FAVORITES, {
            method: 'POST',
            body: JSON.stringify({ symbol, order: order || 0 }),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_FAVORITES] })
        }
    })
}

//Remove a symbol from favorites
export function useRemoveUserFavorite() {
    const { fetchFromApi } = useAuthenticatedApi<SymbolFavorite>();
    const queryClient = useQueryClient();

    return useMutation<void, Error, { symbol: string }>({
        mutationFn: async ({ symbol }) => {
            await fetchFromApi(`${ApiRoutes.USER_FAVORITES}/${symbol}`, {
                method: 'DELETE',
            });
            return;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_FAVORITES] })
        }
    })
}
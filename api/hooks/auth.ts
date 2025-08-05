import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { User } from "../schema";
import { useAuthenticatedApi } from "../services/api";
import { ApiRoutes, QueryKeys } from "../types";


export function useGetCurrentUser(options?: Partial<UseQueryOptions<User, Error>>) {
    const { fetchFromApi } = useAuthenticatedApi<User>();

    return useQuery<User>({
        queryKey: [QueryKeys.GET_CURRENT_USER],
        queryFn: () => fetchFromApi(`${ApiRoutes.GET_CURRENT_USER}`),
        staleTime: Infinity,
        retry: false,
        ...(options ?? {}),
    });
}

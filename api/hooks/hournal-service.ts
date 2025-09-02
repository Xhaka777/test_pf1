import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions
} from '@tanstack/react-query';
import { ApiRoutes, QueryKeys } from '../types';
import { useAuthenticatedApi } from '../services/api';
import {
    JournalTagsData,
  } from '../schema';

  export function useGetJournalTags(
    options?: Partial<UseQueryOptions<JournalTagsData, Error>>,
  ) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<JournalTagsData>();

    return useQuery({
        queryKey: [QueryKeys.GET_JOURNAL_TAGS],
        queryFn: () => fetchFromApi(ApiRoutes.GET_JOURNAL_TAGS),
        enabled: isLoaded && isSignedIn,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
            if(error.message.includes('Authentication failed')) {
                return false;
            }
            return failureCount < 3;
        },
        ...(options ?? {}),
    })
  }
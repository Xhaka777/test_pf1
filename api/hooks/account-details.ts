import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AccountDetails,
    AddAccountData,
    GenericResponse,
    UpdateAccountCommissionPayload,
    UpdateAccountDetailsPayload,
    UpdateAccountMaxLotSizesPayload,
    UpdateAccountParamsPayload,
    UpdateAccountSymbolsPayload,
    UpdateSymbolMappingsPayload,
} from '../schema';
import { ApiRoutes, QueryKeys } from '../types';
import { useAuthenticatedApi } from '../services/api';

export function useGetAccountDetails(id: number) {
    const { fetchFromApi } = useAuthenticatedApi<AccountDetails>();

    return useQuery<AccountDetails>({
        queryKey: [QueryKeys.GET_ACCOUNT_DETAILS, id],
        queryFn: () => {
            return fetchFromApi(`${ApiRoutes.GET_ACCOUNT_DETAILS}/${id}`,
            )
        },
        enabled: !!id,
    })
}

export function useUpdateAccountDetailsMutation() {
    const { fetchFromApi } = useAuthenticatedApi<AccountDetails>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (varibles: UpdateAccountDetailsPayload) {
            return fetchFromApi(ApiRoutes.UPDATE_ACCOUNT_DETAILS, {
                method: 'POST',
                body: JSON.stringify(varibles),
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS],
            })
        }
    })
}

export function useUpdateAccountSymbolsMutation() {
    const { fetchFromApi } = useAuthenticatedApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (varibles: UpdateAccountSymbolsPayload) {
            return fetchFromApi(ApiRoutes.UPDATE_SYMBOLS, {
                method: 'POST',
                body: JSON.stringify(varibles)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS],
            })
        }
    })
}

export function useUpdateMaxLotSizesMutation() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function(variables: UpdateAccountMaxLotSizesPayload) {
            return fetchFromApi(ApiRoutes.UPDATE_MAX_LOT_SIZE, {
                method: 'POST',
                body:  JSON.stringify(variables),
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS]
            })
        }
    })
}

export function useUpdateAccountCommisionsMutation() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (variables: UpdateAccountCommissionPayload) {
            return fetchFromApi(ApiRoutes.UPDATE_COMISSION, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS]
            })
        }
    })
}

export function useUpdateSymbolMappingsMutation() {
    const { fetchFromApi } = useAuthenticatedApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function(variables: UpdateSymbolMappingsPayload) {
            return fetchFromApi(ApiRoutes.UPDATE_SYMBOL_MAPPINGS, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS]
            })
        }
    })
}

export function useUpdateAccountParamsMutation() {
    const { fetchFromApi } = useAuthenticatedApi<AddAccountData>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (variables: UpdateAccountParamsPayload) {
            return fetchFromApi(ApiRoutes.UPDATE_ACCOUNT_PARAMS, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_METRICS]
            })
        }
    })

}
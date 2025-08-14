import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from '@tanstack/react-query';
import { ApiRoutes, QueryKeys } from '../types';
import { useAuthenticatedApi } from '../services/api';
import {
    CalculateLiquidationInput,
    CalculatePositionSizeInput,
    CalculateProfitLossData,
    CalculateProfitLossInput,
    CalculateStopLossInput,
    CancelOrderInput,
    CloseAllTradeInput,
    CloseTradeInput,
    DeleteBTTradeInput,
    DeleteBTTradesInput,
    FetchPLSSInput,
    OpenTradesData,
    GetOpenTradesInput,
    SyncTradesInput,
    TradeServiceData,
    UpdatePartialTpInput,
    UpdateSlInput,
    UpdateTpInput,
    UpdateTrailingSLInput,
    OpenTradeInput,
    UpdateOrderInput,
} from "../schema"

export function useGetOpenTradesQuery(
    variables: GetOpenTradesInput,
    options?: Partial<UseQueryOptions<OpenTradesData, Error>>,
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<OpenTradesData>();

    return useQuery({
        queryKey: [QueryKeys.GET_OPEN_TRADES, variables.account],
        queryFn: function () {
            return fetchFromApi(ApiRoutes.GET_OPEN_TRADES, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
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
}

export function useSyncTradesMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: SyncTradesInput) {
            return fetchFromApi(ApiRoutes.SYNC_TRADES, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.SYNC_TRADES], response);

            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES],
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_TRADE_HISTORY],
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS],
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_METRICS],
            });
        },
    });
}

export function useCloseAllTradesMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: CloseAllTradeInput) {
            return fetchFromApi(ApiRoutes.CLOSE_ALL_TRADE, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES],
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_TRADE_HISTORY],
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS],
            });
            queryClient.setQueryData([QueryKeys.CLOSE_ALL_TRADES], response);
        },
    });
}

export function useCloseTradeMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: CloseTradeInput) {
            return fetchFromApi(ApiRoutes.CLOSE_TRADE, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData, variables: CloseTradeInput) => {
            queryClient.setQueryData([QueryKeys.CLOSE_TRADE], response);

            const invalidationPromises = [
                queryClient.invalidateQueries({
                    queryKey: [QueryKeys.GET_OPEN_TRADES, variables.account],
                    exact: true,
                }),
                queryClient.invalidateQueries({
                    queryKey: [QueryKeys.GET_TRADE_HISTORY, variables.account],
                }),
                queryClient.invalidateQueries({
                    queryKey: [QueryKeys.GET_ACCOUNT_DETAILS, variables.account],
                }),
                queryClient.invalidateQueries({
                    queryKey: [QueryKeys.GET_METRICS, variables.account],
                }),
            ];

            void Promise.all(invalidationPromises);
        },
        onError: (error, variables) => {
            console.error('Trade close failed:', error, 'Variables:', variables);
        },
    });
}

export function useUpdateTpMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: UpdateTpInput) {
            return fetchFromApi(ApiRoutes.UPDATE_TP, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.UPDATE_TP], response);
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES],
            });
        },
    });
}

export function useUpdateSlMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: UpdateSlInput) {
            return fetchFromApi(ApiRoutes.UPDATE_SL, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.UPDATE_SL], response);
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES],
            });
        },
    });
}

export function useUpdatePartialTpMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: UpdatePartialTpInput) {
            return fetchFromApi(ApiRoutes.UPDATE_PARTIAL_TP, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.UPDATE_PARTIAL_TP], response);
        },
    });
}

export function useUpdateTrailingSlMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: UpdateTrailingSLInput) {
            return fetchFromApi(ApiRoutes.UPDATE_TRAILING_SL, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.UPDATE_TRAILING_SL], response);
        },
    });
}

export function useCancelOrderMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: CancelOrderInput) {
            return fetchFromApi(ApiRoutes.CANCEL_ORDER, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.CANCEL_ORDER], response);
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES],
            });
        },
    });
}

export function useDeleteBTTradeMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: DeleteBTTradeInput) {
            return fetchFromApi(ApiRoutes.DELETE_BT_TRADE, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.DELETE_BT_TRADE], response);
        },
    });
}

export function useDeleteBTTradesMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: DeleteBTTradesInput) {
            return fetchFromApi(ApiRoutes.DELETE_BT_TRADES, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.DELETE_BT_TRADES], response);
        },
    });
}

export function useFetchPLSSMutation() {
    const { fetchFromApi } = useAuthenticatedApi<Blob>();

    return useMutation({
        mutationFn: function (variables: FetchPLSSInput) {
            const queryString = new URLSearchParams({
                history: variables.history ? 'True' : 'False',
                download: variables.download ? 'True' : 'False',
                backtesting: variables.backtesting ? 'True' : 'False',
            }).toString();
            const route = `${ApiRoutes.FETCH_PL_SS}/${variables.user_id}/${variables.account}/${variables.trade_id}?${queryString}`;
            return fetchFromApi(route, {
                method: 'GET',
                returnMethod: 'blob',
                cache: 'no-store',
            });
        },
    });
}

export function useCreateTradeMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: OpenTradeInput) {
            console.log('Creating trade with variables:', variables);
            return fetchFromApi(ApiRoutes.OPEN_TRADE, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData, variables: OpenTradeInput) => {
            console.log('Trade creation response:', response);
            console.log('For account:', variables.account);

            queryClient.setQueryData([QueryKeys.OPEN_TRADE], response);

            // Use smart invalidation - only invalidate for specific account
            // The useOpenTradesManager will handle deduplication
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES, variables.account],
                exact: true,
            });

            console.log(
                'Invalidated open trades queries for account:',
                variables.account,
            );
        },
        onError: (error, variables) => {
            console.error('Trade creation failed:', error, 'Variables:', variables);
        },
    });
}

export function useUpdateOrderMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: UpdateOrderInput) {
            return fetchFromApi(ApiRoutes.UPDATE_ORDER, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.UPDATE_ORDER], response);
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES],
            });
        },
    });
}

export function useCalculatePositionSizeMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: CalculatePositionSizeInput) {
            return fetchFromApi(ApiRoutes.CALCULATE_POSITION_SIZE, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.CALCULATE_POSITION_SIZE], response);
        },
    });
}

export function useCalculateStopLossMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: CalculateStopLossInput) {
            return fetchFromApi(ApiRoutes.CALCULATE_STOP_LOSS, {
                method: 'POST',
                body: JSON.stringify(variables),
            });
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData([QueryKeys.CALCULATE_STOP_LOSS], response);
        },
    });
}

export function useCalculateLiquidationPriceMutation() {
    const { fetchFromApi } = useAuthenticatedApi<TradeServiceData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: CalculateLiquidationInput) {
            return fetchFromApi(
                ApiRoutes.CALCULATE_LIQUIDATION_PRICE,
                {
                    method: 'POST',
                    body: JSON.stringify(variables),
                },
            );
        },
        onSuccess: (response: TradeServiceData) => {
            queryClient.setQueryData(
                [QueryKeys.CALCULATE_LIQUIDATION_PRICE],
                response,
            );
        },
    });
}

export function useCalculateProfitLossMutation() {
    const { fetchFromApi } = useAuthenticatedApi<CalculateProfitLossData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: CalculateProfitLossInput) {
            return fetchFromApi(
                ApiRoutes.CALCULATE_PROFIT_LOSS,
                {
                    method: 'POST',
                    body: JSON.stringify(variables),
                },
            );
        },
        onSuccess: (response: CalculateProfitLossData) => {
            queryClient.setQueryData([QueryKeys.CALCULATE_PROFIT_LOSS], response);
        },
    });
}
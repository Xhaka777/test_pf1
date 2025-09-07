import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions
} from '@tanstack/react-query';
import {
    Accounts,
    AccountsOverviewDetailsSchemaType,
    AddAccountData,
    AddAccountPayload,
    AddCopyAccountSchemaType,
    AddCTraderAccountPayload,
    AddCTraderData,
    BrokerAccountsOverviewSchemaType,
    BrokerAccountsSchemaType,
    ConnectToBrokerData,
    ConnectToBrokerPayload,
    CopierAccountsSchemaType,
    CopierLogsResponse,
    GenericCopyAccountSchema,
    GenericResponse,
    PropFirmAccountsOverviewSchemaType,
    PropFirmAccountsType,
    Users,
} from '../schema'
import { ApiRoutes, QueryKeys } from '../types';
import { useAuthenticatedApi } from '../services/api';
import { AccountTypeEnum } from '@/constants/enums';
import { AccountStatusEnum } from '@/shared/enums';

export function useGetUsers(options?: Partial<UseQueryOptions<Users, Error>>) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<Users>();

    return useQuery<Users>({
        queryKey: [QueryKeys.GET_USERS],
        queryFn: () => fetchFromApi(ApiRoutes.GET_USERS),
        enabled: isLoaded && isSignedIn,
        staleTime: 5 * 60 * 1000,
        ...options
    })
}

export function useGetAccounts(options?: Partial<UseQueryOptions<Accounts, Error>>) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<Accounts>();

    console.log('fetchFromAPi', fetchFromApi)
    console.log('isLoaded', isLoaded)
    console.log('isSignedIn', isSignedIn)

    return useQuery<Accounts>({
        queryKey: [QueryKeys.GET_ACCOUNTS],
        queryFn: () => fetchFromApi(ApiRoutes.GET_ACCOUNTS),
        enabled: isLoaded && isSignedIn,
        staleTime: 3 * 60 * 1000,
        ...options
    })
}

export function useFetchPropFirmAccountsOverview(options?: Partial<UseQueryOptions<PropFirmAccountsOverviewSchemaType, Error>>) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<PropFirmAccountsOverviewSchemaType>();

    return useQuery<PropFirmAccountsOverviewSchemaType>({
        queryKey: [QueryKeys.FETCH_PROP_FIRM_ACCOUNTS_OVERVIEW],
        queryFn: () => fetchFromApi(ApiRoutes.FETCH_PROP_FIRM_ACCOUNTS_OVERVIEW),
        staleTime: 2 * 60 * 1000,//2 minutes - overview data is more dynamic...
        ...options
    })
}

export function useFetchBrokerAccountsOverview(options?: Partial<UseQueryOptions<BrokerAccountsOverviewSchemaType, Error>>) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<BrokerAccountsOverviewSchemaType>();

    return useQuery<BrokerAccountsOverviewSchemaType>({
        queryKey: [QueryKeys.FETCH_BROKER_ACCOUNTS_OVERVIEW],
        queryFn: () => fetchFromApi(ApiRoutes.FETCH_BROKER_ACCOUNTS_OVERVIEW),
        staleTime: 2 * 60 * 1000,
        ...options
    })
}

export function useFetchAccountsOverviewDetails(
    params: {
        account_type: AccountTypeEnum;
        start_date: string;
        end_date: string;
    },
    options?: Partial<UseQueryOptions<AccountsOverviewDetailsSchemaType, Error>>
) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<AccountsOverviewDetailsSchemaType>();

    const queryParams = new URLSearchParams({
        account_type: params.account_type,
        start_date: params.start_date,
        end_date: params.end_date
    }).toString();

    return useQuery<AccountsOverviewDetailsSchemaType>({
        queryKey: [`${QueryKeys.FETCH_ACCOUNTS_OVERVIEW_DETAILS}-${queryParams}`],
        queryFn: () => fetchFromApi(`${ApiRoutes.FETCH_ACCOUNTS_OVERVIEW_DETAILS}?${queryParams}`),
        enabled: isLoaded && isSignedIn && Boolean(params.account_type && params.start_date && params.end_date),
        staleTime: 1 * 60 * 1000,//1 minute - chart data here should be relatively fresh..;
        ...options
    })
}

export function useFetchAccountTrades() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (variables: { account: number }) {
            return fetchFromApi(ApiRoutes.FETCH_ACCOUNT_TRADES, {
                method: 'POST',
                body: JSON.stringify(variables),
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_OPEN_TRADES],
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_TRADE_HISTORY],
            })
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNT_DETAILS]
            })
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_METRICS]
            })
        }
    })
}

export function useGetPropFirmAccounts(
    options?: Partial<UseQueryOptions<PropFirmAccountsType, Error>>
) {
    const { fetchFromApi } = useAuthenticatedApi<PropFirmAccountsType>();
    return useQuery<PropFirmAccountsType>({
        queryKey: [QueryKeys.PROP_FIRM_ACCOUNTS],
        queryFn: () => fetchFromApi(ApiRoutes.PROP_FIRM_ACCOUNTS),
        staleTime: 0,
        select: (data) => ({
            ...data,
            prop_firm_accounts: data.prop_firm_accounts.filter(account => account.status === 'active')
        }),
        ...(options ?? {})
    })
}

export function useGetBrokerAccounts(
    options?: Partial<UseQueryOptions<BrokerAccountsSchemaType, Error>>,
) {
    const { fetchFromApi } = useAuthenticatedApi<BrokerAccountsSchemaType>();

    return useQuery<BrokerAccountsSchemaType>({
        queryKey: [QueryKeys.BROKER_ACCOUNTS],
        queryFn: () => fetchFromApi(ApiRoutes.BROKER_ACCOUNTS),
        staleTime: 0,
        // Filter to show only active accounts
        select: (data) => ({
            ...data,
            broker_accounts: data.broker_accounts.filter(account => account.status === 'active')
        }),
        ...(options ?? {})
    })
}

export function useGetCopierAccounts(
    options?: Partial<UseQueryOptions<CopierAccountsSchemaType, Error>>
) {
    const { fetchFromApi } = useAuthenticatedApi<CopierAccountsSchemaType>();

    return useQuery<CopierAccountsSchemaType>({
        queryKey: [QueryKeys.COPIER_ACCOUNTS],
        queryFn: () => fetchFromApi(ApiRoutes.COPIER_ACCOUNTS),
        staleTime: 0,
        ...(options ?? {})
    })
}

export function useAddCopyAccount() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: AddCopyAccountSchemaType) {
            return fetchFromApi(ApiRoutes.ADD_COPY_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.COPIER_ACCOUNTS]
            })
        }
    })
}

export function useUpdateCopyAccount() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (variables: AddCopyAccountSchemaType) {
            return fetchFromApi(ApiRoutes.UPDATE_COPY_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.COPIER_ACCOUNTS]
            })
        }
    })
}

export function useDeleteCopyAccount() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (variables: GenericCopyAccountSchema) {
            return fetchFromApi(ApiRoutes.DELETE_COPY_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.COPIER_ACCOUNTS]
            })
        }
    })
}

export function useEnableCopyAccount() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: GenericCopyAccountSchema) {
            return fetchFromApi(ApiRoutes.ENABLE_COPY_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables),
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.COPIER_ACCOUNTS]
            })
        }
    })
}

export function useDisabledCopyAccount() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (variables: GenericCopyAccountSchema) {
            return fetchFromApi(ApiRoutes.DISABLE_COPY_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.COPIER_ACCOUNTS]
            })
        }
    })
}

export function useAddAccountMutation() {
    const { fetchFromApi } = useAuthenticatedApi<AddAccountData>();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (variables: AddAccountPayload) {
            return fetchFromApi(ApiRoutes.ADD_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables)
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNTS]
            })
        }
    })
}

export function useConnectToBrokerMutation() {
    const { fetchFromApi } = useAuthenticatedApi<ConnectToBrokerData>();

    return useMutation({
        mutationFn: function (variables: ConnectToBrokerPayload) {
            return fetchFromApi(ApiRoutes.CONNECT_TO_BROKER, {
                method: 'POST',
                body: JSON.stringify(variables),
            })
        }
    })
}

export function useAddCTraderAccountMutation() {
    const { fetchFromApi } = useAuthenticatedApi<AddCTraderData>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: AddCTraderAccountPayload) {
            return fetchFromApi(ApiRoutes.ADD_CTRADER_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables),
            })
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNTS]
            })
        }
    })
}

export function useActivateAccountMutation() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: { account: number }) {
            // Log what we're sending to debug
            console.log('[ActivateAccount] Sending variables:', variables);
            console.log('[ActivateAccount] API Route:', ApiRoutes.ACTIVATE_ACCOUNT);
            const jsonBody = JSON.stringify(variables);
            console.log('[ActivateAccount] JSON body:', jsonBody);


            return fetchFromApi(ApiRoutes.ACTIVATE_ACCOUNT, {
                method: 'POST',
                data: variables,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNTS]
            });
        }
    });
}



export function useArchiveAccountMutation() {
    const { fetchFromApi } = useAuthenticatedApi<GenericResponse>();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: function (variables: {
            account: number;
            account_status?: AccountStatusEnum.PASSED | AccountStatusEnum.FAILED | AccountStatusEnum.DISCONNECTED | AccountStatusEnum.SUBSCRIPTION_ENDED;
        }) {
            return fetchFromApi(ApiRoutes.ARCHIVE_ACCOUNT, {
                method: 'POST',
                body: JSON.stringify(variables),
            })
        },
        onSuccess: () => {
            // Invalidate multiple query caches to ensure fresh data
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.GET_ACCOUNTS]
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.PROP_FIRM_ACCOUNTS]
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKeys.BROKER_ACCOUNTS]
            });
        },
        onError: (error) => {
            console.error('[ArchiveAccount] Mutation error:', error);
        }
    })
}

export function useGetCopierLogs(
    options?: Partial<UseQueryOptions<CopierLogsResponse, Error>>
) {
    const { fetchFromApi } = useAuthenticatedApi<CopierLogsResponse>();

    return useQuery<CopierLogsResponse>({
        queryKey: [QueryKeys.GET_COPIER_LOGS],
        queryFn: () => fetchFromApi(ApiRoutes.COPIER_LOGS),
        staleTime: 0,
        ...(options ?? {}),
    })
}
import { useGetAccounts } from '@/api/hooks/accounts';
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountStatusEnum } from '@/shared/enums';
import { Account } from '@/api/schema/account';
import { Accounts, CompetitionAccountSchemaType } from '@/api/schema/accounts';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthenticatedApi } from '@/api/services/api';
import { useQuery } from '@tanstack/react-query';
import { ApiRoutes, QueryKeys } from '@/api/types';
import { any } from 'zod';
import { active } from 'd3';

const ACCOUNT_ID_KEY = 'selectedAccountId';

interface AccountsContextType {
    //Data
    accounts: Account[];
    allAccounts: {
        broker_accounts: Account[];
        prop_firm_accounts: Account[];
        bt_accounts: Account[];
        copier_accounts: Account[];
        competition_accounts: CompetitionAccountSchemaType[];
    } | null;

    //Selected account management
    selectedAccountId: number;
    selectedPreviewAccountId?: number;
    setSelectedAccountId: (id: number) => void;
    setSelectedPreviewAccountId: (id: number | undefined) => void;

    //Loading and error states
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;

    //Helper functions
    getAccountById: (id: number) => Account | undefined;
    getActiveAccount: () => Account | undefined;
}

const defaultContextValue: AccountsContextType = {
    accounts: [],
    allAccounts: null,
    selectedAccountId: 0,
    selectedPreviewAccountId: undefined,
    setSelectedAccountId: () => { },
    setSelectedPreviewAccountId: () => { },
    isLoading: true,
    error: null,
    refetch: () => { },
    getAccountById: () => undefined,
    getActiveAccount: () => undefined
}

const AccountsContext = createContext<AccountsContextType>(defaultContextValue);

export function AccountsProvider({ children }: PropsWithChildren) {
    const { isSignedIn, isLoaded } = useAuth();
    const { fetchFromApi } = useAuthenticatedApi<Accounts>();

    //Local state
    const [selectedAccountId, setSelectedAccountIdState] = useState<number>(0);
    const [selectedPreviewAccountId, setSelectedPreviewAccountId] = useState<number | undefined>();
    const [isInitialized, setIsInitialized] = useState(false);

    //fetch accounts using queries
    const {
        data: accountsData,
        isLoading: isQueryLoading,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: [QueryKeys.GET_ACCOUNTS],
        queryFn: () => fetchFromApi(ApiRoutes.GET_ACCOUNTS),
        enabled: isLoaded && isSignedIn,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: (failureCount, error: any) => {
            if (error?.message?.includes('Unauthorized') || error?.status === 401) {
                return false;
            }
            return failureCount < 3;
        }
    })

    //initialize selected account from AsyncStorage
    useEffect(() => {
        const initializeSelectedAccount = async () => {
            if (!isLoaded) return;

            try {
                const storeId = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
                const initialId = storeId ? parseInt(storeId, 10) : 0;
                setSelectedAccountIdState(initialId);
            } catch (error) {
                console.error('[AccountsProvider] Error loading selected account ID:', error);
                setSelectedAccountIdState(0);
            } finally {
                setIsInitialized(true);
            }
        }
        initializeSelectedAccount();
    }, [isLoaded]);

    //combine accounts from all categories
    const combinedAccounts = useMemo(() => {
        if (!accountsData) return [];

        return [
            ...(accountsData.broker_accounts ?? []),
            ...(accountsData.prop_firm_accounts ?? []),
            ...(accountsData.bt_accounts ?? []),
            ...(accountsData.copier_accounts ?? []),
            // Note: competition_accounts have different structure, handle separately if needed
        ].filter((account): account is Account => Boolean(account?.id));
    }, [accountsData]);

    //handle setting selected account with persistence
    const handleSetSelectedAccountId = useCallback(async (id: number) => {
        setSelectedAccountIdState(id);
        try {
            await AsyncStorage.setItem(ACCOUNT_ID_KEY, id.toString());
        } catch (error) {
            console.error('[AccountsProvider] Error saving selected account ID:', error);
        }
    }, []);

    //auto-selected active account when data loads
    useEffect(() => {
        if (!isSignedIn || !accountsData || !isInitialized) {
            return;
        }

        //If no account is selected or the selected account doesn't exist, auto-select one
        const selectedAccountExists = combinedAccounts.some(
            account => account.id === selectedAccountId
        );

        if (!selectedAccountId || !selectedAccountExists) {
            //try to find an active account first
            const activeAccount = combinedAccounts.find(
                account => account.status === AccountStatusEnum.ACTIVE
            )

            //fall back to the first account if no active account found
            const accountToSelect = activeAccount || combinedAccounts[0];

            if (accountToSelect) {
                console.log('[AccountsProvider] Auto-selecting account: ', accountToSelect.id)
                handleSetSelectedAccountId(accountToSelect.id);
            }
        }
    }, [
        isSignedIn,
        accountsData,
        combinedAccounts,
        handleSetSelectedAccountId,
        selectedAccountId,
        isInitialized
    ])

    //Clear data when user signs out
    useEffect(() => {
        if (!isSignedIn && isLoaded) {
            setSelectedAccountIdState(0);
            setSelectedPreviewAccountId(undefined);
            //Clear stored account Id
            AsyncStorage.removeItem(ACCOUNT_ID_KEY).catch(console.error);
        }
    }, [isSignedIn, isLoaded]);

    //Helper functions
    const getAccountById = useCallback((id: number): Account | undefined => {
        return combinedAccounts.find(account => account.id === id);
    }, [combinedAccounts]);

    const getActiveAccount = useCallback((): Account | undefined => {
        return getAccountById(selectedPreviewAccountId ?? selectedAccountId);
    }, [getAccountById, selectedAccountId, selectedPreviewAccountId]);

    //loading state
    const isLoading = !isLoaded || !isInitialized || (isSignedIn && isQueryLoading);

    //Prepare all account data
    const allAccounts = useMemo(() => {
        if (!accountsData) return null;

        return {
            broker_accounts: accountsData.broker_accounts ?? [],
            prop_firm_accounts: accountsData.prop_firm_accounts ?? [],
            bt_accounts: accountsData.bt_accounts ?? [],
            copier_accounts: accountsData.copier_accounts ?? [],
            competition_accounts: accountsData.competition_accounts ?? [],
        };
    }, [accountsData]);


    //memoize context value
    const contextValue = useMemo(() => ({
        accounts: combinedAccounts,
        allAccounts,
        selectedAccountId,
        selectedPreviewAccountId,
        setSelectedAccountId: handleSetSelectedAccountId,
        setSelectedPreviewAccountId,
        isLoading,
        error: queryError as Error | null,
        refetch,
        getAccountById,
        getActiveAccount,
    }), [
        combinedAccounts,
        allAccounts,
        selectedAccountId,
        selectedPreviewAccountId,
        handleSetSelectedAccountId,
        setSelectedPreviewAccountId,
        isLoading,
        queryError,
        refetch,
        getAccountById,
        getActiveAccount,
    ]);

    return (
        <AccountsContext.Provider value={contextValue}>
            {children}
        </AccountsContext.Provider>
    )

}
export function useAccounts(): AccountsContextType {
    const context = useContext(AccountsContext);

    if (!context) {
        console.warn('[useAccounts] Used outside of provider, returing defaults');
        return defaultContextValue;
    }
    return context;
}


// type AccountsContextProps = {
//     accounts?: Account[];
//     allAccounts?: {
//         broker_accounts?: Account[];
//         prop_firm_accounts?: Account[];
//         bt_accounts?: Account[];
//         copier_accounts?: Account[];
//         competition_accounts?: CompetitionAccountSchemaType[];
//     };
//     selectedAccountId: number;
//     selectedPreviewAccountId?: number;
//     setSelectedAccountId: (id: number) => void;
//     setSelectedPreviewAccountId: (id: number | undefined) => void;
// };

// const AccountsContext = createContext<AccountsContextProps | undefined>(
//     undefined,
// );

// Full page loader component for React Native
const FullPageLoader = () => (
    <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
    </View>
);

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

// export function AccountsProvider({ children }: PropsWithChildren) {
//     const { data: accounts } = useGetAccounts();
//     const { isSignedIn, isLoaded } = useAuth();

//     const combinedAccounts = useMemo(() => {
//         return [
//             ...(accounts?.broker_accounts ?? []),
//             ...(accounts?.prop_firm_accounts ?? []),
//             ...(accounts?.bt_accounts ?? []),
//             ...(accounts?.competition_accounts ?? []),
//         ].filter((account): account is Account => account !== undefined);
//     }, [accounts]);

//     const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
//     const [isInitialized, setIsInitialized] = useState(false);

//     const [selectedPreviewAccountId, setSelectedPreviewAccountId] = useState<
//         number | undefined
//     >();

//     // Initialize selectedAccountId from AsyncStorage
//     useEffect(() => {
//         const initializeSelectedAccount = async () => {
//             try {
//                 const storedId = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
//                 const initialId = storedId ? parseInt(storedId, 10) : 0;
//                 setSelectedAccountId(initialId);
//                 setIsInitialized(true);
//             } catch (error) {
//                 console.error('Error loading selected account ID:', error);
//                 setSelectedAccountId(0);
//                 setIsInitialized(true);
//             }
//         };

//         //Only initialize if auth is loaded
//         if (isLoaded) {
//             initializeSelectedAccount();
//         }
//     }, [isLoaded]);

//     const handleSetSelectedAccountId = useCallback(async (id: number) => {
//         setSelectedAccountId(id);
//         try {
//             await AsyncStorage.setItem(ACCOUNT_ID_KEY, id.toString());
//         } catch (error) {
//             console.error('Error saving selected account ID:', error);
//         }
//     }, []);

//     useEffect(() => {
//         // Only run this logic when we have accounts data loaded and AsyncStorage is initialized
//         if (!isSignedIn || !accounts || !isInitialized) {
//             return;
//         }

//         if (
//             !selectedAccountId ||
//             !combinedAccounts.some((account) => account.id === selectedAccountId)
//         ) {
//             console.log('setting selected account id', selectedAccountId);
//             handleSetSelectedAccountId(
//                 combinedAccounts.find(
//                     (account) => account.status === AccountStatusEnum.ACTIVE,
//                 )?.id ?? 0,
//             );
//         }
//     }, [
//         isSignedIn,
//         accounts,
//         combinedAccounts,
//         handleSetSelectedAccountId,
//         selectedAccountId,
//         isInitialized,
//     ]);

//     if (!isLoaded || !isSignedIn) {
//         return <>{children}</>
//     }

//     if (!accounts || !isInitialized) {
//         return <FullPageLoader />;
//     }

//     return (
//         <AccountsContext.Provider
//             value={{
//                 accounts: combinedAccounts,
//                 allAccounts: accounts,
//                 selectedAccountId,
//                 setSelectedAccountId: handleSetSelectedAccountId,
//                 selectedPreviewAccountId,
//                 setSelectedPreviewAccountId,
//             }}
//         >
//             {children}
//         </AccountsContext.Provider>
//     );
// }

// export function useAccounts() {
//     const context = useContext(AccountsContext);
//     if (context === undefined) {
//         throw new Error('useAccounts must be used inside of an AccountsProvider');
//     }
//     return context;
// }
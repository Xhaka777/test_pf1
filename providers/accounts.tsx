// providers/accounts.tsx
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountStatusEnum } from '@/shared/enums';
import { Account } from '@/api/schema/account';
import { CompetitionAccountSchemaType } from '@/api/schema/accounts';
import { useAuth } from '@clerk/clerk-expo';
import { useGetAccounts } from '@/api/hooks/accounts';

const ACCOUNT_ID_KEY = 'selectedAccountId';

interface AccountsContextType {
    // Data
    accounts: Account[];
    allAccounts: {
        broker_accounts: Account[];
        prop_firm_accounts: Account[];
        bt_accounts: Account[];
        copier_accounts: Account[];
        competition_accounts: CompetitionAccountSchemaType[];
    } | null;

    // Selected account management
    selectedAccountId: number;
    selectedPreviewAccountId?: number;
    setSelectedAccountId: (id: number) => void;
    setSelectedPreviewAccountId: (id: number | undefined) => void;

    // Loading and error states from React Query
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;

    // Helper functions
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

    // Only make API calls when user is properly authenticated
    const {
        data: accountsData,
        isLoading: isQueryLoading,
        error: queryError,
        refetch
    } = useGetAccounts({
        enabled: isLoaded && isSignedIn,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: (failureCount, error) => {
            // Don't retry authentication errors
            if (error?.message?.includes('Authentication') || 
                error?.message?.includes('Unauthorized')) {
                return false;
            }
            return failureCount < 3;
        },
    });

    // Local state for selected accounts
    const [selectedAccountId, setSelectedAccountIdState] = useState<number>(0);
    const [selectedPreviewAccountId, setSelectedPreviewAccountId] = useState<number | undefined>();
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize selected account from AsyncStorage
    useEffect(() => {
        const initializeSelectedAccount = async () => {
            if (!isLoaded) return;

            try {
                const storedId = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
                const initialId = storedId ? parseInt(storedId, 10) : 0;
                
                // Validate the stored ID
                if (initialId && !isNaN(initialId) && initialId > 0) {
                    setSelectedAccountIdState(initialId);
                } else {
                    setSelectedAccountIdState(0);
                }
            } catch (error) {
                console.error('[AccountsProvider] Error loading selected account ID:', error);
                setSelectedAccountIdState(0);
            } finally {
                setIsInitialized(true);
            }
        }
        initializeSelectedAccount();
    }, [isLoaded]);

    // Combine accounts from all categories
    const combinedAccounts = useMemo(() => {
        if (!accountsData) return [];

        const accounts = [
            ...(accountsData.broker_accounts ?? []),
            ...(accountsData.prop_firm_accounts ?? []),
            ...(accountsData.bt_accounts ?? []),
            ...(accountsData.copier_accounts ?? []),
        ].filter((account): account is Account => Boolean(account?.id && account.id > 0));

        console.log('[AccountsProvider] Combined accounts:', accounts.length);
        return accounts;
    }, [accountsData]);

    // Handle setting selected account with persistence
    const handleSetSelectedAccountId = useCallback(async (id: number) => {
        if (id < 0) {
            console.warn('[AccountsProvider] Invalid account ID:', id);
            return;
        }

        console.log('[AccountsProvider] Setting selected account ID:', id);
        setSelectedAccountIdState(id);
        
        try {
            if (id > 0) {
                await AsyncStorage.setItem(ACCOUNT_ID_KEY, id.toString());
            } else {
                await AsyncStorage.removeItem(ACCOUNT_ID_KEY);
            }
        } catch (error) {
            console.error('[AccountsProvider] Error saving selected account ID:', error);
        }
    }, []);

    // Auto-select active account when data loads
    useEffect(() => {
        // Wait for authentication, initialization, and data
        if (!isSignedIn || !isLoaded || !accountsData || !isInitialized) {
            return;
        }

        // Check if the currently selected account still exists
        const selectedAccountExists = combinedAccounts.some(
            account => account.id === selectedAccountId
        );

        // If no account is selected or the selected account doesn't exist anymore
        if (!selectedAccountId || selectedAccountId <= 0 || !selectedAccountExists) {
            console.log('[AccountsProvider] Auto-selecting account...', {
                selectedAccountId,
                selectedAccountExists,
                availableAccounts: combinedAccounts.length
            });

            // Try to find an active account first
            const activeAccount = combinedAccounts.find(
                account => account.status === AccountStatusEnum.ACTIVE
            );

            // Fall back to the first available account
            const accountToSelect = activeAccount || combinedAccounts[0];

            if (accountToSelect) {
                console.log('[AccountsProvider] Auto-selecting account:', accountToSelect.id, accountToSelect.name);
                handleSetSelectedAccountId(accountToSelect.id);
            } else {
                console.log('[AccountsProvider] No accounts available to select');
                handleSetSelectedAccountId(0);
            }
        }
    }, [
        isSignedIn,
        isLoaded,
        accountsData,
        combinedAccounts,
        handleSetSelectedAccountId,
        selectedAccountId,
        isInitialized
    ]);

    // Clear data when user signs out
    useEffect(() => {
        if (!isSignedIn && isLoaded) {
            console.log('[AccountsProvider] User signed out, clearing data');
            setSelectedAccountIdState(0);
            setSelectedPreviewAccountId(undefined);
            AsyncStorage.removeItem(ACCOUNT_ID_KEY).catch(console.error);
        }
    }, [isSignedIn, isLoaded]);

    // Helper functions
    const getAccountById = useCallback((id: number): Account | undefined => {
        return combinedAccounts.find(account => account.id === id);
    }, [combinedAccounts]);

    const getActiveAccount = useCallback((): Account | undefined => {
        const accountId = selectedPreviewAccountId ?? selectedAccountId;
        return getAccountById(accountId);
    }, [getAccountById, selectedAccountId, selectedPreviewAccountId]);

    // Better loading state logic
    const isLoading = !isLoaded || !isInitialized || (isSignedIn && isQueryLoading);

    // Prepare all account data
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

    // Memoize context value
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
        console.warn('[useAccounts] Used outside of provider, returning defaults');
        return defaultContextValue;
    }
    return context;
}
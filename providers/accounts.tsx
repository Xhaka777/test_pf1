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
import { CompetitionAccountSchemaType } from '@/api/schema/accounts';
import { useAuth } from '@clerk/clerk-expo';

const ACCOUNT_ID_KEY = 'selectedAccountId';

type AccountsContextProps = {
    accounts?: Account[];
    allAccounts?: {
        broker_accounts?: Account[];
        prop_firm_accounts?: Account[];
        bt_accounts?: Account[];
        copier_accounts?: Account[];
        competition_accounts?: CompetitionAccountSchemaType[];
    };
    selectedAccountId: number;
    selectedPreviewAccountId?: number;
    setSelectedAccountId: (id: number) => void;
    setSelectedPreviewAccountId: (id: number | undefined) => void;
};

const AccountsContext = createContext<AccountsContextProps | undefined>(
    undefined,
);

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

export function AccountsProvider({ children }: PropsWithChildren) {
    const { data: accounts } = useGetAccounts();
    const { isSignedIn, isLoaded } = useAuth();

    const combinedAccounts = useMemo(() => {
        return [
            ...(accounts?.broker_accounts ?? []),
            ...(accounts?.prop_firm_accounts ?? []),
            ...(accounts?.bt_accounts ?? []),
            ...(accounts?.competition_accounts ?? []),
        ].filter((account): account is Account => account !== undefined);
    }, [accounts]);

    const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
    const [isInitialized, setIsInitialized] = useState(false);

    const [selectedPreviewAccountId, setSelectedPreviewAccountId] = useState<
        number | undefined
    >();

    // Initialize selectedAccountId from AsyncStorage
    useEffect(() => {
        const initializeSelectedAccount = async () => {
            try {
                const storedId = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
                const initialId = storedId ? parseInt(storedId, 10) : 0;
                setSelectedAccountId(initialId);
                setIsInitialized(true);
            } catch (error) {
                console.error('Error loading selected account ID:', error);
                setSelectedAccountId(0);
                setIsInitialized(true);
            }
        };

        //Only initialize if auth is loaded
        if (isLoaded) {
            initializeSelectedAccount();
        }
    }, [isLoaded]);

    const handleSetSelectedAccountId = useCallback(async (id: number) => {
        setSelectedAccountId(id);
        try {
            await AsyncStorage.setItem(ACCOUNT_ID_KEY, id.toString());
        } catch (error) {
            console.error('Error saving selected account ID:', error);
        }
    }, []);

    useEffect(() => {
        // Only run this logic when we have accounts data loaded and AsyncStorage is initialized
        if (!isSignedIn || !accounts || !isInitialized) {
            return;
        }

        if (
            !selectedAccountId ||
            !combinedAccounts.some((account) => account.id === selectedAccountId)
        ) {
            console.log('setting selected account id', selectedAccountId);
            handleSetSelectedAccountId(
                combinedAccounts.find(
                    (account) => account.status === AccountStatusEnum.ACTIVE,
                )?.id ?? 0,
            );
        }
    }, [
        isSignedIn,
        accounts,
        combinedAccounts,
        handleSetSelectedAccountId,
        selectedAccountId,
        isInitialized,
    ]);

    if (!isLoaded || !isSignedIn) {
        return <>{children}</>
    }

    if (!accounts || !isInitialized) {
        return <FullPageLoader />;
    }

    return (
        <AccountsContext.Provider
            value={{
                accounts: combinedAccounts,
                allAccounts: accounts,
                selectedAccountId,
                setSelectedAccountId: handleSetSelectedAccountId,
                selectedPreviewAccountId,
                setSelectedPreviewAccountId,
            }}
        >
            {children}
        </AccountsContext.Provider>
    );
}

export function useAccounts() {
    const context = useContext(AccountsContext);
    if (context === undefined) {
        throw new Error('useAccounts must be used inside of an AccountsProvider');
    }
    return context;
}
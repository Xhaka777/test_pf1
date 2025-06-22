import { useGetAccountDetails } from '@/api/hooks/account-details'
import { AccountDetails } from '@/api/schema/account'
import { createContext, PropsWithChildren, useContext } from 'react'
import { useAccounts } from './accounts'
import { StatusEnum } from '@/api/services/api'
import { useAuth } from '@clerk/clerk-expo'

type AccountDetailsContextProps = {
    accountDetails?: AccountDetails;
}

const AccountDetailsContext = createContext<AccountDetailsContextProps | undefined>(undefined);

export function AccountDetailsProvider({ children }: PropsWithChildren) {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded || !isSignedIn) {
        return (
            <AccountDetailsContext.Provider value={{ accountDetails: undefined }}>
                {children}
            </AccountDetailsContext.Provider>
        )
    }

    const { selectedAccountId } = useAccounts();
    const { data: accountDetails, isLoading } = useGetAccountDetails(selectedAccountId);

    if (isLoading || !accountDetails) {
        //TODO show loader here if I have time create a component for many cases like this... 
        return (
            <AccountDetailsContext.Provider value={{ accountDetails: undefined }}>
                {children}
            </AccountDetailsContext.Provider>
        )
    }

    const accountDetailsData = accountDetails?.status === StatusEnum.SUCCESS ? accountDetails : undefined;

    return (
        <AccountDetailsContext.Provider
            value={{ accountDetails: accountDetailsData }}
        >
            {children}
        </AccountDetailsContext.Provider>
    )
}

export function useAccountDetails() {
    const context = useContext(AccountDetailsContext);
    if (context === undefined) {
        throw new Error(
            'useAccountDetails must be used inside of an AccountDetailsProvider',
        )
    }
    return context;
}
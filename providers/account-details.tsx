import React, { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';

import { useAuthenticatedApi } from '@/api/services/api';
import { QueryKeys, ApiRoutes } from '@/api/types';
import { AccountDetails } from '@/api/schema/account';
import { StatusEnum } from '@/api/services/api';
import { useAccounts } from './accounts';

interface AccountDetailsContextType {
    // Account details data
    accountDetails: AccountDetails | null;
    
    // Loading and error states
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
    
    // Helper functions
    hasAccountDetails: boolean;
    isAccountActive: boolean;
    
    // Exchange and server info (commonly used)
    exchange: string | null;
    server: string | null;
    
    // Account status info
    canTrade: boolean;
}

const defaultContextValue: AccountDetailsContextType = {
    accountDetails: null,
    isLoading: false,
    error: null,
    refetch: () => {},
    hasAccountDetails: false,
    isAccountActive: false,
    exchange: null,
    server: null,
    canTrade: false,
};

const AccountDetailsContext = createContext<AccountDetailsContextType>(defaultContextValue);

export function AccountDetailsProvider({ children }: PropsWithChildren) {
    const { isSignedIn, isLoaded } = useAuth();
    const { selectedAccountId, selectedPreviewAccountId, isLoading: accountsLoading } = useAccounts();
    const { fetchFromApi } = useAuthenticatedApi<AccountDetails>();

    // Use preview account ID if available, otherwise use selected account ID
    const activeAccountId = selectedPreviewAccountId ?? selectedAccountId;
    
    // Fetch account details using React Query
    const {
        data: accountDetailsResponse,
        isLoading: isQueryLoading,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: [QueryKeys.GET_ACCOUNT_DETAILS, activeAccountId],
        queryFn: () => fetchFromApi(`${ApiRoutes.GET_ACCOUNT_DETAILS}/${activeAccountId}`),
        enabled: Boolean(
            isLoaded && 
            isSignedIn && 
            activeAccountId && 
            activeAccountId > 0 &&
            !accountsLoading // Wait for accounts to load first
        ),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: any) => {
            // Don't retry on auth errors or 404s (account not found)
            if (
                error?.message?.includes('Unauthorized') || 
                error?.status === 401 || 
                error?.status === 404
            ) {
                return false;
            }
            return failureCount < 3;
        },
    });

    // Extract account details from response
    const accountDetails = useMemo(() => {
        if (!accountDetailsResponse) return null;
        
        // Check if response has success status
        if ('status' in accountDetailsResponse && accountDetailsResponse.status === StatusEnum.SUCCESS) {
            return accountDetailsResponse as AccountDetails;
        }
        
        // If response doesn't have status field, assume it's the account details directly
        if ('id' in accountDetailsResponse && 'name' in accountDetailsResponse) {
            return accountDetailsResponse as AccountDetails;
        }
        
        return null;
    }, [accountDetailsResponse]);

    // Determine loading state
    const isLoading = !isLoaded || accountsLoading || (isSignedIn && activeAccountId > 0 && isQueryLoading);

    // Helper computations
    const hasAccountDetails = Boolean(accountDetails);
    const isAccountActive = Boolean(accountDetails && accountDetails.account_status);
    const exchange = accountDetails?.exchange || null;
    const server = accountDetails?.server || null;
    
    // Determine if account can trade (you can customize this logic)
    const canTrade = Boolean(
        accountDetails && 
        accountDetails.account_status && 
        ['active', 'passed'].includes(accountDetails.account_status.toLowerCase())
    );

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        accountDetails,
        isLoading,
        error: queryError as Error | null,
        refetch,
        hasAccountDetails,
        isAccountActive,
        exchange,
        server,
        canTrade,
    }), [
        accountDetails,
        isLoading,
        queryError,
        refetch,
        hasAccountDetails,
        isAccountActive,
        exchange,
        server,
        canTrade,
    ]);

    return (
        <AccountDetailsContext.Provider value={contextValue}>
            {children}
        </AccountDetailsContext.Provider>
    );
}

export function useAccountDetails(): AccountDetailsContextType {
    const context = useContext(AccountDetailsContext);
    
    if (!context) {
        console.warn('[useAccountDetails] Used outside of provider, returning defaults');
        return defaultContextValue;
    }
    
    return context;
}
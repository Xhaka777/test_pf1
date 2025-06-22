import { useApiData } from "../useApiData";
import { AccountsResponse, BrokerAccountsResponse, CompetitionAccountsResponse, CopierAccountsResponse } from "@/types";

export function useAccounts() {
    console.log('object', useApiData<AccountsResponse>('/accounts'))
    return useApiData<AccountsResponse>('/accounts');
}

//Hook for broker accounts
export function useBrokerAccounts() {
    return useApiData<BrokerAccountsResponse>('/broker_accounts');
}

//Competition accounts hooks
export function useCompetitionAccounts() {
    return useApiData<CompetitionAccountsResponse>('/competition_accounts');
}

//Copier accounts hooks
export function useCopierAccounts() {
    return useApiData<CopierAccountsResponse>('/copier_accounts');
}

//Prop firm accounts hooks
export function usePropFirmAccounts() {
    return useApiData<BrokerAccountsResponse>('/prop_firm_accounts')
}

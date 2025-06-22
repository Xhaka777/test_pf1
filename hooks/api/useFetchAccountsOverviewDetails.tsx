import { AccountTypeEnum } from "@/constants/enums";
import { useApiData } from "../useApiData";

//Types for API response
export interface AccountsOverviewDetail {
    balance: number;
    date: string;
}

export interface AccountsOverviewDetailsResponse {
    details: AccountsOverviewDetail[];
    status: string;
}


export interface AccountsOverviewDetailsParams {
    account_type: AccountTypeEnum;
    start_date: string;
    end_date: string;
}

export const useFetchAccountsOverviewDetails = (params: AccountsOverviewDetailsParams) => {
    const queryParams = new URLSearchParams({
        account_type: params.account_type,
        start_date: params.start_date,
        end_date: params.end_date,
    }).toString();

    const endpoint = `/fetch_accounts_overview_details?${queryParams}`;

    //Pass the params as dependencies so the hook refetches when params change
    return useApiData<AccountsOverviewDetailsResponse>(
        endpoint,
        [params.account_type, params.start_date, params.end_date]
    )
}
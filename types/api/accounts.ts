//Base account interface for common properties
interface BaseAccount {
    id: number;
    name: string;
    balance: number;
    currency: string;
    starting_balance: number;
    exchange: string;
    server: string;
}

//Broker Account interface
export interface BrokerAccount extends BaseAccount {
    account_type: string;
    api_key: string;
    secret_key: string;
    daily_pl: number;
    total_pl: number;
    status: string;
    firm: string | null;
}

//Backtest Account interface
export interface BtAccount {
    id: number;
    name: string;
    api_key: string;
    secret_key: string;
    balance: number;
    currency: string;
    exchange: string;
    server: string;
    starting_balance: number;
    symbol: string;
    type: string;
}

//Competition Account Interface
export interface CompetitionAccount {
    id: number;
    name: string;
    account_type: string;
    balance: number;
    currency: string;
    starting_balance: number;
    daily_pl: number;
    total_pl: number;
    status: string;
}

//Nested Copier Account interface (within copier_accounts array)
export interface NestedCopierAccount {
    balance: number;
    copy_account: number;
    copy_tp_sl: any;
    currency: string;
    enabled: boolean;
    exchange: string;
    ignore_symbols: any;
    lot_multiplier: number | null;
    master_account: number;
    name: string;
    reverse_trade: any;
    risk_multiplier: number | null;
    server: string;
    starting_balance: number;
    type: string;
}

//Main Copier Account interface
export interface CopierAccount {
    active: number;
    balance: number;
    copier_accounts: NestedCopierAccount[];
    currency: string;
    exchange: string;
    inactive: number;
    long_trades: number;
    master_account: number;
    name: string;
    open_trades: number;
    server: string;
    short_trades: number;
    starting_balance: number;
    type: string;
}

//Prop Firm Account Interface
export interface PropFirmAccount extends BaseAccount {
    account_type: string;
    api_key: string;
    secret_key: string;
    daily_pl: number;
    total_pl: number;
    net_pl: number;
    status: string;
    firm: string;
    max_total_dd: number;
    profit_target: number;
    program: string;
}

//Main response interface
export interface AccountsResponse {
    broker_accounts: BrokerAccount[];
    bt_accounts: BtAccount[];
    competition_accounts: CompetitionAccount[];
    copier_accounts: CopierAccount[];
    prop_firm_accounts: PropFirmAccount[];
    status: string;
}

//Response for broker accounts endpoint
export interface BrokerAccountsResponse {
    broker_accounts: BrokerAccount[];
    status: string;
}

//Response for competition accounts endpoint
export interface CompetitionAccountsResponse {
    competition_accounts: CompetitionAccount[];
    status: string;
}

//Response for copier accounts endpoint
export interface CopierAccountsResponse {
    copier_accounts: CopierAccount[];
    status: string;
}

//Response for prop firm accounts endpoint
export interface PropFirmAccountsReponse {
    prop_firm_accounts: PropFirmAccount[];
    status: string;
}


//Type guard functions for runtime type checking
export const isBrokerAccount = (account: any): account is BrokerAccount => {
    return account && typeof account.firm !== 'undefined';
};

export const isPropFirmAccount = (account: any): account is PropFirmAccount => {
    return account && typeof account.profit_target === 'number'
};

//Union typ for all account types (useful for generic handling)
export type AnyAccount = BrokerAccount | BtAccount | CompetitionAccount | CopierAccount | PropFirmAccount;

//Helper type for account categories
export type AccountCategory = 'broker_accounts' | 'bt_accounts' | 'competition_accounts' | 'copier_accounts' | 'prop_firm_accounts';

export enum PositionType {
    LONG = 'long',
    SHORT = 'short'
}

export enum OrderType {
    MARKET = 'market',
    LIMIT = 'limit',
    STOP = 'stop',
    STOP_LIMIT = 'stop_limit'
}

export enum Exchange {
    MT5 = 'MT5',
    CTRADER = 'CTrader',
    BINANCE = 'Binance',
    BYBIT = 'Bybit'
}

export enum TradeReason {
    MARKET = 'Market',
    LIMIT = 'Limit',
    STOP = 'Stop',
    SIGNAL = 'Signal'
}

export enum LevelType {
    FIXED = 'fixed',
    PERCENTAGE = 'percentage',
    ATR = 'atr'
}

// Sub-interfaces
export interface TpLevel {
    quantity: number;
    rr: string;
}

export interface TrailingSl {
    level: string;
    level_type: string;
    sl: string;
}

export interface OpenOrder {
    account_id: number;
    id: number;
    master_order_id: string | null;
    order_id: string;
    order_type: string;
    placed_time: string;
    position_type: string;
    price: number;
    quantity: number
    sl: number;
    symbol: string;
    tp: number;
    trade_loss: number;
    trade_profit: number;
    user_id: number;
}

export interface OpenTrade {
    account_id: number;
    balance: number;
    entry: number;
    exchange: string;
    fees: number;
    initial_margin: number;
    liquidation: number;
    master_order_id: string | null;
    open_time: string;
    order_id: string;
    partial_tp_level: number;
    pl: number;
    position_type: string;
    quantity: number;
    reason: string;
    risk_percent: number;
    risk_value: number;
    roi: number;
    sl: number;
    symbol: string;
    tp: number;
    tp_levels: TpLevel[];
    trade_id: number;
    trade_loss: number;
    trade_profit: number;
    trailing_sl: TrailingSl[];
    user_id: number;
}

// Main response interface
export interface OpenTradesResponse {
    account: number;
    open_orders: OpenOrder[];
    open_trades: OpenTrade[];
    other_open_orders: OpenOrder[];
    other_open_trades: OpenTrade[];
    status: string;
}

//Request parameters interface
export interface OpenTradesParams {
    account: number;
    backtesting: boolean;
}
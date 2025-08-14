// utils/mock-data.ts
import { OpenTradesData } from '@/api/schema';
import { TradeHistoryData } from '@/api/schema/trade-history';
import { PositionTypeEnum, OrderTypeEnum } from '@/shared/enums';
import { StatusEnum } from '@/api/services/api';

export const createMockOpenPositions = (accountId: number): OpenTradesData => {
  return {
    account: accountId,
    status: StatusEnum.SUCCESS,
    open_trades: [
      {
        // Trade 1 - Profitable EURUSD Long position
        account_id: accountId,
        balance: 10000.00,
        contract_size: 100000,
        entry: 1.0850,
        exchange: 'MT5',
        fees: 0.50,
        initial_margin: 1085.00,
        liquidation: 0.9800,
        master_order_id: null,
        open_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        order_id: 'MOCK_TRADE_001',
        order_type: OrderTypeEnum.MARKET,
        partial_tp_level: 0,
        pl: 125.50, // Profitable
        position_type: PositionTypeEnum.LONG,
        quantity: 0.10,
        reason: 'Market',
        roi: 1.26,
        sl: 1.0800, // Stop loss
        symbol: 'EURUSD',
        tp: 1.0950, // Take profit
        trade_id: 1001,
        trade_loss: -50.00,
        trade_profit: 100.00,
        user_id: 123,
        // Optional fields for advanced features
        tp_levels: [
          {
            rr: 1.0,
            quantity: 50
          },
          {
            rr: 2.0,
            quantity: 50
          }
        ],
        trailing_sl: [
          {
            level: 1.0,
            level_type: 'rr',
            sl: 1.0820
          }
        ],
        risk_percent: 2.5,
        risk_value: 250.00
      },
      {
        // Trade 2 - Losing GBPJPY Short position
        account_id: accountId,
        balance: 10000.00,
        contract_size: 100000,
        entry: 189.45,
        exchange: 'CTrader',
        fees: 0.75,
        initial_margin: 1894.50,
        liquidation: 195.00,
        master_order_id: null,
        open_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        order_id: 'MOCK_TRADE_002',
        order_type: OrderTypeEnum.MARKET,
        partial_tp_level: 0,
        pl: -87.25, // Losing
        position_type: PositionTypeEnum.SHORT,
        quantity: 0.05,
        reason: 'Market',
        roi: -0.87,
        sl: 190.20, // Stop loss
        symbol: 'GBPJPY',
        tp: 188.80, // Take profit
        trade_id: 1002,
        trade_loss: -100.00,
        trade_profit: 50.00,
        user_id: 123,
        // Optional fields
        tp_levels: [],
        trailing_sl: [],
        risk_percent: 1.5,
        risk_value: 150.00
      }
    ],
    open_orders: [
      {
        // Pending Buy Limit order for BTCUSDT
        account_id: accountId,
        id: 2001,
        master_order_id: null,
        order_id: 'MOCK_ORDER_001',
        order_type: OrderTypeEnum.LIMIT,
        placed_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        position_type: PositionTypeEnum.LONG,
        price: 42500.00,
        quantity: 0.01,
        sl: 41000.00,
        symbol: 'BTCUSDT',
        tp: 45000.00,
        user_id: 123
      }
    ],
    other_open_trades: [],
    other_open_orders: []
  };
};

// NEW: Create mock trade history data
export const createMockTradeHistory = (accountId: number): TradeHistoryData => {
  return {
    all_trades: [
      {
        // Closed Trade 1 - Profitable GBPUSD Long
        account_id: accountId,
        balance: 10250.75,
        entry: 1.2450,
        equity: 10250.75,
        exchange: 'MT5',
        exit: 1.2520,
        exit_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        fees: 0.50,
        initial_margin: 1245.00,
        liquidation: 1.1800,
        max_loss: -62.25,
        max_win: 280.50,
        open_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(), // 1 day and 3 hours ago
        order_id: 'MOCK_HISTORY_001',
        pl: 175.00,
        position_type: PositionTypeEnum.LONG,
        quantity: 0.25,
        reason: 'Take Profit',
        risk_percent: 2.0,
        risk_value: 200.00,
        roi: 1.75,
        sl: 1.2400,
        status: 'win',
        strategy: 'Breakout',
        symbol: 'GBPUSD',
        tags: ['breakout', 'london-session', 'high-probability'],
        tp: 1.2520,
        trade_id: 3001,
        user_id: 123
      },
      {
        // Closed Trade 2 - Losing USDJPY Short
        account_id: accountId,
        balance: 9925.25,
        entry: 150.25,
        equity: 9925.25,
        exchange: 'CTrader',
        exit: 150.85,
        exit_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        fees: 0.75,
        initial_margin: 1502.50,
        liquidation: 155.00,
        max_loss: -75.00,
        max_win: 25.00,
        open_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(), // 2 days and 1 hour ago
        order_id: 'MOCK_HISTORY_002',
        pl: -75.00,
        position_type: PositionTypeEnum.SHORT,
        quantity: 0.10,
        reason: 'Stop Loss',
        risk_percent: 1.5,
        risk_value: 150.00,
        roi: -0.75,
        sl: 150.85,
        status: 'loss',
        strategy: 'Reversal',
        symbol: 'USDJPY',
        tags: ['reversal', 'tokyo-session'],
        tp: 149.50,
        trade_id: 3002,
        user_id: 123
      },
      {
        // Closed Trade 3 - Profitable AUDUSD Long
        account_id: accountId,
        balance: 10125.50,
        entry: 0.6580,
        equity: 10125.50,
        exchange: 'MT5',
        exit: 0.6645,
        exit_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        fees: 0.50,
        initial_margin: 658.00,
        liquidation: 0.6200,
        max_loss: -32.50,
        max_win: 195.00,
        open_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString(), // 3 days and 5 hours ago
        order_id: 'MOCK_HISTORY_003',
        pl: 162.50,
        position_type: PositionTypeEnum.LONG,
        quantity: 0.25,
        reason: 'Take Profit',
        risk_percent: 2.5,
        risk_value: 250.00,
        roi: 1.63,
        sl: 0.6545,
        status: 'win',
        strategy: 'Trend Following',
        symbol: 'AUDUSD',
        tags: ['trend-following', 'ny-session', 'rba-news'],
        tp: 0.6645,
        trade_id: 3003,
        user_id: 123
      },
      {
        // Closed Trade 4 - Small Loss EURJPY Short
        account_id: accountId,
        balance: 9987.75,
        entry: 162.45,
        equity: 9987.75,
        exchange: 'CTrader',
        exit: 162.80,
        exit_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        fees: 0.75,
        initial_margin: 812.25,
        liquidation: 168.00,
        max_loss: -37.25,
        max_win: 15.50,
        open_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), // 4 days and 2 hours ago
        order_id: 'MOCK_HISTORY_004',
        pl: -37.25,
        position_type: PositionTypeEnum.SHORT,
        quantity: 0.05,
        reason: 'Stop Loss',
        risk_percent: 1.0,
        risk_value: 100.00,
        roi: -0.37,
        sl: 162.80,
        status: 'loss',
        strategy: 'Scalping',
        symbol: 'EURJPY',
        tags: ['scalping', 'quick-trade'],
        tp: 161.85,
        trade_id: 3004,
        user_id: 123
      },
      {
        // Closed Trade 5 - Big Win BTCUSDT Long
        account_id: accountId,
        balance: 10450.00,
        entry: 41250.00,
        equity: 10450.00,
        exchange: 'DXTrade',
        exit: 43125.00,
        exit_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        fees: 2.50,
        initial_margin: 412.50,
        liquidation: 35000.00,
        max_loss: -62.50,
        max_win: 450.00,
        open_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString(), // 5 days and 8 hours ago
        order_id: 'MOCK_HISTORY_005',
        pl: 375.00,
        position_type: PositionTypeEnum.LONG,
        quantity: 0.02,
        reason: 'Take Profit',
        risk_percent: 4.0,
        risk_value: 400.00,
        roi: 3.75,
        sl: 40000.00,
        status: 'win',
        strategy: 'Swing Trading',
        symbol: 'BTCUSDT',
        tags: ['crypto', 'swing', 'btc-pump', 'high-conviction'],
        tp: 43125.00,
        trade_id: 3005,
        user_id: 123
      }
    ],
    status: StatusEnum.SUCCESS,
    total_count: 5
  };
};

// Additional mock data variations for different testing scenarios
export const createMockOpenPositionsVariations = {
  // Scenario 1: Multiple profitable trades
  profitable: (accountId: number): OpenTradesData => ({
    account: accountId,
    status: StatusEnum.SUCCESS,
    open_trades: [
      {
        account_id: accountId,
        balance: 10000.00,
        contract_size: 100000,
        entry: 1.0800,
        exchange: 'MT5',
        fees: 0.50,
        initial_margin: 1080.00,
        liquidation: 0.9700,
        master_order_id: null,
        open_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        order_id: 'PROFITABLE_001',
        order_type: OrderTypeEnum.MARKET,
        partial_tp_level: 0,
        pl: 250.75,
        position_type: PositionTypeEnum.LONG,
        quantity: 0.15,
        reason: 'Market',
        roi: 2.51,
        sl: 1.0750,
        symbol: 'EURUSD',
        tp: 1.0900,
        trade_id: 2001,
        trade_loss: -75.00,
        trade_profit: 150.00,
        user_id: 123,
        tp_levels: [],
        trailing_sl: [],
        risk_percent: 3.0,
        risk_value: 300.00
      },
      {
        account_id: accountId,
        balance: 10000.00,
        contract_size: 100000,
        entry: 1.2500,
        exchange: 'CTrader',
        fees: 0.75,
        initial_margin: 1250.00,
        liquidation: 1.1800,
        master_order_id: null,
        open_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        order_id: 'PROFITABLE_002',
        order_type: OrderTypeEnum.MARKET,
        partial_tp_level: 0,
        pl: 180.25,
        position_type: PositionTypeEnum.LONG,
        quantity: 0.08,
        reason: 'Market',
        roi: 1.80,
        sl: 1.2450,
        symbol: 'GBPUSD',
        tp: 1.2600,
        trade_id: 2002,
        trade_loss: -40.00,
        trade_profit: 80.00,
        user_id: 123,
        tp_levels: [],
        trailing_sl: [],
        risk_percent: 2.0,
        risk_value: 200.00
      }
    ],
    open_orders: [],
    other_open_trades: [],
    other_open_orders: []
  }),

  // Scenario 2: Multiple losing trades
  losing: (accountId: number): OpenTradesData => ({
    account: accountId,
    status: StatusEnum.SUCCESS,
    open_trades: [
      {
        account_id: accountId,
        balance: 10000.00,
        contract_size: 100000,
        entry: 0.6750,
        exchange: 'MT5',
        fees: 0.50,
        initial_margin: 675.00,
        liquidation: 0.7200,
        master_order_id: null,
        open_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        order_id: 'LOSING_001',
        order_type: OrderTypeEnum.MARKET,
        partial_tp_level: 0,
        pl: -125.50,
        position_type: PositionTypeEnum.SHORT,
        quantity: 0.12,
        reason: 'Market',
        roi: -1.86,
        sl: 0.6800,
        symbol: 'AUDUSD',
        tp: 0.6700,
        trade_id: 3001,
        trade_loss: -150.00,
        trade_profit: 60.00,
        user_id: 123,
        tp_levels: [],
        trailing_sl: [],
        risk_percent: 2.5,
        risk_value: 250.00
      },
      {
        account_id: accountId,
        balance: 10000.00,
        contract_size: 100000,
        entry: 1.3500,
        exchange: 'CTrader',
        fees: 0.75,
        initial_margin: 1350.00,
        liquidation: 1.4000,
        master_order_id: null,
        open_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        order_id: 'LOSING_002',
        order_type: OrderTypeEnum.MARKET,
        partial_tp_level: 0,
        pl: -95.75,
        position_type: PositionTypeEnum.SHORT,
        quantity: 0.07,
        reason: 'Market',
        roi: -1.41,
        sl: 1.3550,
        symbol: 'USDCAD',
        tp: 1.3450,
        trade_id: 3002,
        trade_loss: -105.00,
        trade_profit: 35.00,
        user_id: 123,
        tp_levels: [],
        trailing_sl: [],
        risk_percent: 1.8,
        risk_value: 180.00
      }
    ],
    open_orders: [],
    other_open_trades: [],
    other_open_orders: []
  }),

  // Scenario 3: Mixed with orders
  mixed: (accountId: number): OpenTradesData => ({
    account: accountId,
    status: StatusEnum.SUCCESS,
    open_trades: [
      {
        account_id: accountId,
        balance: 10000.00,
        contract_size: 100000,
        entry: 1.0850,
        exchange: 'MT5',
        fees: 0.50,
        initial_margin: 1085.00,
        liquidation: 0.9800,
        master_order_id: null,
        open_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        order_id: 'MIXED_001',
        order_type: OrderTypeEnum.MARKET,
        partial_tp_level: 0,
        pl: 65.25,
        position_type: PositionTypeEnum.LONG,
        quantity: 0.10,
        reason: 'Market',
        roi: 0.65,
        sl: 1.0800,
        symbol: 'EURUSD',
        tp: 1.0950,
        trade_id: 4001,
        trade_loss: -50.00,
        trade_profit: 100.00,
        user_id: 123,
        tp_levels: [
          { rr: 1.0, quantity: 50 },
          { rr: 2.0, quantity: 50 }
        ],
        trailing_sl: [
          { level: 1.0, level_type: 'rr', sl: 1.0820 }
        ],
        risk_percent: 2.5,
        risk_value: 250.00
      }
    ],
    open_orders: [
      {
        account_id: accountId,
        id: 4001,
        master_order_id: null,
        order_id: 'MIXED_ORDER_001',
        order_type: OrderTypeEnum.LIMIT,
        placed_time: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        position_type: PositionTypeEnum.LONG,
        price: 1.2450,
        quantity: 0.05,
        sl: 1.2400,
        symbol: 'GBPUSD',
        tp: 1.2550,
        user_id: 123
      },
      {
        account_id: accountId,
        id: 4002,
        master_order_id: null,
        order_id: 'MIXED_ORDER_002',
        order_type: OrderTypeEnum.STOP,
        placed_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        position_type: PositionTypeEnum.SHORT,
        price: 0.6700,
        quantity: 0.08,
        sl: 0.6750,
        symbol: 'AUDUSD',
        tp: 0.6650,
        user_id: 123
      }
    ],
    other_open_trades: [],
    other_open_orders: []
  })
};
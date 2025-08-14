import { PositionTypeEnum } from '@/shared/enums';
import { z } from 'zod';

const TradeSummarySchema = z.object({
  account_id: z.number(),
  balance: z.number(),
  entry: z.number(),
  equity: z.number(),
  exit: z.number(),
  exit_time: z.string(),
  fees: z.number(),
  open_time: z.string(),
  order_id: z.string(),
  pl: z.number(),
  position_type: z.enum([PositionTypeEnum.LONG, PositionTypeEnum.SHORT]),
  quantity: z.number(),
  roi: z.number(),
  symbol: z.string(),
});

const DailyDataSchema = z.object({
  date: z.string(),
  num_losing_trades: z.number(),
  num_trades: z.number(),
  num_winning_trades: z.number(),
  total_fees: z.number(),
  total_loss: z.number(),
  total_pl: z.number(),
  total_profit: z.number(),
  total_quantity: z.number(),
  total_roi: z.number(),
  trades_summary: z.array(TradeSummarySchema),
});

const DailySummarySchema = z.record(z.string(), DailyDataSchema);

export const DurationSummarySchema = z.array(
  z.tuple([z.number(), z.number(), z.number()]),
);

export const SessionSummarySchema = z.array(
  z.array(z.tuple([z.number(), z.number().nullable(), z.number().nullable()])),
);

export const TradesByPositionSchema = z.array(
  z.tuple([z.string(), z.number(), z.number(), z.number()]),
);

export const TradesBySymbolSchema = z.record(
  z.object({
    num_losing_trades: z.number(),
    num_trades: z.number(),
    num_winning_trades: z.number(),
    symbol: z.string(),
    total_loss: z.number(),
    total_pl: z.number(),
    total_profit: z.number(),
  }),
);

export const TradesSummarySchema = z.array(
  z.object({
    balance: z.number(),
    equity: z.number(),
    exit_time: z.string(),
    fees: z.number(),
    open_time: z.string(),
    pl: z.number(),
    position_type: z.string(),
    symbol: z.string(),
  }),
);

export const WeekdaySummarySchema = z.record(
  z.object({
    num_trades: z.number(),
    total_pl: z.number(),
    total_profit: z.number(),
  }),
);

export const MetricsSchema = z.object({
  average_duration: z.string(),
  average_loss: z.number(),
  average_pl: z.number(),
  average_profit: z.number(),
  balance: z.number(),
  daily_dd: z.number(),
  daily_pl: z.number(),
  daily_summary: DailySummarySchema,
  duration_summary: DurationSummarySchema,
  least_profitable_day: z.string(),
  losing_days: z.number(),
  losing_trades: z.number(),
  max_daily_dd: z.number(),
  max_loss: z.number(),
  max_total_dd: z.number(),
  max_win: z.number(),
  min_trading_days: z.number(),
  monthly_pl: z.number(),
  most_profitable_day: z.string(),
  net_pl: z.number(),
  profit_factor: z.number(),
  profit_target: z.number(),
  session_summary: SessionSummarySchema,
  starting_balance: z.number(),
  status: z.string(),
  total_dd: z.number(),
  total_fees: z.number(),
  total_trades: z.number(),
  trade_expectancy: z.number(),
  trades_by_position: TradesByPositionSchema,
  trades_by_symbol: TradesBySymbolSchema,
  trades_summary: TradesSummarySchema,
  trading_days: z.number(),
  weekday_summary: WeekdaySummarySchema,
  weekly_pl: z.number(),
  win_rate: z.number(),
  winning_days: z.number(),
  winning_trades: z.number(),
});

export const SymbolInfoSchema = z.object({
  contract_size: z.number(),
  pip_size: z.number(),
  quantity_precision: z.number(),
  rounding_precision: z.number(),
  status: z.string(),
});

export type Metrics = z.infer<typeof MetricsSchema>;
export type DailySummary = z.infer<typeof DailySummarySchema>;
export type TradeSummary = z.infer<typeof TradeSummarySchema>;
export type SymbolInfo = z.infer<typeof SymbolInfoSchema>;

import { z } from 'zod';
import { StatusEnum } from '../services/api'; 
import { PositionTypeEnum } from '@/shared/enums'; 

export enum TradeResultEnum {
  WIN = 'win',
  LOSS = 'loss',
}

export const TradeHistoryInputSchema = z.object({
  account: z.number(),
  page: z.number().optional(),
});

export const TradeHistoryItemSchema = z.object({
  account_id: z.number(),
  balance: z.number(),
  entry: z.number(),
  equity: z.number(),
  exchange: z.string(),
  exit: z.number(),
  exit_time: z.string(),
  fees: z.number(),
  initial_margin: z.number(),
  liquidation: z.number(),
  max_loss: z.number(),
  max_win: z.number(),
  open_time: z.string(),
  order_id: z.string(),
  pl: z.number(),
  position_type: z.nativeEnum(PositionTypeEnum),
  quantity: z.number(),
  reason: z.string(),
  risk_percent: z.number(),
  risk_value: z.number(),
  roi: z.number(),
  sl: z.number(),
  status: z.nativeEnum(TradeResultEnum),
  strategy: z.string(),
  symbol: z.string(),
  tags: z.array(z.string()),
  tp: z.number(),
  trade_id: z.number(),
  user_id: z.number(),
});

export const TradeHistoryDataSchema = z.object({
  all_trades: z.array(TradeHistoryItemSchema),
  status: z.nativeEnum(StatusEnum),
  total_count: z.number(),
});

export type TradeHistoryItem = z.infer<typeof TradeHistoryItemSchema>;
export type TradeHistoryData = z.infer<typeof TradeHistoryDataSchema>;
export type TradeHistoryInput = z.infer<typeof TradeHistoryInputSchema>;

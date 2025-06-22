import {
  AccountStatusEnum,
  AccountTypeEnum,
  ExchangeTypeEnum,
  InstrumentTypeEnum,
} from '../../shared/enums'
import { z } from 'zod';
import { StatusEnum } from '../services/api'; 

export const AccountDetailsSchema = z.object({
  account_status: z.enum([
    AccountStatusEnum.ACTIVE,
    AccountStatusEnum.PASSED,
    AccountStatusEnum.FAILED,
    AccountStatusEnum.DISCONNECTED,
  ]),
  status: z.string(),
  name: z.string(),
  currency: z.string(),
  comp_id: z.number(),
  id: z.number(),
  selected_symbols: z.array(z.string()),
  all_symbols: z.array(z.string()),
  balance: z.number(),
  risk: z.number(),
  default_lots: z.number(),
  leverage: z.object({
    EURUSD: z.number(),
    BTCUSDT: z.number(),
  }),
  exchange: z.enum([
    ExchangeTypeEnum.CTrader,
    ExchangeTypeEnum.DXTrade,
    ExchangeTypeEnum.MT5,
  ]),
  firm: z.string(),
  server: z.string(),
  rr_ratio: z.number(),
  be_level: z.number(),
  max_daily_loss: z.number(),
  leaderboard: z.boolean(),
  tp_levels: z.array(
    z.object({
      rr: z.number(),
      quantity: z.number(),
    }),
  ),
  trailing_sl: z.array(
    z.object({
      level: z.string(),
      level_type: z.string(),
      sl: z.string(),
    }),
  ),
  max_lots: z.object({
    [InstrumentTypeEnum.FOREX]: z.number(),
    [InstrumentTypeEnum.CRYPTO]: z.number(),
    [InstrumentTypeEnum.STOCKS]: z.number(),
    [InstrumentTypeEnum.INDICES]: z.number(),
  }),
  commission: z.object({
    [InstrumentTypeEnum.FOREX]: z.number(),
    [InstrumentTypeEnum.CRYPTO]: z.number(),
    [InstrumentTypeEnum.STOCKS]: z.number(),
    [InstrumentTypeEnum.INDICES]: z.number(),
  }),
  symbol_mappings: z.record(z.string(), z.string()),
  backtesting: z.boolean(),
  trading_session_start: z.string().optional(),
  trading_session_end: z.string().optional(),
  account_type: z.enum([
    AccountTypeEnum.DEMO,
    AccountTypeEnum.LIVE,
    AccountTypeEnum.FUNDED,
    AccountTypeEnum.EVALUATION,
    AccountTypeEnum.COMPETITION,
  ]),
  program: z.string().optional(),
});

export type AccountDetails = z.infer<typeof AccountDetailsSchema>;

export type UpdateAccountDetailsPayload = Pick<
  AccountDetails,
  Exclude<keyof AccountDetails, 'leverage'>
> & {
  leverage?: number;
  account: number;
};

export type UpdateAccountSymbolsPayload = {
  account: number;
  symbols: string[];
};

export type UpdateAccountMaxLotSizesPayload = {
  account: number;
  max_lots: {
    instrument: string;
    max_lots: number;
  }[];
};

export type UpdateAccountCommissionPayload = {
  account: number;
  commission: {
    instrument: string;
    commission: number;
  }[];
};

export type UpdateSymbolMappingsPayload = {
  account: number;
  symbol_mappings: {
    mapping: string;
    symbol: string;
  }[];
};

export type UpdateAccountParamsPayload = {
  account: number;
  backtesting: boolean;
  max_daily_dd: number;
  max_total_dd: number;
  min_trading_days: number;
  profit_target: number;
};

export const AccountSchema = z.object({
  id: z.number(),
  name: z.string(),
  balance: z.number(),
  currency: z.string(),
  exchange: z.string(),
  firm: z.string(),
  server: z.string(),
  account_type: z.enum([
    AccountTypeEnum.DEMO,
    AccountTypeEnum.LIVE,
    AccountTypeEnum.FUNDED,
    AccountTypeEnum.EVALUATION,
    AccountTypeEnum.COMPETITION,
  ]),
  api_key: z.string(),
  secret_key: z.string(),
  status: z.enum([
    AccountStatusEnum.ACTIVE,
    AccountStatusEnum.PASSED,
    AccountStatusEnum.FAILED,
    AccountStatusEnum.DISCONNECTED,
  ]),
});

export type AddAccountPayload = {
  account_size?: number;
  account_type: AccountTypeEnum;
  api_key?: string | null;
  exchange: string;
  firm?: string;
  max_daily_dd?: number;
  max_total_dd?: number;
  min_trading_days?: number;
  name: string;
  profit_target?: number;
  program?: string;
  program_fee?: number;
  secret_key?: string | null;
  server: string;
  user?: string;
};

export type AddCopyAccountPayload = {
  copy_account: number;
  copy_tp_sl: boolean;
  ignore_symbols: string[];
  lot_multiplier: number;
  master_account: number;
  risk_multiplier: number;
};

export const GenericCopyAccountSchema = z.object({
  master_account: z.number(),
  copy_account: z.number(),
});
export type GenericCopyAccountSchema = z.infer<typeof GenericCopyAccountSchema>;

export const AddCopyAccountSchema = GenericCopyAccountSchema.extend({
  copy_tp_sl: z.boolean().optional(),
  ignore_symbols: z.array(z.string()),
  lot_multiplier: z.number().min(1).optional(),
  risk_multiplier: z.number().min(1).max(5).optional(),
});
export type AddCopyAccountSchemaType = z.infer<typeof AddCopyAccountSchema>;

export const AddAccountDataSchema = z.object({
  message: z.string(),
  status: z.nativeEnum(StatusEnum),
});
export type AddAccountData = z.infer<typeof AddAccountDataSchema>;

export const TraderAccountsSchema = z.array(
  z.object({
    ctidTraderAccountId: z.number(),
    brokerTitleShort: z.string(),
    traderLogin: z.number(),
  }),
);

export type TraderAccountsData = z.infer<typeof TraderAccountsSchema>;

export const ConnectToBrokerDataSchema = z.object({
  message: z.object({
    trader_accounts: TraderAccountsSchema,
    server: z.string(),
  }),
  status: z.nativeEnum(StatusEnum),
});
export type ConnectToBrokerData = z.infer<typeof ConnectToBrokerDataSchema>;

export type ConnectToBrokerPayload = {
  code: string;
  exchange: string;
};

export type AddCTraderAccountPayload = {
  server: string;
  trading_accounts: {
    ctidTraderAccountId: number;
    traderLogin: number;
  }[];
};

export const AddCTraderDataSchema = z.object({
  message: z.string(),
  status: z.nativeEnum(StatusEnum),
});

export type AddCTraderData = z.infer<typeof AddCTraderDataSchema>;

export type Account = z.infer<typeof AccountSchema>;
import { z } from "zod";
import { AccountSchema } from './account'
import { StatusEnum } from "../services/api";
import { AccountStatusEnum, AccountTypeEnum } from "@/shared/enums";

export const CompetitionAccountSchema = z.object({
  account_type: z.string(),
  balance: z.number(),
  currency: z.string(),
  daily_pl: z.number(),
  id: z.number(),
  name: z.string(),
  status: z.nativeEnum(AccountStatusEnum),
  type: z.nativeEnum(AccountTypeEnum),
  total_pl: z.number(),
  starting_balance: z.number(),
  // TODO remove
  exchange: z.string(),
  firm: z.string(),
});

export type CompetitionAccountSchemaType = z.infer<
  typeof CompetitionAccountSchema
>;

export const CompetitionAccountLeaderboardSchema = z.object({
  all_pl: z.number(),
  daily_pl: z.number(),
  net_pl: z.number(),
  starting_balance: z.number(),
  user_id: z.number(),
  username: z.string(),
});

export const CompetitionAccountLeaderboardListSchema = z.object({
  accounts: z.array(CompetitionAccountLeaderboardSchema),

  status: z.nativeEnum(AccountStatusEnum),
});

export type CompetitionAccountLeaderboardList = z.infer<
  typeof CompetitionAccountLeaderboardListSchema
>;

export const AccountsSchema = z.object({
  broker_accounts: z.array(AccountSchema),
  prop_firm_accounts: z.array(AccountSchema),
  bt_accounts: z.array(AccountSchema),
  copier_accounts: z.array(AccountSchema),
  competition_accounts: z.array(CompetitionAccountSchema),
  status: z.nativeEnum(StatusEnum),
});

export type Accounts = z.infer<typeof AccountsSchema>;

export const UsersSchema = z.object({
  users: z.array(z.string()),
  status: z.nativeEnum(StatusEnum),
});

export type Users = z.infer<typeof UsersSchema>;

export const PropFirmAccountsOverviewSchema = z.object({
  daily_pl: z.number(),
  monthly_pl: z.number(),
  status: z.string(),
  total_balance_pl: z.number(),
  total_evaluation_balance: z.number(),
  total_funded_balance: z.number(),
  total_net_pl: z.number(),
  weekly_pl: z.number(),
});

export type PropFirmAccountsOverviewSchemaType = z.infer<
  typeof PropFirmAccountsOverviewSchema
>;

export const BrokerAccountsOverviewSchema = z.object({
  daily_pl: z.number(),
  monthly_pl: z.number(),
  status: z.string(),
  total_balance_pl: z.number(),
  total_balances: z.number(),
  total_net_pl: z.number(),
  weekly_pl: z.number(),
});

export type BrokerAccountsOverviewSchemaType = z.infer<
  typeof BrokerAccountsOverviewSchema
>;

export const AccountsOverviewDetailsSchema = z.object({
  details: z.array(
    z.object({
      balance: z.number(),
      date: z.string(),
    }),
  ),
});

export type AccountsOverviewDetailsSchemaType = z.infer<
  typeof AccountsOverviewDetailsSchema
>;

export const PropFirmAccounts = z.object({
  prop_firm_accounts: z.array(
    z.object({
      account_type: z.string(),
      api_key: z.string(),
      balance: z.number(),
      currency: z.string(),
      daily_pl: z.number(),
      exchange: z.string(),
      firm: z.string(),
      id: z.number(),
      name: z.string(),
      program: z.string(),
      secret_key: z.string(),
      server: z.string(),
      status: z.string(),
      total_pl: z.number(),
      net_pl: z.number(),
      max_total_dd: z.number(),
      profit_target: z.number(),
      starting_balance: z.number(),
    }),
  ),
});

export type PropFirmAccountsType = z.infer<typeof PropFirmAccounts>;

export const BrokerAccountsSchema = z.object({
  broker_accounts: z.array(
    z.object({
      account_type: z.string(),
      api_key: z.string(),
      balance: z.number(),
      currency: z.string(),
      daily_pl: z.number(),
      exchange: z.string(),
      firm: z.string(),
      id: z.number(),
      name: z.string(),
      secret_key: z.string(),
      server: z.string(),
      status: z.string(),
      total_pl: z.number(),
      starting_balance: z.number(),
    }),
  ),
});

export type BrokerAccountsSchemaType = z.infer<typeof BrokerAccountsSchema>;

export const CopierAccountsSchema = z.object({
  copier_accounts: z.array(
    z.object({
      active: z.number(),
      balance: z.number(),
      copier_accounts: z.array(
        z.object({
          copy_account: z.number(),
          copy_tp_sl: z.boolean(),
          enabled: z.boolean(),
          ignore_symbols: z.array(z.string()),
          lot_multiplier: z.number(),
          master_account: z.number(),
          risk_multiplier: z.number(),
        }),
      ),
      currency: z.string(),
      exchange: z.string(),
      inactive: z.number(),
      master_account: z.number(),
      name: z.string(),
      open_trades: z.number(),
      long_trades: z.number(),
      short_trades: z.number(),
      server: z.string(),
      type: z.nativeEnum(AccountTypeEnum),
    }),
  ),
});

export type CopierAccountsSchemaType = z.infer<typeof CopierAccountsSchema>;

export const SyncAccountStatusResultEnum = z.enum([
  'reactivated',
  'success',
  'skipped',
  'error',
]);

export const SyncAccountStatusAccountSchema = z.object({
  account_id: z.number(),
  account_name: z.string(),
  previous_status: z.string(),
  current_status: z.string(),
  result: SyncAccountStatusResultEnum,
  message: z.string(),
});

export type SyncAccountStatusAccount = z.infer<
  typeof SyncAccountStatusAccountSchema
>;

export const SyncAccountStatusResponseSchema = z.object({
  status: z.enum(['partial_success', 'success', 'error']),
  message: z.string(),
  accounts: z.array(SyncAccountStatusAccountSchema),
});

export type SyncAccountStatusResponse = z.infer<
  typeof SyncAccountStatusResponseSchema
>;
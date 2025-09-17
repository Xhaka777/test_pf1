import { symbol } from "d3";
import { StatusEnum } from "../services/api";
import { z } from 'zod';
import { PositionType } from "@/types/api/possitions";
import { OrderTypeEnum, PositionTypeEnum, TakeProfitSlTypeEnum } from "@/shared/enums";


export enum PositionColorEnum {
    LONG = 'text-green-theme',
    SHORT = 'text-red-theme',
    FLAT = 'text-muted-foreground'
}

export enum CloseTypeEnum {
    PROFIT = 'profit',
    LOSS = 'loss',
    ALL = 'all'
}

export enum TrailingSLTypeEnum {
    RR = 'rr',
    PRICE = 'price',
}

export const TradeServiceDataSchema = z.object({
    message: z.string(),
    status: z.nativeEnum(StatusEnum),
})

export const CalculateProfitLossDataSchema = z.object({
    status: z.nativeEnum(StatusEnum),
    fees: z.number(),
    pl: z.number(),
    roi: z.number()
})

export const TrailingSLLevelDataSchema = z.array(
    z.object({
        level: z.number(),
        level_type: z.nativeEnum(TrailingSLTypeEnum),
        sl: z.number()
    })
)

export const PartialTPLevelDataSchema = z.array(
    z.object({
        rr: z.number(),
        quantity: z.number()
    })
)

export const BaseOrderSchema = z.object({
    position_type: z.nativeEnum(PositionTypeEnum),
    order_id: z.string(),
    quantity: z.number(),
    sl: z.number(),
    tp: z.number(),
    user_id: z.number(),
    master_order_id: z.number().nullable(),
    symbol: z.string(),
    order_type: z.nativeEnum(OrderTypeEnum),
})

export const BaseTradeSchema = BaseOrderSchema.extend({
    contract_size: z.number(),
    partial_tp_level: z.number(),
    trade_loss: z.number(),
    trade_profit: z.number(),
    balance: z.number(),
    entry: z.number(),
    exchange: z.string(),
    fees: z.number(),
    initial_margin: z.number(),
    liquidation: z.number(),
    pl: z.number(),
    reason: z.string(),
    roi: z.number(),
    strategy: z.string(),
    trade_id: z.number(),
    symbol: z.string(),
    account_id: z.number()
})

//Specific schemas
export const OpenOrderDataSchema = BaseOrderSchema.extend({
    id: z.number(),
    placed_time: z.string(),
    price: z.number()
})

export const OpenTradeDataSchema = BaseTradeSchema.extend({
    open_time: z.string(),
    trailing_sl: TrailingSLLevelDataSchema.optional(),
    tp_levels: PartialTPLevelDataSchema.optional(),
    risk_percent: z.number().optional(),
    risk_value: z.number().optional(),
})

export const GetOpenTradesInputSchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional()
})

export const OpenTradesDataSchema = z.object({
    account: z.number(),
    open_orders: z.array(OpenOrderDataSchema),
    open_trades: z.array(OpenTradeDataSchema),
    other_open_orders: z.array(OpenOrderDataSchema),
    other_open_trades: z.array(OpenTradeDataSchema),
    status: z.nativeEnum(StatusEnum)
})

export const SymbolsDataSchema = z.object({
    exchange: z.array(z.string()),
    symbols: z.array(z.array(z.string())),
})

export const TradingPairSchema = z.object({
    symbol: z.string(),
    bid: z.number(),
    ask: z.number(),
    marketPrice: z.number(),
})

export const DetailedTradingPairSchema = TradingPairSchema.extend({
    exchange: z.string(),
    server: z.string(),
    time: z.number(),
    volume: z.number().optional()
})

export const GetPricesDataSchema = z.object({
    status: z.nativeEnum(StatusEnum),
    Data: z.array(
        z.object({
            time: z.number(),
            low: z.number(),
            high: z.number(),
            open: z.number(),
            close: z.number(),
            volume: z.number()
        })
    ),
})

export const SyncTradesInputSchema = z.object({
    account: z.number()
})

export const CloseAllTradeInputSchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional(),
    close_type: z.nativeEnum(CloseTypeEnum),
})

export const CloseTradeInputSchema = z.object({
    account: z.number(),
    position: z.nativeEnum(PositionTypeEnum),
    quantity: z.string(),
    trade_id: z.string(),
    symbol: z.string(),
    backtesting: z.boolean().optional(),
    pl: z.string().optional(),
    roi: z.string().optional(),
    exit_price: z.string().optional(),
    exit_time: z.string().optional(),
    partial_tp: z.string().optional()
})

export const UpdateTpSlInputSchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional(),
    position: z.nativeEnum(PositionTypeEnum),
    symbol: z.string(),
    trade_id: z.string()
})

export const UpdateTpInputSchema = UpdateTpSlInputSchema.extend({
    tp: z.string().nullable(),
})


export const UpdateSlInputSchema = UpdateTpSlInputSchema.extend({
    sl: z.string().nullable(),
    be: z.boolean().optional()
})

export const CancelOrderInputSchema = z.object({
    account: z.number(),
    symbol: z.string(),
    order_id: z.string(),
    backtesting: z.boolean().optional()
})

//Todo UpdatePartialTpInputSchema...
export const UpdatePartialTpInputSchema = z.object({
    account: z.number(),
    trade_id: z.string(),
    tp_levels: PartialTPLevelDataSchema,
})

export const UpdateTrailingSlInputSchema = z.object({
    account: z.number(),
    trade_id: z.string(),
    trailing_sl: TrailingSLLevelDataSchema,
})

export const DeleteBTTradeInputSchema = z.object({
    account: z.number(),
    order_id: z.string(),
    backtesting: z.boolean().optional()
})

export const DeleteBTTradesInputSchema = z.object({
    account: z.number(),
    closing_time: z.number(),
    backtesting: z.boolean().optional()
})

export const FetchPLSSInputSchema = z.object({
    user_id: z.number(),
    account: z.number(),
    trade_id: z.string(),
    history: z.boolean().optional(),
    download: z.boolean().optional(),
    backtesting: z.boolean().optional()
})

export const CalculatePositionSizeInputSchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional(),
    entry: z.number(),
    risk: z.number(),
    sl: z.number(),
    symbol: z.string()
})

export const CalculateStopLossInputSchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional(),
    direction: z.nativeEnum(PositionTypeEnum),
    entry: z.number(),
    quantity: z.number(),
    risk: z.number(),
    symbol: z.string()
})

export const CalculateProfitLossInputSchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional(),
    direction: z.nativeEnum(PositionTypeEnum),
    entry: z.number(),
    exit: z.number(),
    quantity: z.number(),
    symbol: z.string()
})

export const CalculateLiquidationInputSchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional(),
    entry: z.number(),
    leverage: z.number(),
    quantity: z.number(),
    symbol: z.string()
})

export const OpenTradeInputSchema = z.object({
    account: z.number(),
    add_tp_sl: z.boolean().optional(),
    backtesting: z.boolean().optional(),
    entry_price: z.string().optional(),
    entry_time: z.string(),
    exit_price: z.string().optional(),
    limit_triggered: z.boolean().optional(),
    order_type: z.nativeEnum(OrderTypeEnum),
    position: z.nativeEnum(PositionTypeEnum),
    price: z.string().optional(),
    quantity: z.string().optional(),
    risk_multiplier: z.string().optional().nullable(),
    sl: z.string().optional().nullable(),
    sl_type: z.nativeEnum(TakeProfitSlTypeEnum).optional().nullable(),
    symbol: z.string(),
    tp: z.string().optional().nullable(),
    tp_type: z.nativeEnum(TakeProfitSlTypeEnum).optional().nullable()
})

export const UpdateOrderInputSchema = OpenTradeInputSchema.extend({
    order_id: z.string()
})

export type TradeServiceData = z.infer<typeof TradeServiceDataSchema>;
export type OpenTradesData = z.infer<typeof OpenTradesDataSchema>;
export type SymbolsData = z.infer<typeof SymbolsDataSchema>;
export type TradingPair = z.infer<typeof TradingPairSchema>;
export type DetailedTradingPair = z.infer<typeof DetailedTradingPairSchema>;
export type GetPricesData = z.infer<typeof GetPricesDataSchema>;
export type CalculateProfitLossData = z.infer<typeof CalculateProfitLossDataSchema>;

export type GetOpenTradesInput = z.infer<typeof GetOpenTradesInputSchema>;
export type SyncTradesInput = z.infer<typeof SyncTradesInputSchema>;
export type CloseAllTradeInput = z.infer<typeof CloseAllTradeInputSchema>;
export type CloseTradeInput = z.infer<typeof CloseTradeInputSchema>;
export type UpdateTpInput = z.infer<typeof UpdateTpInputSchema>;
export type UpdateSlInput = z.infer<typeof UpdateSlInputSchema>;
export type UpdatePartialTpInput = z.infer<typeof UpdatePartialTpInputSchema>;
export type UpdateTrailingSLInput = z.infer<typeof UpdateTrailingSlInputSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderInputSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>;
export type DeleteBTTradeInput = z.infer<typeof DeleteBTTradeInputSchema>;
export type DeleteBTTradesInput = z.infer<typeof DeleteBTTradesInputSchema>;
export type FetchPLSSInput = z.infer<typeof FetchPLSSInputSchema>;
export type CalculatePositionSizeInput = z.infer<typeof CalculatePositionSizeInputSchema>;
export type CalculateStopLossInput = z.infer<typeof CalculateProfitLossInputSchema>
export type CalculateLiquidationInput = z.infer<typeof CalculateLiquidationInputSchema>;
export type CalculateProfitLossInput = z.infer<typeof CalculateProfitLossInputSchema>;
export type OpenTradeInput = z.infer<typeof OpenTradeInputSchema>;
export type OpenTradeDataSchemaType = z.infer<typeof OpenTradesDataSchema>;
export type OpenOrderDataSchemaType = z.infer<typeof OpenOrderDataSchema>;
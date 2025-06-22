import { z } from 'zod';
import { GenericResponse, GenericResponseSchema } from './shared';

export const TradeLogSchema = z.object({
    copy_account: z.number(),
    datetime: z.string(),
    message: z.string()
});

export const CopierLogSchema = z.object({
    entry: z.number().nullable(),
    master_account: z.number(),
    open_time: z.string().nullable(),
    order_id: z.string(),
    position_type: z.string().nullable(),
    quantity: z.number().nullable(),
    sl: z.number().nullable(),
    status: z.string(),
    symbol: z.string().nullable(),
    trade_logs: z.array(TradeLogSchema),
    user_id: z.number(),
})

export const CopierLogsResponseSchema = GenericResponseSchema.extend({
    logs: z.array(CopierLogSchema),
})

export type TradeLog = z.infer<typeof TradeLogSchema>;
export type CopierLog = z.infer<typeof CopierLogSchema>;
export type CopierLogsResponse = z.infer<typeof CopierLogsResponseSchema>;
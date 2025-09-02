import { z } from 'zod';

import { StatusEnum } from '../services/api';

export const JournalServiceDataSchema = z.object({
    message: z.string(),
    status: z.nativeEnum(StatusEnum),
});

// Base schemas
export const BaseJournalEntrySchema = z.object({
    account: z.number(),
    backtesting: z.boolean().optional(),
    trade_id: z.string(),
});

// Specific schemas
export const JournalEntryInputSchema = BaseJournalEntrySchema;

export const JournalEntryDataSchema = z.object({
    entry: z.string(),
    screenshot_url: z.string(),
    status: z.nativeEnum(StatusEnum),
});

export const JournalEntryUpdateInputSchema = BaseJournalEntrySchema.extend({
    entry: z.string(),
});

export const JournalTagSchema = z.object({
    tag: z.string(),
});

export const JournalTagDeleteInputSchema = JournalTagSchema;

export const JournalTagAddInputSchema = JournalTagSchema.extend({
    colour: z.string(),
});

export const JournalTagAssignInputSchema = BaseJournalEntrySchema.extend({
    tags: z.array(z.string()),
});

export const JournalTagsDataSchema = z.object({
    tags: z.array(JournalTagAddInputSchema),
    status: z.nativeEnum(StatusEnum),
});

export const JournalSSUploadInputSchema = BaseJournalEntrySchema.extend({
    screenshot: z.any(),
});

export const JournalSSRemoveInputSchema = BaseJournalEntrySchema.extend({
    screenshot_url: z.string(),
});

// Export types
export type JournalServiceData = z.infer<typeof JournalServiceDataSchema>;
export type JournalEntryInput = z.infer<typeof JournalEntryInputSchema>;
export type JournalEntryData = z.infer<typeof JournalEntryDataSchema>;
export type JournalEntryUpdateInput = z.infer<
    typeof JournalEntryUpdateInputSchema
>;
export type JournalTagsData = z.infer<typeof JournalTagsDataSchema>;
export type JournalTagDeleteInput = z.infer<typeof JournalTagDeleteInputSchema>;
export type JournalTagAddInput = z.infer<typeof JournalTagAddInputSchema>;
export type JournalTagAssignInput = z.infer<typeof JournalTagAssignInputSchema>;
export type JournalSSUploadInput = z.infer<typeof JournalSSUploadInputSchema>;
export type JournalSSRemoveInput = z.infer<typeof JournalSSRemoveInputSchema>;

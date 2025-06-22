import {
    GenericResponseSchema,
    PaginatedEntity
} from '../schema/shared'
import { z } from 'zod';
import { StatusEnum } from '../services/api';

export const UserSchema = GenericResponseSchema.extend({
    email: z.string().email(),
    email_verified: z.string(),
    mfa: z.boolean(),
    sub_plan: z.string(),
    sub_status: z.string(),
    user_id: z.number(),
    username: z.string(),
    status: z.nativeEnum(StatusEnum)
})

export const UserPlatformSchema = z.object({
    description: z.string(),
    id: z.number(),
    name: z.string()
})

export const UserPlatformBrokerSchema = z.object({
    description: z.string(),
    id: z.number(),
    name: z.string(),
    is_active: z.boolean(),
    servers: z.array(z.string()),
})

export const SymbolFavoriteSchema = z.object({
    order: z.number(),
    symbol: z.string(),
})

export const SymbolFavoritesResponseSchema = z.object({
    data: z.array(SymbolFavoriteSchema),
    limit: z.number().nullable(),
    message: z.string().nullable(),
    page: z.number().nullable(),
    status: z.string(),
    total: z.number().nullable()
})

export type UserPlatformSchemaType = z.infer<typeof UserPlatformSchema>;
export type PaginatedUserPlatform = PaginatedEntity<UserPlatformSchemaType>;
export type UserPlatformBrokerSchemaType = z.infer<typeof UserPlatformBrokerSchema>
export type PaginatedUserPlatformBroker = PaginatedEntity<UserPlatformBrokerSchemaType>;
export type User = z.infer<typeof UserSchema>;
export type SymbolFavorite = z.infer<typeof SymbolFavoriteSchema>;
export type SymbolFavoritesResponse = z.infer<typeof SymbolFavoritesResponseSchema>;
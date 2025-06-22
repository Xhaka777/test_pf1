import { z } from "zod";
import { StatusEnum } from "../services/api";

export const GenericResponseSchema = z.object({
    message: z.string().optional(),
    status: z.nativeEnum(StatusEnum)
})

export type GenericResponse = z.infer<typeof GenericResponseSchema>;

export type PaginatedEntity<T> = {
    data: T[];
    limit: number;
    message: string;
    page: number;
    status: string;
    total: number;
}

export type IdParameter = {
    id: number;
}
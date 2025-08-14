//Common API response wrapper types
export interface ApiResponse<T> {
    data: T;
    status: string;
    message?: string;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
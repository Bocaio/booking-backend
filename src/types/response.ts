export interface SuccessResponse<T> extends SuccessOptions {
    success: boolean,
    data: T,
}

export interface SuccessOptions {
    message?: string,
    pagination?: Pagination
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface ErrorPayload {
    code: string,
    details?: Record<string, unknown>;
    fieldErrors?: Array<{ field: string; message: string }>;
}

export interface ErrorResponse {
    success: boolean,
    message: string,
    error: ErrorPayload
}

export const ErrorCode = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    BAD_REQUEST: "BAD_REQUEST",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;
import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
    public readonly errors?: {
        field: string,
        message: string,
    }[]
    constructor(message: string, errors?: { field: string; message: string; value?: unknown }[]) {
        super(400, message)
        this.errors = errors
    }
}
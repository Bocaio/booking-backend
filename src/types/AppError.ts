export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code?: string;

    constructor(statusCode: number, message: string, code?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode = statusCode;
        this.code = code
    }
}
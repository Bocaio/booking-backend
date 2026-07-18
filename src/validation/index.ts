import { RequestHandler, Request, Response, NextFunction } from "express";
import z from "zod";
import { AppError } from "../types/AppError.js";
import { ValidationError } from "../types/valideError.js";


const buildValidationError = (error: z.ZodError) => {
    const errorMessages = error.issues.map((issue) => ({
        field: issue.path.join('.') || 'unkown',
        message: issue.message,
    }))
    return new ValidationError("validation failed", errorMessages)
}

export const ValidateRouteParams = (schema: z.ZodType): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const check = schema.safeParse(req.params);
        if (!check.success) {
            next(buildValidationError(check.error))
        } else {
            next()
        }
    }
}

export const ValidateBody = (shema: z.ZodType): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const check = shema.safeParse(req.body)
        if (!check.success) {
            next(buildValidationError(check.error))
            return
        } else {
            next()
        }
    }
}

export const ValidateQueryParams = (schema: z.ZodType): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const query = schema.parse(req.query) as any
        req.validateQuery = query
        next()
    }
}
import { ErrorRequestHandler } from "express";
import { AppError } from "../types/AppError.js";
import { ValidationError } from "../types/valideError.js";
import { ErrorCode } from "../types/response.js";
import { sendError } from "../utils/helper.js";
import { ErrorMessage } from "../constants/message.js";
import jwt from "jsonwebtoken";

const errorMiddleWare: ErrorRequestHandler = (error, req, res, next) => {
  console.log("Error is : ", error);

  if (error.code && error.errno) {
    switch (error.code) {
      case "ER_DUP_ENTRY":
        const dupMatch = error.sqlMessage?.match(
          /Duplicate entry '(.+)' for key '(.+)'/,
        );
        const rawKey = dupMatch?.[2];
        const field = rawKey?.split(".").pop() ?? "resource";
        sendError(res, `${field} already exists`, 409, {
          code: ErrorCode.DUPLICATE_ENTRY,
        });
        return;
      case "ER_NO_SUCH_TABLE":
        console.log("No Table is found in Database");
        sendError(res, ErrorMessage.INTERNAL_ERROR, 500, {
          code: ErrorCode.INTERNAL_ERROR,
        });
        return;
      case "ER_BAD_FIELD_ERROR":
        console.log("That field doesn't exist");
        sendError(res, ErrorMessage.BAD_REQUEST, 400, {
          code: ErrorCode.BAD_REQUEST,
        });
        return;
      case "ER_DATA_TOO_LONG":
        sendError(res, ErrorMessage.INPUT_TOO_LONG, 400, {
          code: ErrorCode.BAD_REQUEST,
        });
        return;
      case "ER_ACCESS_DENIED_ERROR":
        console.log("Database access denied");
        sendError(res, ErrorMessage.INTERNAL_ERROR, 500, {
          code: ErrorCode.INTERNAL_ERROR,
        });
        return;
      case "ECONNREFUSED":
        console.log("Database connection refused");
        sendError(res, ErrorMessage.SERVICE_UNAVAILABLE, 503, {
          code: ErrorCode.SERVICE_UNAVAILABLE,
        });
        return;
      case "ER_NO_REFERENCED_ROW_2":
        const fkMatch = error.sqlMessage?.match(/REFERENCES `(\w+)`/);
        const table = fkMatch?.[1] ?? "resource";
        sendError(res, `${table} not found`, 404, {
          code: ErrorCode.NOT_FOUND,
        });
        return;
      default:
        console.log("Database Error");
        sendError(res, ErrorMessage.INTERNAL_ERROR, 500, {
          code: ErrorCode.INTERNAL_ERROR,
        });
        return;
    }
  }

  if (
    error instanceof jwt.JsonWebTokenError ||
    error instanceof jwt.TokenExpiredError
  ) {
    sendError(res, error.message, 401, { code: ErrorCode.UNAUTHORIZED });
  }

  if (error instanceof ValidationError) {
    sendError(res, error.message, error.statusCode, {
      code: ErrorCode.VALIDATION_ERROR,
      fieldErrors: error.errors,
    });
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, {
      code: ErrorCode.BAD_REQUEST,
    });
    return;
  }

  sendError(res, ErrorMessage.INTERNAL_ERROR, 500, {
    code: ErrorCode.INTERNAL_ERROR,
  });
};

export default errorMiddleWare;

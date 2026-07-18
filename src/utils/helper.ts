import { Response } from "express";
import { CONFIGS } from "../config/index.js";
import {
  ErrorPayload,
  ErrorResponse,
  SuccessOptions,
  SuccessResponse,
} from "../types/response.js";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number,
  options?: SuccessOptions,
) => {
  const body: SuccessResponse<T> = { success: true, data, ...options };
  res.status(statusCode).send(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number,
  err: ErrorPayload,
) => {
  const body: ErrorResponse = {
    success: false,
    message,
    error: err,
  };
  res.status(statusCode).send(body);
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const isProduction = CONFIGS.NODE_ENV === "production";
  const sameSite = isProduction ? "none" : "strict";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

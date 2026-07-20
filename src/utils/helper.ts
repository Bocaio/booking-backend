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

const getAuthCookieOptions = () => {
  const isProduction = CONFIGS.NODE_ENV === "production";
  const sameSite: "none" | "strict" = isProduction ? "none" : "strict";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
  } as const;
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const baseOptions = getAuthCookieOptions();

  res.cookie("accessToken", accessToken, {
    ...baseOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  const baseOptions = getAuthCookieOptions();

  res.clearCookie("accessToken", baseOptions);
  res.clearCookie("refreshToken", baseOptions);
};

import { Request, Response, NextFunction } from "express";
import { IAuthService } from "../service/auth/type.js";
import {
  clearAuthCookies,
  sendSuccess,
  setAuthCookies,
} from "../utils/helper.js";
import { ErrorMessage, SuccessMessage } from "../constants/message.js";
import { AppError } from "../types/AppError.js";

export class AuthController {
  private readonly authService: IAuthService;
  constructor(authService: IAuthService) {
    this.authService = authService;
  }
  getRoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.getRoster();
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.body;
      const data = await this.authService.login(id);
      setAuthCookies(res, data.accessToken, data.refreshToken);
      sendSuccess(res, data.user, 200, {
        message: SuccessMessage.LOGIN_SUCCESS,
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.refreshToken;
      if (typeof token !== "string" || token.length === 0) {
        throw new AppError(401, ErrorMessage.UNAUTHORIZED);
      }

      const data = await this.authService.refresh(token);
      setAuthCookies(res, data.accessToken, data.refreshToken);
      sendSuccess(res, data.user, 200, {
        message: SuccessMessage.REFRESH_SUCCESS,
      });
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  };
}

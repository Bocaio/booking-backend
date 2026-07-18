import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/AppError.js";
import JWT from "jsonwebtoken";
import { UserPayload } from "../types/JwtPayload.js";
import { CONFIGS } from "../config/index.js";
import { ErrorMessage } from "../constants/message.js";

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    throw new AppError(401, ErrorMessage.UNAUTHORIZED);
  }
  try {
    const payload = JWT.verify(
      accessToken,
      CONFIGS.JWT_SECRET_KEY,
    ) as UserPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, ErrorMessage.UNAUTHORIZED);
  }
}

export default authMiddleware;

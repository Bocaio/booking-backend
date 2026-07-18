import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/AppError.js";
import { ErrorMessage } from "../constants/message.js";
import { permissionRepository } from "../dependency-injection/repositories.js";
import { PermissionCode } from "../constants/permission.js";

async function permissionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user?.userId) {
    throw new AppError(401, ErrorMessage.UNAUTHORIZED);
  }

  const { codes } = await permissionRepository.getCodesByUserId(
    req.user.userId,
  );

  req.user.permissions = codes;
  next();
}

const requirePermission = (code: PermissionCode) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.permissions?.includes(code)) {
      throw new AppError(403, ErrorMessage.FORBIDDEN);
    }
    next();
  };
};

export { permissionMiddleware, requirePermission };

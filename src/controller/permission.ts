import { Request, Response, NextFunction } from "express";
import { IPermissionService } from "../service/permission/type.js";
import { sendSuccess } from "../utils/helper.js";

export class PermissionController {
  private readonly permissionService: IPermissionService;

  constructor(permissionService: IPermissionService) {
    this.permissionService = permissionService;
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.permissionService.getAll();
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };
}

import { Request, Response, NextFunction } from "express";
import { IRoleService } from "../service/role/type.js";
import { sendSuccess } from "../utils/helper.js";

export class RoleController {
  private readonly roleService: IRoleService;

  constructor(roleService: IRoleService) {
    this.roleService = roleService;
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.roleService.getAll();
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };
}

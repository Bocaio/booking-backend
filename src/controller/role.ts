import { Request, Response, NextFunction } from "express";
import { IRoleService } from "../service/role/type.js";
import { sendSuccess } from "../utils/helper.js";
import { SuccessMessage } from "../constants/message.js";

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

  getAllWithPerm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.roleService.getAllWithPermission();
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };

  addPerm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, permissionId } = req.body;
      await this.roleService.addPermission(roleId, permissionId);
      sendSuccess(res, {}, 201, {
        message: SuccessMessage.ROLE_PERMISSION_ADDED,
      });
    } catch (err) {
      next(err);
    }
  };

  deletePerm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, permissionId } = req.body;
      await this.roleService.deletePermission(roleId, permissionId);
      sendSuccess(res, {}, 204, {
        message: SuccessMessage.ROLE_PERMISSION_DELETED,
      });
    } catch (err) {
      next(err);
    }
  };
}

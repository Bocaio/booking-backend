import { Request, Response, NextFunction } from "express";
import { IUserService } from "../service/user/type.js";
import { sendSuccess } from "../utils/helper.js";
import { SuccessMessage } from "../constants/message.js";

export class UserController {
  private readonly userService: IUserService;
  constructor(userService: IUserService) {
    this.userService = userService;
  }
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, roleId } = req.body;
      await this.userService.create(name, roleId);
      sendSuccess(res, {}, 201, { message: SuccessMessage.USER_CREATED });
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.userService.getAll();
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.body;
      await this.userService.delete(id);
      sendSuccess(res, {}, 204, { message: SuccessMessage.USER_DELETED });
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, roleId } = req.body;
      await this.userService.changeRole(userId, roleId);
      sendSuccess(res, {}, 200, { message: SuccessMessage.USER_ROLE_UPDATED });
    } catch (err) {
      next(err);
    }
  };
}

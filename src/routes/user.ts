import { Router } from "express";
import { userController } from "../dependency-injection/controllers.js";
import {
  permissionMiddleware,
  requirePermission,
} from "../middlewares/permission.js";
import {
  validateChangeRole,
  validateCreateUser,
  validateDeleteUser,
} from "../validation/user/user.validation.js";

const router = Router();

router.get(
  "/",
  permissionMiddleware,
  requirePermission("user.view"),
  userController.getAll,
);

router.post(
  "/",
  validateCreateUser,
  permissionMiddleware,
  requirePermission("user.create"),
  userController.create,
);

router.delete(
  "/",
  validateDeleteUser,
  permissionMiddleware,
  requirePermission("user.delete"),
  userController.delete,
);

router.put(
  "/role",
  validateChangeRole,
  permissionMiddleware,
  requirePermission("user.update_role"),
  userController.updateRole,
);

export { router as userRouter };

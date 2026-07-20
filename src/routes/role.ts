import { Router } from "express";
import { roleController } from "../dependency-injection/controllers.js";
import {
  permissionMiddleware,
  requirePermission,
} from "../middlewares/permission.js";
import {
  validateAddPerm,
  validateDeletePerm,
} from "../validation/role/role.validation.js";

const router = Router();

router.get(
  "/",
  permissionMiddleware,
  requirePermission("role.mutate"),
  roleController.getAll,
);

router.get(
  "/with-permissions",
  permissionMiddleware,
  requirePermission("role.mutate"),
  roleController.getAllWithPerm,
);

router.post(
  "/permission",
  validateAddPerm,
  permissionMiddleware,
  requirePermission("role.mutate"),
  roleController.addPerm,
);

router.delete(
  "/permission",
  validateDeletePerm,
  permissionMiddleware,
  requirePermission("role.mutate"),
  roleController.deletePerm,
);

export { router as roleRouter };

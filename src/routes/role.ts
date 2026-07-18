import { Router } from "express";
import { roleController } from "../dependency-injection/controllers.js";
import {
  permissionMiddleware,
  requirePermission,
} from "../middlewares/permission.js";

const router = Router();

router.get(
  "/",
  permissionMiddleware,
  requirePermission("role.view"),
  roleController.getAll,
);

export { router as roleRouter };

import { Router } from "express";
import { permissionController } from "../dependency-injection/controllers.js";
import {
  permissionMiddleware,
  requirePermission,
} from "../middlewares/permission.js";

const router = Router();

router.get(
  "/",
  permissionMiddleware,
  requirePermission("role.view"),
  permissionController.getAll,
);

export { router as permissionRouter };

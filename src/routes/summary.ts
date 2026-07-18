import { Router } from "express";
import { summaryController } from "../dependency-injection/controllers.js";
import {
  permissionMiddleware,
  requirePermission,
} from "../middlewares/permission.js";

const router = Router();

router.get(
  "/",
  permissionMiddleware,
  requirePermission("summary.view"),
  summaryController.get,
);

export { router as summaryRouter };

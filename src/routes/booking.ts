import { Router } from "express";
import { bookingController } from "../dependency-injection/controllers.js";
import {
  permissionMiddleware,
  requirePermission,
} from "../middlewares/permission.js";
import { validateDeleteBooking } from "../validation/booking/booking.validation.js";

const router = Router();

router.get(
  "/",
  permissionMiddleware,
  requirePermission("booking.view"),
  bookingController.getAll,
);

router.post(
  "/",
  permissionMiddleware,
  requirePermission("booking.create"),
  bookingController.create,
);

router.delete(
  "/",
  validateDeleteBooking,
  permissionMiddleware,
  bookingController.delete,
);

export { router as bookingRouter };

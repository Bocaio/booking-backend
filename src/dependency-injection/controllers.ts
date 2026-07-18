import { AuthController } from "../controller/auth.js";
import { BookingController } from "../controller/booking.js";
import { UserController } from "../controller/user.js";
import { RoleController } from "../controller/role.js";
import { SummaryController } from "../controller/summary.js";
import {
  authService,
  bookingService,
  userService,
  roleService,
  summaryService,
} from "./services.js";

export const authController = new AuthController(authService);
export const bookingController = new BookingController(bookingService);
export const userController = new UserController(userService);
export const roleController = new RoleController(roleService);
export const summaryController = new SummaryController(summaryService);

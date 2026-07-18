import { AuthController } from "../controller/auth.js";
import { BookingController } from "../controller/booking.js";
import { UserController } from "../controller/user.js";
import { RoleController } from "../controller/role.js";
import {
  authService,
  bookingService,
  userService,
  roleService,
} from "./services.js";

export const authController = new AuthController(authService);
export const bookingController = new BookingController(bookingService);
export const userController = new UserController(userService);
export const roleController = new RoleController(roleService);

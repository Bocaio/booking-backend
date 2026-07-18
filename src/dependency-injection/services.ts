import { AuthService } from "../service/auth/index.js";
import { BookingService } from "../service/booking/index.js";
import { UserService } from "../service/user/index.js";
import { RoleService } from "../service/role/index.js";
import { SummaryService } from "../service/summary/index.js";
import {
  userRepository,
  refreshTokenRepository,
  bookingRepository,
  roleRepository,
} from "./repositories.js";

export const authService = new AuthService(
  userRepository,
  refreshTokenRepository,
);

export const bookingService = new BookingService(bookingRepository);

export const userService = new UserService(userRepository, roleRepository);

export const roleService = new RoleService(roleRepository);

export const summaryService = new SummaryService(
  userRepository,
  bookingRepository,
);

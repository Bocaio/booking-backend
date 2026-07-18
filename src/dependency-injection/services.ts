import { AuthService } from "../service/auth/index.js";
import { BookingService } from "../service/booking/index.js";
import {
  userRepository,
  refreshTokenRepository,
  bookingRepository,
} from "./repositories.js";

export const authService = new AuthService(
  userRepository,
  refreshTokenRepository,
);

export const bookingService = new BookingService(bookingRepository);

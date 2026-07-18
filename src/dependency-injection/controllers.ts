import { AuthController } from "../controller/auth.js";
import { BookingController } from "../controller/booking.js";
import { authService, bookingService } from "./services.js";

export const authController = new AuthController(authService);
export const bookingController = new BookingController(bookingService);

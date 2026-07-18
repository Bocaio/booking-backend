import { UserRepository } from "../repository/mysql/user.js";
import { BookingRepository } from "../repository/mysql/booking.js";
import { RoleRepository } from "../repository/mysql/role.js";
import { PermissionRepository } from "../repository/mysql/permission.js";
import { RefreshTokenRepository } from "../repository/redis/refresh-token.js";

export const userRepository = new UserRepository();
export const bookingRepository = new BookingRepository();
export const roleRepository = new RoleRepository();
export const permissionRepository = new PermissionRepository();
export const refreshTokenRepository = new RefreshTokenRepository();

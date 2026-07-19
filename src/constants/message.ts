export const SuccessMessage = {
  LOGIN_SUCCESS: "Logged in successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  REFRESH_SUCCESS: "Session refreshed",

  USER_CREATED: "User created successfully",
  USER_DELETED: "User deleted successfully",
  USER_ROLE_UPDATED: "User role updated successfully",

  BOOKING_CREATED: "Booking created successfully",
  BOOKING_DELETED: "Booking deleted successfully",

  HEALTH_OK: "Service is healthy",
} as const;

export const ErrorMessage = {
  INTERNAL_ERROR: "Internal Server Error",
  BAD_REQUEST: "Bad Request",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  VALIDATION_FAILED: "Validation failed",
  INPUT_TOO_LONG: "Your input is too long",

  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "You do not have permission to perform this action",

  USER_NOT_FOUND: "User not found",
  ROLE_NOT_FOUND: "Role not found",
    BOOKING_NOT_FOUND: "Booking not found",
    BOOKING_TIME_CONFLICT: "Time slot conflicts with an existing booking",

  INVALID_TIME_RANGE: "startTime must be before endTime",
  BOOKING_IN_PAST: "Booking cannot start in the past",
  BOOKING_IN_PROGRESS: "Cannot delete a booking that is currently in progress",
} as const;

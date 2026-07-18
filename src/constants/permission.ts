export const Permission = {
  BOOKING_CREATE: "booking.create",
  BOOKING_VIEW: "booking.view",
  BOOKING_DELETE_OWN: "booking.delete.own",
  BOOKING_DELETE_ANY: "booking.delete.any",
  SUMMARY_VIEW: "summary.view",
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_DELETE: "user.delete",
  USER_UPDATE_ROLE: "user.update_role",
  ROLE_VIEW: "role.view",
} as const;

export type PermissionCode = (typeof Permission)[keyof typeof Permission];

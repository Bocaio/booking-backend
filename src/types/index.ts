import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface Database {
  roles: RoleTable;
  permissions: PermissionTable;
  role_permissions: RolePermissionTable;
  users: UserTable;
  bookings: BookingTable;
}

export interface RoleTable {
  id: Generated<number>;
  name: string;
  label: string;
}

export interface PermissionTable {
  id: Generated<number>;
  code: string;
  description: string | null;
}

export interface RolePermissionTable {
  role_id: number;
  permission_id: number;
}

export interface UserTable {
  id: string;
  name: string;
  role_id: number;
}

export interface BookingTable {
  id: Generated<number>;
  user_id: string;
  start_time: ColumnType<Date, Date | string, Date | string>;
  end_time: ColumnType<Date, Date | string, Date | string>;
  created_at: Generated<Date>;
}

export type Role = Selectable<RoleTable>;
export type NewRole = Insertable<RoleTable>;

export type Permission = Selectable<PermissionTable>;
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;

export type Booking = Selectable<BookingTable>;
export type NewBooking = Insertable<BookingTable>;

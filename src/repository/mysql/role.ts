import database from "../../config/database.js";
import { Role } from "../../types/index.js";

export interface RolePermissionRow {
  roleId: number;
  roleName: string;
  roleLabel: string;
  permissionId: number | null;
  permissionCode: string | null;
  permissionDescription: string | null;
}

export interface IRoleRepository {
  getAll: () => Promise<Role[]>;
  getById: (id: number) => Promise<Role | null>;
  getAllWithPermissions: () => Promise<RolePermissionRow[]>;
  addPermission: (roleId: number, permissionId: number) => Promise<void>;
  deletePermission: (roleId: number, permissionId: number) => Promise<number>;
}

class RoleRepository implements IRoleRepository {
  getAll = async (): Promise<Role[]> => {
    return database
      .selectFrom("roles")
      .selectAll()
      .orderBy("id", "asc")
      .execute();
  };

  getById = async (id: number): Promise<Role | null> => {
    const role = await database
      .selectFrom("roles")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return role ?? null;
  };

  getAllWithPermissions = async (): Promise<RolePermissionRow[]> => {
    return database
      .selectFrom("roles")
      .leftJoin("role_permissions", "role_permissions.role_id", "roles.id")
      .leftJoin(
        "permissions",
        "permissions.id",
        "role_permissions.permission_id",
      )
      .select([
        "roles.id as roleId",
        "roles.name as roleName",
        "roles.label as roleLabel",
        "permissions.id as permissionId",
        "permissions.code as permissionCode",
        "permissions.description as permissionDescription",
      ])
      .orderBy("roles.id", "asc")
      .orderBy("permissions.id", "asc")
      .execute();
  };

  addPermission = async (
    roleId: number,
    permissionId: number,
  ): Promise<void> => {
    await database
      .insertInto("role_permissions")
      .ignore()
      .values({ role_id: roleId, permission_id: permissionId })
      .executeTakeFirst();
  };

  deletePermission = async (
    roleId: number,
    permissionId: number,
  ): Promise<number> => {
    const result = await database
      .deleteFrom("role_permissions")
      .where("role_id", "=", roleId)
      .where("permission_id", "=", permissionId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  };
}

export { RoleRepository };

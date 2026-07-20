import database from "../../config/database.js";
import { Permission } from "../../types/index.js";

export interface CodesByUser {
  codes: string[];
}

export interface IPermissionRepository {
  getAll: () => Promise<Permission[]>;
  getById: (id: number) => Promise<Permission | null>;
  getCodesByRole: (roleId: number) => Promise<string[]>;
  getCodesByUserId: (userId: string) => Promise<CodesByUser>;
}

class PermissionRepository implements IPermissionRepository {
  getAll = async (): Promise<Permission[]> => {
    return database
      .selectFrom("permissions")
      .selectAll()
      .orderBy("id", "asc")
      .execute();
  };

  getById = async (id: number): Promise<Permission | null> => {
    const permission = await database
      .selectFrom("permissions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return permission ?? null;
  };

  getCodesByRole = async (roleId: number): Promise<string[]> => {
    const rows = await database
      .selectFrom("role_permissions")
      .innerJoin(
        "permissions",
        "permissions.id",
        "role_permissions.permission_id",
      )
      .select("permissions.code as code")
      .where("role_permissions.role_id", "=", roleId)
      .execute();
    return rows.map((r) => r.code);
  };

  getCodesByUserId = async (userId: string): Promise<CodesByUser> => {
    const rows = await database
      .selectFrom("users")
      .leftJoin("role_permissions", "role_permissions.role_id", "users.role_id")
      .leftJoin(
        "permissions",
        "permissions.id",
        "role_permissions.permission_id",
      )
      .select(["users.id as userId", "permissions.code as code"])
      .where("users.id", "=", userId)
      .execute();

    if (rows.length === 0) {
      return { codes: [] };
    }

    const codes = rows
      .map((r) => r.code)
      .filter((c): c is string => c !== null);

    return { codes };
  };
}

export { PermissionRepository };

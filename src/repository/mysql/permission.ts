import database from "../../config/database.js";

export interface CodesByUser {
  codes: string[];
}

export interface IPermissionRepository {
  getCodesByRole: (roleId: number) => Promise<string[]>;
  getCodesByUserId: (userId: string) => Promise<CodesByUser>;
}

class PermissionRepository implements IPermissionRepository {
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
      .select(["users.id as user_id", "permissions.code as code"])
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

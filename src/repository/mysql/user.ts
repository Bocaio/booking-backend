import database from "../../config/database.js";

export interface User {
  id: string;
  name: string;
  roleId: number;
  roleName: string;
  roleLabel: string;
}

export interface IUserRepository {
  create: (id: string, name: string, roleId: number) => Promise<void>;
  delete: (id: string) => Promise<number>;
  getById: (id: string) => Promise<User | null>;
  getAll: () => Promise<User[]>;
  updateRole: (id: string, roleId: number) => Promise<number>;
}

class UserRepository implements IUserRepository {
  private baseQuery() {
    return database
      .selectFrom("users")
      .innerJoin("roles", "roles.id", "users.role_id")
      .select([
        "users.id as id",
        "users.name as name",
        "users.role_id as roleId",
        "roles.name as roleName",
        "roles.label as roleLabel",
      ]);
  }

  create = async (id: string, name: string, roleId: number): Promise<void> => {
    await database
      .insertInto("users")
      .values({ id, name, role_id: roleId })
      .execute();
  };

  delete = async (id: string): Promise<number> => {
    const result = await database
      .deleteFrom("users")
      .where("id", "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  };

  getById = async (id: string): Promise<User | null> => {
    const user = await this.baseQuery()
      .where("users.id", "=", id)
      .executeTakeFirst();
    return user ?? null;
  };

  getAll = async (): Promise<User[]> => {
    return this.baseQuery().orderBy("users.role_id", "asc").execute();
  };

  updateRole = async (id: string, roleId: number): Promise<number> => {
    const result = await database
      .updateTable("users")
      .set({ role_id: roleId })
      .where("id", "=", id)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  };
}

export { UserRepository };

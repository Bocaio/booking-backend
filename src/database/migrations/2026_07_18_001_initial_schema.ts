import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("roles")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar(50)", (col) => col.notNull().unique())
    .addColumn("label", "varchar(100)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("permissions")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("code", "varchar(100)", (col) => col.notNull().unique())
    .addColumn("description", "varchar(255)")
    .execute();

  await db.schema
    .createTable("role_permissions")
    .addColumn("role_id", "integer", (col) =>
      col.notNull().references("roles.id").onDelete("cascade"),
    )
    .addColumn("permission_id", "integer", (col) =>
      col.notNull().references("permissions.id").onDelete("cascade"),
    )
    .addPrimaryKeyConstraint("role_permissions_pk", [
      "role_id",
      "permission_id",
    ])
    .execute();

  await db.schema
    .createTable("users")
    .addColumn("id", "char(36)", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("role_id", "integer", (col) =>
      col.notNull().references("roles.id"),
    )
    .execute();

  await db.schema
    .createTable("bookings")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("user_id", "char(36)", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("start_time", sql`datetime(3)`, (col) => col.notNull())
    .addColumn("end_time", sql`datetime(3)`, (col) => col.notNull())
    .addColumn("created_at", sql`datetime(3)`, (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP(3)`),
    )
    .addCheckConstraint("chk_bookings_range", sql`start_time < end_time`)
    .execute();

  await db.schema
    .createIndex("idx_bookings_range")
    .on("bookings")
    .columns(["start_time", "end_time"])
    .execute();

  await seed(db);
}

async function seed(db: Kysely<any>): Promise<void> {
  await db
    .insertInto("roles")
    .values([
      { name: "admin", label: "Administrator" },
      { name: "owner", label: "Owner" },
      { name: "user", label: "User" },
    ])
    .execute();

  await db
    .insertInto("permissions")
    .values([
      { code: "booking.create", description: "Create a booking" },
      { code: "booking.view", description: "View all bookings" },
      { code: "booking.delete.own", description: "Delete your own bookings" },
      { code: "booking.delete.any", description: "Delete any user's booking" },
      { code: "summary.view", description: "View usage summary " },
      { code: "user.view", description: "View all users" },
      { code: "user.create", description: "Create a user" },
      { code: "user.delete", description: "Delete a user" },
      { code: "user.update_role", description: "Change a user's role" },
      { code: "role.view", description: "View all roles" },
    ])
    .execute();

  const rolePermissions: Record<string, string[]> = {
    admin: [
      "booking.create",
      "booking.view",
      "booking.delete.own",
      "booking.delete.any",
      "summary.view",
      "user.view",
      "user.create",
      "user.delete",
      "user.update_role",
      "role.view",
    ],
    owner: [
      "booking.create",
      "booking.view",
      "booking.delete.own",
      "booking.delete.any",
      "summary.view",
      "user.view",
      "role.view",
    ],
    user: ["booking.create", "booking.view", "booking.delete.own"],
  };

  const roles = await db.selectFrom("roles").select(["id", "name"]).execute();
  const permissions = await db
    .selectFrom("permissions")
    .select(["id", "code"])
    .execute();

  const roleId = new Map(roles.map((r: any) => [r.name, r.id]));
  const permissionId = new Map(permissions.map((p: any) => [p.code, p.id]));

  const rows: { role_id: number; permission_id: number }[] = [];
  for (const [role, codes] of Object.entries(rolePermissions)) {
    for (const code of codes) {
      rows.push({
        role_id: roleId.get(role),
        permission_id: permissionId.get(code),
      });
    }
  }

  await db.insertInto("role_permissions").values(rows).execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("bookings").ifExists().execute();
  await db.schema.dropTable("users").ifExists().execute();
  await db.schema.dropTable("role_permissions").ifExists().execute();
  await db.schema.dropTable("permissions").ifExists().execute();
  await db.schema.dropTable("roles").ifExists().execute();
}

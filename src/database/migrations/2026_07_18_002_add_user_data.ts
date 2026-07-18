import { Kysely } from "kysely";
import { v7 as uuidv7 } from "uuid";

const SEED_USERS = [
  { name: "U Kyaw", role: "admin" },
  { name: "Aung Aung", role: "owner" },
  { name: "Zaw Zaw", role: "user" },
  { name: "Tun Tun", role: "user" },
];

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addUniqueConstraint("users_name_unique", ["name"])
    .execute();

  const roles = await db
    .selectFrom("roles")
    .select(["id", "name"])
    .where(
      "name",
      "in",
      SEED_USERS.map((u) => u.role),
    )
    .execute();

  const roleIdByName = new Map(roles.map((r: any) => [r.name, r.id]));

  await db
    .insertInto("users")
    .values(
      SEED_USERS.map((u) => ({
        id: uuidv7(),
        name: u.name,
        role_id: roleIdByName.get(u.role),
      })),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .deleteFrom("users")
    .where(
      "name",
      "in",
      SEED_USERS.map((u) => u.name),
    )
    .execute();

  await db.schema
    .alterTable("users")
    .dropConstraint("users_name_unique")
    .execute();
}

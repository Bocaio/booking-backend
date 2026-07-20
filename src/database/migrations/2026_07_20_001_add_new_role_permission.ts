import { Kysely } from "kysely";

const PERMISSION_CODE = "role.mutate";
const GRANT_TO_ROLE = "admin";

export async function up(db: Kysely<any>): Promise<void> {
  const inserted = await db
    .insertInto("permissions")
    .values({
      code: PERMISSION_CODE,
      description: "Add or remove permissions on a role",
    })
    .executeTakeFirstOrThrow();

  const permissionId = Number(inserted.insertId);

  const role = await db
    .selectFrom("roles")
    .select("id")
    .where("name", "=", GRANT_TO_ROLE)
    .executeTakeFirstOrThrow();

  await db
    .insertInto("role_permissions")
    .values({ role_id: role.id, permission_id: permissionId })
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db
    .deleteFrom("permissions")
    .where("code", "=", PERMISSION_CODE)
    .execute();
}

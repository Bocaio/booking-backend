import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .deleteFrom("bookings")
    .where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom("users")
            .select("id")
            .whereRef("users.id", "=", "bookings.user_id"),
        ),
      ),
    )
    .execute();

  await db.schema
    .alterTable("bookings")
    .addForeignKeyConstraint(
      "fk_bookings_user_id",
      ["user_id"],
      "users",
      ["id"],
    )
    .onDelete("cascade")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("bookings")
    .dropConstraint("fk_bookings_user_id")
    .execute();
}

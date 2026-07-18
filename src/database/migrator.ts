import * as path from "path";

import { promises as fs } from "fs";
import { Kysely, MysqlDialect, sql } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { fileURLToPath } from "url";
import { getPool } from "../config/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Kysely<any>({
  dialect: new MysqlDialect({
    pool: getPool(),
  }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, "migrations"),
  }),
});

async function migrateToLatest() {
  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

async function migrateUp() {
  const { error, results } = await migrator.migrateUp();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });
  if (!results?.length) {
    console.log("No migrations to up.");
  }

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

async function migrateDown() {
  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`✓ Migration "${it.migrationName}" reverted successfully`);
    } else if (it.status === "Error") {
      console.error(`✗ Migration "${it.migrationName}" failed to revert`);
    }
  });

  if (error) {
    console.error("Rollback failed:", error);
    process.exit(1);
  }

  if (!results?.length) {
    console.log("No migrations to revert.");
  }

  await db.destroy();
}

async function baseline() {
  await sql`
    CREATE TABLE IF NOT EXISTS kysely_migration (
      name VARCHAR(255) PRIMARY KEY,
      timestamp VARCHAR(255) NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS kysely_migration_lock (
      id VARCHAR(255) PRIMARY KEY,
      is_locked INTEGER NOT NULL DEFAULT 0
    )
  `.execute(db);

  await sql`
    INSERT IGNORE INTO kysely_migration_lock (id, is_locked) VALUES ('migration_lock', 0)
  `.execute(db);

  await sql`
    INSERT IGNORE INTO kysely_migration (name, timestamp)
    VALUES ('2026_07_18_001_initial_schema', ${new Date().toISOString()})
  `.execute(db);

  console.log(
    '✓ Baseline applied. Migration "2026_07_18_001_initial_schema" marked as already executed.',
  );
  await db.destroy();
}

async function create() {
  const name = process.argv[3];
  if (!name) {
    console.error("Usage: npm run migrate:create <name>");
    console.error("Example: npm run migrate:create add_user_bio");
    process.exit(1);
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "_");

  const migrationsDir = path.join(__dirname, "migrations");
  const existing = await fs.readdir(migrationsDir);
  const todayFiles = existing.filter((f) => f.startsWith(date));
  const seq = String(todayFiles.length + 1).padStart(3, "0");

  const fileName = `${date}_${seq}_${name}.ts`;
  const filePath = path.join(migrationsDir, fileName);

  const template = `import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Write your migration here
}

export async function down(db: Kysely<any>): Promise<void> {
  // Write your rollback here
}
`;

  await fs.writeFile(filePath, template);
  console.log(`✓ Created: src/database/migrations/${fileName}`);
}

const command = process.argv[2];

switch (command) {
  case "latest":
    migrateToLatest();
    break;
  case "up":
    migrateUp();
    break;
  case "down":
    migrateDown();
    break;
  case "baseline":
    baseline();
    break;
  case "create":
    create();
    break;
  default:
    console.log("Usage: npm run migration:<up|down|baseline|latest|create>");
    process.exit(1);
}

import { Kysely, MysqlDialect } from "kysely";
import { Database } from "../types/index.js";
import { getPool } from "./pool.js";

const dialect = new MysqlDialect({
  pool: getPool(),
});

const database = new Kysely<Database>({
  dialect,
});

export default database;

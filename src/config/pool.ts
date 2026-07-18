import { createPool } from "mysql2";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIGS } from "./index.js";

const caCertPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../certs/ca.pem",
);

export function getPool() {
  return createPool({
    host: CONFIGS.DB_HOST,
    user: CONFIGS.DB_USER,
    database: CONFIGS.DB_NAME,
    password: CONFIGS.DB_PASSWORD,
    port: CONFIGS.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: "Z",
    ssl: {
      ca: fs.readFileSync(caCertPath),
      rejectUnauthorized: true,
    },
  });
}

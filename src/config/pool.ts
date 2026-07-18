import { createPool } from "mysql2";
import { CONFIGS } from "./index.js";

function loadCa(): string {
  if (!CONFIGS.DB_CA_CERT) {
    throw new Error(
      "DB_CA_CERT is not set. Provide the MySQL CA certificate (PEM) via the DB_CA_CERT environment variable.",
    );
  }
  return CONFIGS.DB_CA_CERT.replace(/\\n/g, "\n");
}

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
      ca: loadCa(),
      rejectUnauthorized: true,
    },
  });
}

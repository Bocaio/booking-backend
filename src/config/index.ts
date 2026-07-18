import dotenv from "dotenv";

dotenv.config();

export const CONFIGS = {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY as string,
  PORT: Number(process.env.PORT ?? 8000),
  NODE_ENV: process.env.NODE_ENV as string,
  DB_HOST: process.env.DB_HOST as string,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_NAME: process.env.DB_NAME as string,
  DB_CA_CERT: process.env.DB_CA_CERT,
  REDIS_URL: process.env.REDIS_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};

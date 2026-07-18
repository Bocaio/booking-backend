import dotenv from "dotenv";

dotenv.config();

export const CONFIGS = {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY as string,
  PORT: process.env.PORT as string,
  NODE_ENV: process.env.NODE_ENV as string,
  DB_HOST: process.env.DB_HOST as string,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER as string,
  DB_PASSWORD: process.env.DB_PASSWORD as string,
  DB_NAME: process.env.DB_NAME as string,
};

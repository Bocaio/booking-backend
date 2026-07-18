import { createClient, RedisClientType } from "redis";
import { CONFIGS } from "./index.js";

const redisClient: RedisClientType = createClient(
  CONFIGS.REDIS_URL ? { url: CONFIGS.REDIS_URL } : undefined,
);

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});

export default redisClient;

import { createClient, RedisClientType } from "redis";

const redisClient: RedisClientType = createClient();

export default redisClient;

import { RedisClientType } from "redis";
import redisClient from "../../config/redis.js";

export interface IRefreshTokenRepository {
  set: (key: string, value: string) => Promise<void>;
  isMember: (key: string, value: string) => Promise<boolean>;
  delete: (key: string, value: string) => Promise<void>;
  deleteAll: (key: string[]) => Promise<void>;
}

export class RefreshTokenRepository implements IRefreshTokenRepository {
  private readonly redis: RedisClientType;
  private readonly prefix: string;
  private readonly expired: number;
  constructor() {
    this.redis = redisClient;
    this.prefix = "refresh_tokens";
    this.expired = 7 * 24 * 60 * 60;
  }
  set = async (key: string, value: string) => {
    await this.redis.sAdd(`${this.prefix}:${key}`, value);
    await this.redis.expire(`${this.prefix}:${key}`, this.expired);
  };
  isMember = async (key: string, value: string) => {
    const member = await this.redis.sIsMember(`${this.prefix}:${key}`, value);
    return Boolean(member);
  };

  delete = async (key: string, value: string): Promise<void> => {
    await this.redis.sRem(`${this.prefix}:${key}`, value);
  };

  deleteAll = async (keys: string[]): Promise<void> => {
    keys.forEach((key, i, arr) => (arr[i] = `${this.prefix}:${key}`));
    await this.redis.del(keys);
  };
}

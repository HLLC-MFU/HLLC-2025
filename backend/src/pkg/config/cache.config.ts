// cache.config.ts
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { CacheModuleOptions, CacheStoreFactory } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export const cacheConfig = registerAs('cache', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  ttl: parseInt(process.env.CACHE_TTL || '5', 10),
}));

export const cacheConfigValidationSchema = Joi.object({
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  CACHE_TTL: Joi.number().default(5),
});

export const getCacheConfig = async (): Promise<CacheModuleOptions> => {
  const store = (await redisStore({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    ttl: parseInt(process.env.CACHE_TTL || '5', 10) * 1000, // Convert to milliseconds
  })) as unknown as CacheStoreFactory;

  return {
    store,
    isGlobal: true,
  };
};

import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { BullModuleOptions } from '@nestjs/bull';

export const queueConfig = registerAs('queue', () => ({
  redis: {
    host: process.env.BULL_REDIS_HOST || 'localhost',
    port: parseInt(process.env.BULL_REDIS_PORT || '6379', 10),
  },
}));

export const queueConfigValidationSchema = Joi.object({
  BULL_REDIS_HOST: Joi.string().default('localhost'),
  BULL_REDIS_PORT: Joi.number().default(6379),
});

export const getBullConfig = (): BullModuleOptions => ({
  redis: {
    host: process.env.BULL_REDIS_HOST || 'localhost',
    port: parseInt(process.env.BULL_REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
}); 
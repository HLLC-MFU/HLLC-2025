// src/shared/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { AutoCacheInterceptor } from './auto-cache.interceptor';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        url: config.get<string>('REDIS_URI'),
        ttl: 60, // default TTL
      }),
    }),
  ],
  providers: [AutoCacheInterceptor],
  exports: [AutoCacheInterceptor],
})
export class GlobalCacheModule {}

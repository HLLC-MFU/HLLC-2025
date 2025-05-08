import { Global, Module } from '@nestjs/common';
import { CacheStatsService } from './cache-stats.service';

@Global()
@Module({
  providers: [CacheStatsService],
  exports: [CacheStatsService],
})
export class CacheModule {} 
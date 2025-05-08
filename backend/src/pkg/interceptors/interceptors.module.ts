import { Global, Module } from '@nestjs/common';
import { MetadataCacheInterceptor } from './metadata-cache.interceptor';
import { ModuleCacheInterceptor } from './module-cache.interceptor';
import { HttpCacheInterceptor } from './cache.interceptor';

@Global()
@Module({
  providers: [
    MetadataCacheInterceptor,
    ModuleCacheInterceptor,
    HttpCacheInterceptor,
  ],
  exports: [
    MetadataCacheInterceptor,
    ModuleCacheInterceptor,
    HttpCacheInterceptor,
  ],
})
export class InterceptorsModule {} 
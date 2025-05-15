import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CacheStatsService } from '../cache/cache-stats.service';

@Injectable()
export class MetadataCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetadataCacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly cacheStatsService: CacheStatsService
  ) {}

  private readonly METADATA_CACHE_PREFIX = 'metadata:';
  private readonly METADATA_CACHE_TTL = 3600; // 1 hour

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const path = request?.url || request?.path;
    
    if (!path) {
      this.logger.warn('No path found in request, skipping cache check');
      return next.handle();
    }

    const isMetadataEndpoint = this.isMetadataEndpoint(path);
    
    if (!isMetadataEndpoint) {
      return next.handle();
    }

    // Create cache key from path and query parameters
    const cacheKey = this.buildMetadataCacheKey(request);
    this.logger.log(`[Cache] Checking cache for key: ${cacheKey}`);

    try {
      // Check if data is in cache
      const startTime = Date.now();
      const cachedData = await this.cacheManager.get(cacheKey);
      const duration = Date.now() - startTime;
      
      if (cachedData) {
        // Track hit
        this.cacheStatsService.trackCacheHit('metadata', cacheKey, duration, cachedData);
        this.logger.log(`[Cache] HIT for key: ${cacheKey} - Retrieved in ${duration}ms`);
        return of(cachedData);
      }

      // Track miss
      this.cacheStatsService.trackCacheMiss('metadata', cacheKey, duration);
      this.logger.log(`[Cache] MISS for key: ${cacheKey} - Fetching data from database...`);
      
      // If not in cache, fetch data and store in cache
      const startDbTime = Date.now();
      return next.handle().pipe(
        tap(async (data) => {
          const endDbTime = Date.now();
          const dbDuration = endDbTime - startDbTime;
          this.logger.log(`[Cache] Database fetched in ${dbDuration}ms for key: ${cacheKey}`);
          
          const startCacheTime = Date.now();
          await this.cacheManager.set(cacheKey, data, this.METADATA_CACHE_TTL);
          const endCacheTime = Date.now();
          const cacheDuration = endCacheTime - startCacheTime;
          
          // Track set
          this.cacheStatsService.trackCacheSet('metadata', cacheKey, cacheDuration, data);
          this.logger.log(`[Cache] Stored in cache in ${cacheDuration}ms for key: ${cacheKey}`);
        }),
      );
    } catch (error) {
      this.logger.error(`[Cache] Error with cache: ${error.message}`, error.stack);
      return next.handle();
    }
  }

  private isMetadataEndpoint(path: string): boolean {
    // Define which endpoints are metadata
    const metadataEndpoints = [
      '/api/schools',
      '/api/majors',
      '/api/roles',
      // Add other metadata endpoints
    ];
    return metadataEndpoints.some(endpoint => path.startsWith(endpoint));
  }

  private buildMetadataCacheKey(request: any): string {
    const path = request?.url || request?.path || '';
    const query = request?.query || {};
    const method = request?.method || 'GET';
    
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');
    
    return `${this.METADATA_CACHE_PREFIX}${method}:${path}?${queryString}`;
  }

  // Method to invalidate cache when data is updated
  async invalidateCache(pattern: string): Promise<void> {
    this.logger.log(`[Cache] Invalidating cache for pattern: ${pattern}`);
    try {
      const store = this.cacheManager.store as any;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys(`${this.METADATA_CACHE_PREFIX}${pattern}*`);
        this.logger.log(`[Cache] Found ${keys.length} keys to invalidate`);
        
        if (keys && keys.length) {
          const startTime = Date.now();
          for (const key of keys) {
            const delStartTime = Date.now();
            await this.cacheManager.del(key);
            const delEndTime = Date.now();
            const delDuration = delEndTime - delStartTime;
            this.cacheStatsService.trackCacheDel('metadata', key, delDuration);
          }
          const endTime = Date.now();
          
          this.logger.log(`[Cache] Invalidated ${keys.length} keys in ${endTime - startTime}ms`);
          
          // Update timestamp
          await this.cacheManager.set(
            `${this.METADATA_CACHE_PREFIX}${pattern.replace(/^\/api\//, '')}:last_updated`,
            Date.now(),
            this.METADATA_CACHE_TTL
          );
        }
      }
    } catch (error) {
      this.logger.error(`[Cache] Error invalidating cache: ${error.message}`, error.stack);
    }
  }
} 
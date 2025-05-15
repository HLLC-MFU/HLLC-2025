import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  requests: number;
  stores: number;
  deletes: number;
  averageGetTime: number;
  averageSetTime: number;
  totalGetTime: number;
  totalSetTime: number;
  totalDeleteTime: number;
  lastRequest: Date;
  lastHit?: Date | null;
  lastMiss?: Date | null;
}

/**
 * Service that tracks and logs cache performance metrics
 */
interface CacheEvent {
  key: string;
  type: 'get' | 'set' | 'del';
  duration: number;
  timestamp: Date;
  hit?: boolean;
  value?: any;
}

@Injectable()
export class CacheStatsService {
  private readonly logger = new Logger(CacheStatsService.name);
  private stats: Record<string, CacheStats> = {};
  private events: CacheEvent[] = [];
  private readonly MAX_EVENTS = 100;
  private readonly STATS_PRINT_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly STATS_KEY_PREFIX = 'cache_stats:';

  constructor(@Optional() @Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.setupStatsReporting();
    this.logger.log('CacheStatsService initialized');
  }

  private setupStatsReporting() {
    // Periodically print stats to the log
    setInterval(() => {
      this.printCacheStats();
    }, this.STATS_PRINT_INTERVAL);
  }

  trackCacheHit(prefix: string, key: string, duration: number, value?: any) {
    if (!this.stats[prefix]) {
      this.initStats(prefix);
    }

    this.stats[prefix].hits++;
    this.stats[prefix].requests++;
    this.stats[prefix].totalGetTime += duration;
    this.stats[prefix].averageGetTime =
      this.stats[prefix].totalGetTime / this.stats[prefix].requests;
    this.stats[prefix].hitRate =
      this.stats[prefix].hits / this.stats[prefix].requests;
    this.stats[prefix].lastRequest = new Date();
    this.stats[prefix].lastHit = new Date();

    // Log the hit
    this.logger.debug(
      `[Cache] HIT: ${key} in ${duration.toFixed(2)}ms (${prefix})`,
    );

    // Record the event
    this.recordEvent({
      key,
      type: 'get',
      duration,
      timestamp: new Date(),
      hit: true,
      value: typeof value === 'object' ? '[object]' : value,
    });

    // Save stats to cache
    this.saveStatsToCache(prefix);
  }

  trackCacheMiss(prefix: string, key: string, duration: number) {
    if (!this.stats[prefix]) {
      this.initStats(prefix);
    }

    this.stats[prefix].misses++;
    this.stats[prefix].requests++;
    this.stats[prefix].totalGetTime += duration;
    this.stats[prefix].averageGetTime =
      this.stats[prefix].totalGetTime / this.stats[prefix].requests;
    this.stats[prefix].hitRate =
      this.stats[prefix].hits / this.stats[prefix].requests;
    this.stats[prefix].lastRequest = new Date();
    this.stats[prefix].lastMiss = new Date();

    // Log the miss
    this.logger.debug(
      `[Cache] MISS: ${key} in ${duration.toFixed(2)}ms (${prefix})`,
    );

    // Record the event
    this.recordEvent({
      key,
      type: 'get',
      duration,
      timestamp: new Date(),
      hit: false,
    });

    // Save stats to cache
    this.saveStatsToCache(prefix);
  }

  trackCacheSet(prefix: string, key: string, duration: number, value: any) {
    if (!this.stats[prefix]) {
      this.initStats(prefix);
    }

    this.stats[prefix].stores++;
    this.stats[prefix].totalSetTime += duration;
    this.stats[prefix].averageSetTime =
      this.stats[prefix].totalSetTime / this.stats[prefix].stores;
    this.stats[prefix].lastRequest = new Date();

    // Log the set
    this.logger.debug(
      `[Cache] SET: ${key} in ${duration.toFixed(2)}ms (${prefix})`,
    );

    // Record the event
    this.recordEvent({
      key,
      type: 'set',
      duration,
      timestamp: new Date(),
      value: typeof value === 'object' ? '[object]' : value,
    });

    // Save stats to cache
    this.saveStatsToCache(prefix);
  }

  trackCacheDel(prefix: string, key: string, duration: number) {
    if (!this.stats[prefix]) {
      this.initStats(prefix);
    }

    this.stats[prefix].deletes++;
    this.stats[prefix].totalDeleteTime += duration;
    this.stats[prefix].lastRequest = new Date();

    // Log the delete
    this.logger.debug(
      `[Cache] DEL: ${key} in ${duration.toFixed(2)}ms (${prefix})`,
    );

    // Record the event
    this.recordEvent({
      key,
      type: 'del',
      duration,
      timestamp: new Date(),
    });

    // Save stats to cache
    this.saveStatsToCache(prefix);
  }

  private initStats(key: string) {
    this.stats[key] = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      requests: 0,
      stores: 0,
      deletes: 0,
      averageGetTime: 0,
      averageSetTime: 0,
      totalGetTime: 0,
      totalSetTime: 0,
      totalDeleteTime: 0,
      lastRequest: new Date(),
      lastHit: null,
      lastMiss: null,
    };
  }

  private recordEvent(event: CacheEvent) {
    // Keep a limited history of events
    this.events.unshift(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.pop();
    }
  }

  private getCacheStatsKey(prefix: string): string {
    return `${this.STATS_KEY_PREFIX}${prefix}`;
  }

  private async saveStatsToCache(key: string) {
    if (this.cacheManager) {
      const cacheKey = this.getCacheStatsKey(key);
      try {
        await this.cacheManager.set(cacheKey, this.stats[key], 0); // No TTL
      } catch (error) {
        this.logger.error(`Error saving stats to cache: ${error.message}`);
      }
    }
  }

  printCacheStats() {
    this.logger.log('Cache Statistics:');

    const totalStats = {
      hits: 0,
      misses: 0,
      requests: 0,
      stores: 0,
      deletes: 0,
    };

    for (const [prefix, stats] of Object.entries(this.stats)) {
      totalStats.hits += stats.hits;
      totalStats.misses += stats.misses;
      totalStats.requests += stats.requests;
      totalStats.stores += stats.stores;
      totalStats.deletes += stats.deletes;

      this.logger.log(
        `[Cache] ${prefix}: ` +
          `Hits: ${stats.hits}, ` +
          `Misses: ${stats.misses}, ` +
          `Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%, ` +
          `Avg Get Time: ${stats.averageGetTime.toFixed(2)}ms, ` +
          `Avg Set Time: ${stats.averageSetTime.toFixed(2)}ms`,
      );
    }

    const totalHitRate =
      totalStats.requests > 0
        ? (totalStats.hits / totalStats.requests) * 100
        : 0;

    this.logger.log(
      `[Cache] Overall: ` +
        `Hits: ${totalStats.hits}, ` +
        `Misses: ${totalStats.misses}, ` +
        `Hit Rate: ${totalHitRate.toFixed(2)}%, ` +
        `Requests: ${totalStats.requests}, ` +
        `Stores: ${totalStats.stores}, ` +
        `Deletes: ${totalStats.deletes}`,
    );
  }

  getCacheStats() {
    return { ...this.stats };
  }

  getRecentEvents(limit = 20) {
    return this.events.slice(0, limit);
  }

  resetStats() {
    this.stats = {};
    this.events = [];
    this.logger.log('Cache statistics reset');
  }

  async getCacheKeysCount(): Promise<Record<string, number>> {
    if (!this.cacheManager) {
      return {};
    }

    const result: Record<string, number> = {};
    try {
      const store = this.cacheManager.store as any;
      if (store && typeof store.keys === 'function') {
        const patterns = [
          'metadata:*',
          'users:*',
          'schools:*',
          'majors:*',
          'roles:*',
          'activities:*',
        ];

        for (const pattern of patterns) {
          const keys = await store.keys(pattern);
          if (keys) {
            result[pattern] = keys.length;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error getting cache keys count: ${error.message}`);
    }

    return result;
  }
}

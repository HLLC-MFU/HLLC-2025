import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

// ✅ ป้องกัน any: กำหนด type แบบ generic ที่ปลอดภัย
type SafeCacheValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>;

@Injectable()
export class CacheService {
  private readonly l1 = new Map<
    string,
    { value: SafeCacheValue; expireAt: number }
  >();
  private readonly l1TTL = 5_000; // 5 seconds

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly l2: Cache & { reset?: () => Promise<void> },
  ) {}

  async get<T extends SafeCacheValue = SafeCacheValue>(
    key: string,
  ): Promise<T | undefined> {
    const entry = this.l1.get(key);
    if (entry && entry.expireAt > Date.now()) return entry.value as T;

    const l2Value = await this.l2.get<T>(key);
    if (l2Value !== undefined && l2Value !== null) {
      this.l1.set(key, { value: l2Value, expireAt: Date.now() + this.l1TTL });
    }
    return l2Value === null ? undefined : l2Value;
  }

  async set<T extends SafeCacheValue = SafeCacheValue>(
    key: string,
    value: T,
    ttl = this.l1TTL,
  ): Promise<void> {
    this.l1.set(key, { value, expireAt: Date.now() + this.l1TTL });
    await this.l2.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    this.l1.delete(key);
    await this.l2.del(key);
  }

  async reset(): Promise<void> {
    this.l1.clear();

    if ('reset' in this.l2 && typeof this.l2.reset === 'function') {
      await this.l2.reset(); // ✅ แก้ type error
    }
  }
}

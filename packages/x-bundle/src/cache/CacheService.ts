import { Inject, Service } from "@bluelibs/core";
import { CACHE_CONFIG } from "../constants";
import { CacheOptions } from "./defs";
import * as CacheManager from "cache-manager";
import { LoggerService } from "@bluelibs/logger-bundle";

@Service()
export class CacheService {
  private cacheManager;

  constructor(
    @Inject(CACHE_CONFIG) private config,
    protected readonly logger: LoggerService
  ) {
    this.cacheManager = CacheManager.caching({
      store: this.config.store,
      ...this.config.storeConfig,
    });
  }

  async set(key: string, data: any, options: CacheOptions) {
    await this.cacheManager.set(
      key,
      {
        data,
        syncedAt: Date.now(),
        ttl: options.ttl,
        refresh: options.refresh,
      },
      { ttl: options.ttl }
    );
  }

  async get(key: string) {
    const cachedData = await this.cacheManager.get(key);
    if (!cachedData) return { found: false, data: undefined };

    if (cachedData && cachedData.refresh) {
      await this.set(key, cachedData.data, {
        ttl: cachedData.ttl,
        refresh: true,
      });
    }
    this.logger.info("Cached Data:", {
      syncedAt: cachedData.syncedAt,
      ttl: cachedData.ttl,
      refresh: cachedData.refresh,
      key: key,
    });

    return { found: true, data: cachedData.data };
  }
  async keys() {
    return await this.cacheManager.keys();
  }
}

import { Inject, Service } from "@bluelibs/core";
import { CACHE_CONFIG } from "../constants";
import { CacheOptions } from "./defs";
import * as CacheManager from "cache-manager";
import { LoggerService } from "@bluelibs/logger-bundle";
import * as Hash from "node-object-hash";
const Hasher = Hash({ sort: true, coerce: true });

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

  generateCacheKey(ctx, ast, options?: CacheOptions): string {
    let keyBody: any = (({
      fieldName,
      fieldNodes,
      returnType,
      parentType,
      variableValues,
    }) => ({
      fieldName,
      fieldNodes,
      returnType,
      parentType,
      variableValues,
    }))(ast);
    if (options && options.contextBoundness)
      keyBody = this.addUserBoundnessFieldsToKeyObject(
        options.userBoundnessFields,
        keyBody,
        ctx
      );

    return Hasher.hash(keyBody);
  }

  configureOptions(ctx, options?): CacheOptions {
    options = {
      ...this.config.resolverDefaultConfig,
      ...options,
    };
    if (options.expirationBoundness)
      options.ttl = this.calculateTtlWithExpirationBoundness(options, ctx);
    return options;
  }

  calculateTtlWithExpirationBoundness(options: CacheOptions, ctx): number {
    let expirationTtl;
    if (typeof ctx[options.expirationBoundnessField] === "number")
      expirationTtl = ctx[options.expirationBoundnessField];
    else if (ctx[options.expirationBoundnessField] instanceof Date) {
      expirationTtl =
        (new Date(ctx[options.expirationBoundnessField]).getTime() -
          Date.now()) /
        1000;
    }
    if (!expirationTtl) return options.ttl;
    return Math.min(options.ttl, expirationTtl);
  }

  addUserBoundnessFieldsToKeyObject(
    userBoundnessFields: string[],
    objectBody,
    ctx
  ) {
    userBoundnessFields.map((key) => (objectBody[key] = ctx[key]));
    return objectBody;
  }
}

import { CacheOptions } from "../cache/defs";
import { CACHE_SERVICE_TOKEN } from "../constants";

export function Cache<T>(
  actions: ((_: any, args: any, ctx: any, ast: any) => Promise<any>)[],
  options?: CacheOptions
) {
  return async function (_, args, ctx, ast) {
    //get cacheService
    const cacheService = ctx.container.get(CACHE_SERVICE_TOKEN);

    //configure right options between default and specifiq
    options = cacheService.configureOptions(ctx, options);

    //generate cache key
    const cacheKey = cacheService.generateCacheKey(options, ctx, ast);

    let result = await cacheService.get(cacheKey);

    if (result && result.found) return result.data;

    for (const action of actions) {
      result = await action(_, args, ctx, ast);
    }
    await cacheService.set(cacheKey, result, options);

    return result;
  };
}

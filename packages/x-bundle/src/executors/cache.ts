import { CacheOptions } from "../cache/defs";
import { CACHE_SERVICE_TOKEN } from "../constants";
import { IGraphQLContext } from "@bluelibs/graphql-bundle";

type CacheLookup = { found: boolean; data: unknown };

export function Cache<_T>(
  actions: ((
    _: unknown,
    args: unknown,
    ctx: IGraphQLContext,
    ast: unknown
  ) => Promise<unknown>)[],
  options?: CacheOptions
) {
  return async function (_, args, ctx, ast) {
    //get cacheService
    const cacheService = ctx.container.get(CACHE_SERVICE_TOKEN);

    //configure right options between default and specifiq
    options = cacheService.configureOptions(ctx, options);

    //generate cache key
    const cacheKey = cacheService.generateCacheKey(options, ctx, ast);

    let result: unknown = await cacheService.get(cacheKey);
    const lookup = result as CacheLookup;

    if (lookup && lookup.found) return lookup.data;

    for (const action of actions) {
      result = await action(_, args, ctx, ast);
    }
    await cacheService.set(cacheKey, result, options);

    return result;
  };
}

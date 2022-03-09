import { createEcosystem } from "./createEcosystem";
import { ContainerInstance, Kernel } from "@bluelibs/core";
import { CACHE_SERVICE_TOKEN } from "./../..";
import { CacheService } from "./../../cache/CacheService";
import { CACHE_CONFIG } from "../../constants";
import { Cache } from "./../../executors/cache";

describe("cache manager tests get/set", () => {
  let container: ContainerInstance;
  let cacheService: CacheService;

  beforeAll(async () => {
    container = await createEcosystem();
    cacheService = container.get(CACHE_SERVICE_TOKEN);
  });

  afterAll(async () => {
    await container.get(Kernel).shutdown();
  });
  const sleep = (sleepTime) =>
    new Promise((resolve) => setTimeout(resolve, sleepTime));

  describe("cacheService getter/setter", () => {
    let data = { a: 1, b: 2 },
      key = "key",
      refresh = true,
      ttl = 1;

    beforeAll(async () => {
      await cacheService.set(key, data, { ttl, refresh });
    });

    it("should get cache before ttl expires", async () => {
      await sleep(0.5 * ttl * 1000);
      const result = await cacheService.get(key);
      expect(result.data).toEqual(data);
      expect(result.found).toEqual(true);
    });
    it("it should get refreshed by the previous cache get", async () => {
      await sleep(0.9 * ttl * 1000);
      await cacheService.get(key);
      await sleep(0.5 * ttl * 1000);
      const result = await cacheService.get(key);
      expect(result.data).toEqual(data);
      expect(result.found).toEqual(true);
    });
    it("it shouldn't get cache after ttl expires", async () => {
      await sleep(1.2 * ttl * 1000);
      const result = await cacheService.get(key);
      expect(result.data).toEqual(undefined);
      expect(result.found).toEqual(false);
      return;
    });
  });

  describe("cach executor methods", () => {
    let count, ctx, ast, defaultResolverOptions, options, expiredAt, userId;
    beforeEach(async () => {
      defaultResolverOptions =
        container.get(CACHE_CONFIG).resolverDefaultConfig;
      ast = {
        fieldName: "test",
        fieldNodes: [],
        returnType: "any",
        parentType: [],
        variableValues: {},
      };
      ctx = { userId, expiredAt, container };
      count = 0;
    });

    describe("configureOptions: method that responsible of ttl refresh and expiration boundness ", () => {
      it("should return default options in case of undefined options", () => {
        expect(cacheService.configureOptions(ctx)).toEqual(
          defaultResolverOptions
        );
      });
      it("shoudl prioritize options fields over default one", () => {
        expect(
          cacheService.configureOptions(ctx, {
            ttl: defaultResolverOptions + 1,
          })
        ).toEqual({
          ...defaultResolverOptions,
          ttl: defaultResolverOptions + 1,
        });
      });
      it("shouldchange ttl if expirationboundness is inferior", () => {
        ctx.expiredAt = defaultResolverOptions.ttl - 1;
        expect(
          cacheService.configureOptions(ctx, {
            expirationBoundness: true,
            expirationBoundnessField: "expiredAt",
          }).ttl
        ).toEqual(defaultResolverOptions.ttl - 1);
      });
    });
    describe("generateCacheKey", () => {
      it("test with default options", () => {
        expect(cacheService.generateCacheKey(ctx, ast)).toEqual(
          cacheService.generateCacheKey(ctx, ast)
        );
      });
      it("test if fields fields order affect key generation", () => {
        expect(
          cacheService.generateCacheKey(ctx, { a: 1, b: { c: 1, d: 2 } })
        ).toEqual(
          cacheService.generateCacheKey(ctx, { b: { d: 2, c: 1 }, a: 1 })
        );
      });
      it("test with userBoundnessFields in options", () => {
        expect(
          cacheService.addUserBoundnessFieldsToKeyObject(
            ["c", "d"],
            { a: 1, b: 2 },
            { c: 3, d: 4 }
          )
        ).toEqual({ a: 1, b: 2, c: 3, d: 4 });
        expect(
          cacheService.generateCacheKey(ctx, ast) !==
            cacheService.generateCacheKey(ctx, ast, {
              contextBoundness: true,
              userBoundnessFields: ["userId"],
            })
        ).toEqual(true);
      });
    });
    describe("calculateTtlWithExpirationBoundness", () => {
      let testOptions;
      beforeEach(async () => {
        testOptions = {
          expirationBoundnessField: "expiredAt",
          ttl: defaultResolverOptions.ttl,
        };
        delete ctx.expiredAt;
      });
      it("when expiredAt null or not date or number return ttl", () => {
        expect(
          cacheService.calculateTtlWithExpirationBoundness(testOptions, ctx)
        ).toEqual(defaultResolverOptions.ttl);
        ctx.expiredAt = "";
        expect(
          cacheService.calculateTtlWithExpirationBoundness(testOptions, ctx)
        ).toEqual(defaultResolverOptions.ttl);
      });
      it("when ttl <expiredAt", () => {
        ctx.expiredAt = defaultResolverOptions.ttl + 1;
        expect(
          cacheService.calculateTtlWithExpirationBoundness(testOptions, ctx)
        ).toEqual(defaultResolverOptions.ttl);
        ctx.expiredAt = Date.now() + 2 * defaultResolverOptions.ttl;
        expect(
          cacheService.calculateTtlWithExpirationBoundness(testOptions, ctx)
        ).toEqual(defaultResolverOptions.ttl);
      });
      it("when ttl >expiredAt", () => {
        ctx.expiredAt = defaultResolverOptions.ttl - 1;
        expect(
          cacheService.calculateTtlWithExpirationBoundness(testOptions, ctx)
        ).toEqual(ctx.expiredAt);
        ctx.expiredAt = new Date(Date.now() + 3000);
        expect(
          cacheService.calculateTtlWithExpirationBoundness(testOptions, ctx) !==
            defaultResolverOptions.ttl
        ).toEqual(true);
      });
    });
    describe("test X.cache", () => {
      test("test", async () => {
        const mockedFunction = jest.fn().mockImplementation(() => {
          count++;
          return count;
        });
        const mainAction = async (_: any, args: any, ctx: any, ast: any) => {
          return await mockedFunction();
        };
        const actions = [mainAction, mainAction];
        const XCACHE = Cache(actions, defaultResolverOptions);
        let data = await XCACHE(undefined, {}, ctx, ast);
        // the 2 actions will increment count by 2
        expect(data).toEqual(actions.length);
        expect(mockedFunction).toBeCalledTimes(2);
        //the second run shoudl activate the cache
        data = await XCACHE(undefined, {}, ctx, ast);
        // the results is the previous 2 but the actions are not called
        expect(data).toEqual(actions.length);
        expect(mockedFunction).toBeCalledTimes(2);
      });
    });
  });
});

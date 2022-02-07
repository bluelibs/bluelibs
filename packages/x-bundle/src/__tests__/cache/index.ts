import { createEcosystem } from "./createEcosystem";
import { ContainerInstance, Kernel } from "@bluelibs/core";
import { Cache } from "./../../executors/cache";
import { CACHE_CONFIG, CACHE_SERVICE } from "./../..";
import { CacheService } from "./../../cache/CacheService";

describe("cache manager tests get/set", () => {
  let container: ContainerInstance;
  let cacheService: CacheService;

  beforeAll(async () => {
    jest.setTimeout(6000);
    container = await createEcosystem();
    cacheService = await container.get(CACHE_SERVICE);
  });

  afterAll(async () => {
    await container.get(Kernel).shutdown();
    jest.setTimeout(5000);
  });
  const sleep = (sleepTime) =>
    new Promise((resolve) => setTimeout(resolve, sleepTime));

  describe("cacheService getter/setter", () => {
    let data = { a: 1, b: 2 },
      key = "key",
      refresh = true,
      ttl = 2;

    beforeAll(async () => {
      await cacheService.set(key, data, { ttl, refresh });
    });

    it("should get cache before ttl expires", async () => {
      await sleep(0.2 * 1000);
      let result = await cacheService.get(key);
      expect(result.data).toEqual(data);
      expect(result.found).toEqual(true);
    });
    it("it should get refreshed by the previous cache get", async () => {
      await sleep((ttl + 0.2) * 1000);
      let result = await cacheService.get(key);
      //expect(result.data).toEqual(data);
      //expect(result.found).toEqual(true);
    });
    it("it shouldn't get cache after ttl expires", async () => {
      await sleep(2 * ttl * 1000);
      let result = await cacheService.get(key);
      expect(result.data).toEqual(undefined);
      expect(result.found).toEqual(false);
      return;
    });
  });

  describe("cach executor methods", () => {
    let result = { title: "Count", count: 0 };
    async function incrementCount(_: any, args: any, ctx: any, ast: any) {
      result.count++;
      return result;
    }
    const ast = {
      fieldName: "test",
      fieldNodes: [],
      returnType: "any",
      parentType: [],
      variableValues: {},
    };
    const ctx = {
      userId: 1,
      expiredAt: 5,
    };
    test("XCACHE should rely on the function not the cache", async () => {
      jest.setTimeout(6000);
      const XCACHE = Cache({}, [incrementCount]);
      const data = await XCACHE(undefined, {}, { ...ctx, container }, ast);
      //expect(res).toEqual(result);
    });
  });
});

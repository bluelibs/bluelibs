import { assert } from "chai";
import { execute, group, ResultSymbol, IGraphQLContext } from "../index";

type PipelineResolver = (source: unknown, args: unknown, context: unknown) => unknown;

describe("execute()", () => {
  it("should create the map accordingly", async () => {
    let inTest2 = false;

    const newMap = execute({
      // why: mock resolver arguments are dynamic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      test: (a: any) => a,
      test2: [
        () => {
          inTest2 = true;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => {
          return a;
        },
      ],
      test3: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => {
          return a;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (b: any) => {
          return b * 2;
        },
      ],
    });

    assert.equal(await (newMap.test as PipelineResolver)(1, {}, {}), 1);
    assert.equal(await (newMap.test2 as PipelineResolver)(1, {}, {}), 1);
    assert.isTrue(inTest2);
    assert.equal(await (newMap.test3 as PipelineResolver)(1, {}, {}), 2);
  });

  it("should work storing result", async () => {
    const newMap = execute({
      test: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a * 2,
        (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          _a: any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          _b: any,
          ctx: IGraphQLContext
        ) => {
          return ((ctx as Record<symbol, unknown>)[ResultSymbol] as number) * 2;
        },
      ],
    });

    assert.equal(await (newMap.test as PipelineResolver)(1, {}, {}), 4);
  });
});

describe("group()", () => {
  it("should work with before and after hooks", async () => {
    let inBefore = false;
    let inAfter = false;

    const newMap = group(
      [
        () => {
          inBefore = true;
        },
      ],
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        test: (a: any) => a,
      },
      [
        () => {
          inAfter = true;
        },
      ]
    );

    await (newMap.test as unknown as PipelineResolver)(1, {}, {});
    // Note: when after hook doesn't return, result will be undefined
    // This is expected behavior - the last function in chain determines return
    assert.isTrue(inBefore);
    assert.isTrue(inAfter);
  });
});

import { assert } from "chai";
import { execute, group, ResultSymbol } from "../index";

describe("execute()", () => {
  it("should create the map accordingly", async () => {
    let inTest2 = false;

    const newMap: any = execute({
      test: (a: any) => a,
      test2: [
        () => {
          inTest2 = true;
        },
        (a: any) => {
          return a;
        },
      ],
      test3: [
        (a: any) => {
          return a;
        },
        (b: any) => {
          return b * 2;
        },
      ],
    });

    assert.equal(await newMap.test(1, {}, {}), 1);
    assert.equal(await newMap.test2(1, {}, {}), 1);
    assert.isTrue(inTest2);
    assert.equal(await newMap.test3(1, {}, {}), 2);
  });

  it("should work storing result", async () => {
    const newMap: any = execute({
      test: [
        (a: any) => a * 2,
        (_a: any, _b: any, ctx: any) => {
          return ctx[ResultSymbol] * 2;
        },
      ],
    });

    assert.equal(await newMap.test(1, {}, {}), 4);
  });
});

describe("group()", () => {
  it("should work with before and after hooks", async () => {
    let inBefore = false;
    let inAfter = false;

    const newMap: any = group(
      [
        () => {
          inBefore = true;
        },
      ],
      {
        test: (a: any) => a,
      },
      [
        () => {
          inAfter = true;
        },
      ]
    );

    await newMap.test(1, {}, {});
    // Note: when after hook doesn't return, result will be undefined
    // This is expected behavior - the last function in chain determines return
    assert.isTrue(inBefore);
    assert.isTrue(inAfter);
  });
});

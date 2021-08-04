import { assert } from "chai";
import { execute, group, ResultSymbol } from "../index";

describe("execute()", () => {
  it("should create the map accordingly", async () => {
    let inTest2 = false;

    const newMap: any = execute({
      test: a => a,
      test2: [
        () => {
          inTest2 = true;
        },
        a => {
          return a;
        },
      ],
      test3: [
        a => {
          return a;
        },
        b => {
          return b * 2;
        },
      ],
    });

    assert.equal(await newMap.test(1, {}, {}), 1);
    assert.equal(await newMap.test2(1, {}, {}), 1);
    assert.isTrue(inTest2);
    assert.equal(await newMap.test3(1, {}, {}), 2);
  });

  it("should work bundling", async () => {
    let inBefore = false;
    let inExecution = false;
    let inAfter = false;
    const map: any = group(
      [() => (inBefore = true)],
      {
        doSomething: () => {
          inExecution = true;
        },
      },
      [() => (inAfter = true)]
    );

    await map.doSomething(null, {}, {});

    assert.isTrue(inExecution);
    assert.isTrue(inBefore);
    assert.isTrue(inAfter);
  });

  it("should work bundling arrays with additionals", async () => {
    let inBefore = false;
    let inExecution = false;
    let inAfter = false;
    const map: any = group(
      [],
      {
        doSomething: [
          () => (inBefore = true),
          () => {
            inExecution = true;
          },
          () => (inAfter = true),
        ],
      },
      []
    );

    await map.doSomething(null, {}, {});

    assert.isTrue(inExecution);
    assert.isTrue(inBefore);
    assert.isTrue(inAfter);
  });

  it("should work storing result", async () => {
    const newMap: any = execute({
      test: [
        a => a * 2,
        (a, b, ctx) => {
          return ctx[ResultSymbol] * 2;
        },
      ],
    });

    assert.equal(await newMap.test(1, {}, {}), 4);
  });
});

import { assert } from "chai";
import { mergeDeep } from "../../utils/mergeDeep";

describe("mergeDeep", () => {
  it("should merge object properly", () => {
    const target: any = {};
    const obj1 = {
      a: {
        a1: 1,
        b: {
          b1: 1,
        },
      },
    };
    const obj2 = {
      a: {
        a2: 1,
        b: {
          b2: 1,
        },
      },
    };

    mergeDeep(target, obj1, obj2);

    assert.equal(target.a.a1, 1);
    assert.equal(target.a.a2, 1);
    assert.equal(target.a.b.b1, 1);
    assert.equal(target.a.b.b2, 1);
  });

  it("should work when extending a string", () => {
    // when the target type is a string or primitive, and the other is an object, the object should override it.
    const target: any = {};
    const obj1 = {
      a: "abc",
    };
    const obj2 = {
      a: {
        a1: 1,
      },
    };

    mergeDeep(target, obj1, obj2);

    assert.equal(target.a.a1, 1);
  });
});

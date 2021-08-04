import { EJSON } from "../ejson";
import * as EJSONTest from "./custom_model";
import { assert } from "chai";
import { ObjectId } from "..";
import { toModel } from "../toModel";

test("ejson - keyOrderSensitive", () => {
  assert.isTrue(
    EJSON.equals(
      {
        a: { b: 1, c: 2 },
        d: { e: 3, f: 4 },
      },
      {
        d: { f: 4, e: 3 },
        a: { c: 2, b: 1 },
      }
    )
  );

  assert.isFalse(
    EJSON.equals(
      {
        a: { b: 1, c: 2 },
        d: { e: 3, f: 4 },
      },
      {
        d: { f: 4, e: 3 },
        a: { c: 2, b: 1 },
      },
      { keyOrderSensitive: true }
    )
  );

  assert.isFalse(
    EJSON.equals(
      {
        a: { b: 1, c: 2 },
        d: { e: 3, f: 4 },
      },
      {
        a: { c: 2, b: 1 },
        d: { f: 4, e: 3 },
      },
      { keyOrderSensitive: true }
    )
  );
  assert.isFalse(
    EJSON.equals({ a: {} }, { a: { b: 2 } }, { keyOrderSensitive: true })
  );
  assert.isFalse(
    EJSON.equals({ a: { b: 2 } }, { a: {} }, { keyOrderSensitive: true })
  );
});

test("ejson - nesting and literal", () => {
  const d = new Date();
  const obj = { $date: d };
  const eObj = EJSON.toJSONValue(obj);
  const roundTrip = EJSON.fromJSONValue(eObj);
  assert.deepEqual(obj, roundTrip);
});

test("ejson - some equality tests", () => {
  assert.isTrue(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, b: 2 }));
  assert.isFalse(EJSON.equals({ a: 1, b: 2 }, { a: 1, c: 3, b: 2 }));
  assert.isFalse(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 }));
  assert.isFalse(EJSON.equals({ a: 1, b: 2, c: 3 }, { a: 1, c: 3, b: 4 }));
  assert.isFalse(EJSON.equals({ a: {} }, { a: { b: 2 } }));
  assert.isFalse(EJSON.equals({ a: { b: 2 } }, { a: {} }));
});

test("ejson - equality and falsiness", () => {
  assert.isTrue(EJSON.equals(null, null));
  assert.isTrue(EJSON.equals(undefined, undefined));
  assert.isFalse(EJSON.equals({ foo: "foo" }, null));
  assert.isFalse(EJSON.equals(null, { foo: "foo" }));
  assert.isFalse(EJSON.equals(undefined, { foo: "foo" }));
  assert.isFalse(EJSON.equals({ foo: "foo" }, undefined));
});

test("ejson - NaN and Inf", () => {
  assert.equal(EJSON.parse('{"$InfNaN": 1}'), Infinity);
  assert.equal(EJSON.parse('{"$InfNaN": -1}'), -Infinity);
  assert.isTrue(Number.isNaN(EJSON.parse('{"$InfNaN": 0}')));
  assert.equal(EJSON.parse(EJSON.stringify(Infinity)), Infinity);
  assert.equal(EJSON.parse(EJSON.stringify(-Infinity)), -Infinity);
  assert.isTrue(Number.isNaN(EJSON.parse(EJSON.stringify(NaN))));
  assert.isTrue(EJSON.equals(NaN, NaN));
  assert.isTrue(EJSON.equals(Infinity, Infinity));
  assert.isTrue(EJSON.equals(-Infinity, -Infinity));
  assert.isFalse(EJSON.equals(Infinity, -Infinity));
  assert.isFalse(EJSON.equals(Infinity, NaN));
  assert.isFalse(EJSON.equals(Infinity, 0));
  assert.isFalse(EJSON.equals(NaN, 0));

  assert.isTrue(
    EJSON.equals(EJSON.parse('{"a": {"$InfNaN": 1}}'), { a: Infinity })
  );
  assert.isTrue(EJSON.equals(EJSON.parse('{"a": {"$InfNaN": 0}}'), { a: NaN }));
});

test("ejson - clone", () => {
  const cloneTest = (x, identical?) => {
    const y = EJSON.clone(x);
    assert.isTrue(EJSON.equals(x, y));
    assert.equal(x === y, !!identical);
  };
  cloneTest(null, true);
  cloneTest(undefined, true);
  cloneTest(42, true);
  cloneTest("asdf", true);
  cloneTest([1, 2, 3]);
  cloneTest([1, "fasdf", { foo: 42 }]);
  cloneTest({ x: 42, y: "asdf" });

  function testCloneArgs(...args) {
    const clonedArgs = EJSON.clone(args);
    const shouldBe = [1, 2, "foo", [4]];
    assert.isTrue(clonedArgs.length === shouldBe.length);
    clonedArgs.forEach((arg, idx) => {
      assert.deepEqual(clonedArgs[idx], shouldBe[idx]);
    });
  }
  testCloneArgs(1, 2, "foo", [4]);
});

test("ejson - stringify", () => {
  assert.equal(EJSON.stringify(null), "null");
  assert.equal(EJSON.stringify(true), "true");
  assert.equal(EJSON.stringify(false), "false");
  assert.equal(EJSON.stringify(123), "123");
  assert.equal(EJSON.stringify("abc"), '"abc"');

  assert.equal(EJSON.stringify([1, 2, 3]), "[1,2,3]");
  assert.equal(
    EJSON.stringify([1, 2, 3], { indent: true }),
    "[\n  1,\n  2,\n  3\n]"
  );
  assert.equal(EJSON.stringify([1, 2, 3], { canonical: false }), "[1,2,3]");
  assert.equal(
    EJSON.stringify([1, 2, 3], { indent: true, canonical: false }),
    "[\n  1,\n  2,\n  3\n]"
  );

  assert.equal(
    EJSON.stringify([1, 2, 3], { indent: 4 }),
    "[\n    1,\n    2,\n    3\n]"
  );
  assert.equal(
    EJSON.stringify([1, 2, 3], { indent: "--" }),
    "[\n--1,\n--2,\n--3\n]"
  );

  assert.equal(
    EJSON.stringify({ b: [2, { d: 4, c: 3 }], a: 1 }, { canonical: true }),
    '{"a":1,"b":[2,{"c":3,"d":4}]}'
  );
  assert.equal(
    EJSON.stringify(
      { b: [2, { d: 4, c: 3 }], a: 1 },
      {
        indent: true,
        canonical: true,
      }
    ),
    "{\n" +
      '  "a": 1,\n' +
      '  "b": [\n' +
      "    2,\n" +
      "    {\n" +
      '      "c": 3,\n' +
      '      "d": 4\n' +
      "    }\n" +
      "  ]\n" +
      "}"
  );
  assert.equal(
    EJSON.stringify({ b: [2, { d: 4, c: 3 }], a: 1 }, { canonical: false }),
    '{"b":[2,{"d":4,"c":3}],"a":1}'
  );
  assert.deepEqual(
    EJSON.stringify(
      { b: [2, { d: 4, c: 3 }], a: 1 },
      { indent: true, canonical: false }
    ),
    "{\n" +
      '  "b": [\n' +
      "    2,\n" +
      "    {\n" +
      '      "d": 4,\n' +
      '      "c": 3\n' +
      "    }\n" +
      "  ],\n" +
      '  "a": 1\n' +
      "}"
  );
});

test("ejson - parse", () => {
  const parsed = EJSON.parse("[1,2,3]");
  assert.isTrue(parsed.length === 3);
  assert.isTrue(parsed[0] === 1);
  assert.isTrue(parsed[1] === 2);
  assert.isTrue(parsed[2] === 3);

  assert.throws(() => {
    EJSON.parse(null);
  }, /argument should be a string/);
});

test("ejson - regexp", () => {
  assert.deepEqual(EJSON.stringify(/foo/gi), '{"$regexp":"foo","$flags":"gi"}');
  var d = new RegExp("foo", "gi");
  var obj = { $regexp: "foo", $flags: "gi" };

  var eObj = EJSON.toJSONValue(obj);
  var roundTrip = EJSON.fromJSONValue(eObj);
  assert.deepEqual(obj, roundTrip);
});

test("ejson - custom types", () => {
  const testSameConstructors = (someObj, compareWith) => {
    assert.equal(someObj.constructor, compareWith.constructor);
    if (typeof someObj === "object") {
      Object.keys(someObj).forEach((key) => {
        const value = someObj[key];
        testSameConstructors(value, compareWith[key]);
      });
    }
  };

  const testReallyEqual = (someObj, compareWith) => {
    assert.deepEqual(someObj, compareWith);
    testSameConstructors(someObj, compareWith);
  };

  const testRoundTrip = (someObj) => {
    const str = EJSON.stringify(someObj);
    const roundTrip = EJSON.parse(str);
    testReallyEqual(someObj, roundTrip);
  };

  const testCustomObject = (someObj) => {
    testRoundTrip(someObj);
    testReallyEqual(someObj, EJSON.clone(someObj));
  };

  const a = new EJSONTest.Address("Montreal", "Quebec");
  testCustomObject({ address: a });
  // Test that difference is detected even if they
  // have similar toJSONValue results:
  const nakedA = { city: "Montreal", state: "Quebec" };
  assert.notEqual(nakedA, a);
  assert.notEqual(a, nakedA as EJSONTest.Address);
  const holder = new EJSONTest.Holder(nakedA);
  assert.deepEqual(holder.toJSONValue(), a.toJSONValue()); // sanity check
  // @ts-ignore
  assert.notEqual(holder, a);
  // @ts-ignore
  assert.notEqual(a, holder as EJSONTest.Holder);

  const d = new Date();
  const obj = new EJSONTest.Person("John Doe", d, a);
  testCustomObject(obj);

  // Test clone is deep:
  const clone = EJSON.clone(obj);
  clone.address.city = "Sherbrooke";
  assert.notEqual(obj, clone);
});

// Verify objects with a property named "length" can be handled by the EJSON
// API properly (see https://github.com/meteor/meteor/issues/5175).
test('ejson - handle objects with properties named "length"', () => {
  class Widget {
    length: number;

    constructor() {
      this.length = 10;
    }
  }
  const widget = new Widget();

  const toJsonWidget = EJSON.toJSONValue(widget);
  assert.equal(widget.length, toJsonWidget.length);

  const fromJsonWidget = EJSON.fromJSONValue(widget);
  assert.equal(widget.length, fromJsonWidget.length);

  const stringifiedWidget = EJSON.stringify(widget);
  assert.deepEqual(stringifiedWidget, '{"length":10}');

  const parsedWidget = EJSON.parse('{"length":10}');
  assert.equal(10, parsedWidget.length);

  assert.isFalse(EJSON.isBinary(widget));

  const widget2 = new Widget();

  const clonedWidget = EJSON.clone(widget);

  assert.deepEqual(widget, clonedWidget);
});

test("should work with objectid and plainToClass", () => {
  class A {
    id;
  }
  const obj = {
    id: new ObjectId(),
  };
  const instance = toModel(A, obj);
  expect(instance).toBeInstanceOf(A);
  expect(instance.id.toString()).toEqual(obj.id.toString());
});

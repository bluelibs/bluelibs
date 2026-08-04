# @bluelibs/ejson

[![npm version](https://badge.fury.io/js/%40bluelibs%2Fejson.svg)](https://badge.fury.io/js/%40bluelibs%2Fejson)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A powerful, TypeScript-first implementation of Extended JSON (EJSON), inspired by Meteor's original. `@bluelibs/ejson` allows you to effortlessly serialize and deserialize complex JavaScript types that standard `JSON` just can't handle.**

Stop losing type information when you communicate with APIs or store data. Keep your `Date`, `RegExp`, `Buffer`, `ObjectId`, and even your own custom classes intact across the wire.

---

## Key Features

- **✅ Type Safety:** Preserves important JS types like `Date`, `RegExp`, `Buffer`, and `Map`.
- **🚀 Performance Tuned:** Optimized for speed, with parsing performance significantly better than other EJSON libraries.
- **🗿 MongoDB Ready:** Natively handles `ObjectId` and `Binary` types for seamless database integration.
- **🔧 Extensible:** Easily add support for your own custom classes.
- **🔷 TypeScript First:** Written entirely in TypeScript for a great developer experience.
- **`toModel` Utility:** Includes a handy utility for transforming plain objects into class instances.

---

## Installation

```bash
npm install @bluelibs/ejson
```

---

## Quick Start

See how easy it is to preserve the `Date` type in your objects.

```ts
import { EJSON } from "@bluelibs/ejson";

const myObject = {
  message: "Hello World!",
  createdAt: new Date(),
};

// Standard JSON loses the Date type
const jsonString = JSON.stringify(myObject);
console.log(jsonString);
// {"message":"Hello World!","createdAt":"2025-09-18T12:00:00.000Z"}
// The date is just a string! 👎

// EJSON preserves the Date type
const ejsonString = EJSON.stringify(myObject);
console.log(ejsonString);
// {"message":"Hello World!","createdAt":{"$date":"2025-09-18T12:00:00.000Z"}}

const parsedObject = EJSON.parse(ejsonString);
console.log(parsedObject.createdAt instanceof Date);
// true
// The date is a true Date object! 👍

// EJSON is already an instance, no extra import needed
```

---

## API & Examples

### Instances & Isolation

`EJSON` is an isolated instance by default. If you need multiple independent registries, create them via `EJSONModule`:

```ts
import { EJSON, EJSONModule } from "@bluelibs/ejson";

const ctxA = new EJSONModule();
const ctxB = new EJSONModule();

// Register a custom type only in ctxA
class Foo {
  constructor(public x: number) {}
  typeName() { return "Foo"; }
  toJSONValue() { return { x: this.x }; }
}
ctxA.addType("Foo", (v) => new Foo(v.x));

const s = ctxA.stringify({ f: new Foo(1) });

// OK in ctxA
ctxA.parse(s);

// Fails in ctxB because Foo is not registered there
// ctxB.parse(s); // throws: Custom EJSON type Foo is not defined
```

### Supported Types

`@bluelibs/ejson` automatically handles the following types:

- `Date`
- `RegExp`
- `Buffer` / `Uint8Array`
- `Map`
- `NaN`, `Infinity`, `-Infinity`
- `ObjectId` (from the `bson-objectid` package)

### Custom Types

You can easily add support for your own classes. Just provide a `typeName()` and `toJSONValue()` method, and register it with `EJSON.addType`.

```ts
import { EJSON } from "@bluelibs/ejson";

class Distance {
  constructor(public value: number, public unit: string) {}

  // Unique type name for registration
  typeName() {
    return "Distance";
  }

  // Convert the class instance to a JSON-serializable object
  toJSONValue() {
    return { value: this.value, unit: this.unit };
  }
}

// Register the type with a factory function to deserialize it
EJSON.addType("Distance", (json: any) => {
  return new Distance(json.value, json.unit);
});

const run = new Distance(42.195, "km");
const ejsonString = EJSON.stringify({ run });
// {"run":{"$type":"Distance","$value":{"value":42.195,"unit":"km"}}}

const parsed = EJSON.parse(ejsonString);
console.log(parsed.run instanceof Distance);
// true
```

### MongoDB ObjectId

`ObjectId` is supported out of the box, making this perfect for projects using MongoDB.

```ts
import { EJSON, ObjectId } from "@bluelibs/ejson";

const ejson = {
  _id: { $objectId: "615b033a0397e2e99b70994d" },
  title: "My Post",
};

const post = EJSON.fromJSONValue(ejson);
console.log(post._id instanceof ObjectId);
// true
```

### `toModel()` Utility

The package also includes a lightweight `toModel` utility to quickly cast plain objects into class instances.

```ts
import { toModel } from "@bluelibs/ejson";

class Person {
  firstname: string;
  lastname: string;
  age: number = 25; // Default values are respected

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }
}

const person = toModel(Person, {
  firstname: "John",
  lastname: "Smith",
});

console.log(person instanceof Person); // true
console.log(person.fullname); // "John Smith"
console.log(person.age); // 25
```

_Note: For advanced transformation needs, consider more powerful libraries like [class-transformer](https://github.com/typestack/class-transformer)._

---

## Benchmarks

We take performance and size seriously. `@bluelibs/ejson` includes a classic EJSON serializer and a new batch encoder for uniform arrays that removes repeated keys and per-item wrappers.

- Single complex object (ops/sec; higher is better)
  - `JSON.stringify`: ~250k
  - `EJSON.stringify`: ~100k
  - `JSON.parse`: ~470k
  - `EJSON.parse`: ~105k

- 1000 rows: batch vs non-batch (ops/sec; higher is better)
  - `JSON.stringify[1000]`: ~1,100
  - `EJSON.stringify[1000]`: ~290–840 (varies by dataset)
  - `EJSON.stringifyBatch[1000]`: ~580–880
  - `JSON.parse[1000]`: ~1,300–3,300
  - `EJSON.parse[1000]`: ~220–380
  - `EJSON.parseBatch[1000]`: ~440–630

- 1000 rows: size comparison (bytes; lower is better)
  - Raw bytes
    - JSON: ~228k
    - EJSON: ~294k
    - Batch: ~135k (−54% vs EJSON, −41% vs JSON)
  - Gzip
    - JSON: ~45.0k
    - EJSON: ~37.0k
    - Batch: ~23.6k (−36% vs EJSON, −48% vs JSON)
  - Brotli
    - JSON: ~20.0k
    - EJSON: ~20.4k
    - Batch: ~13.2k (−35% vs EJSON, −34% vs JSON)

Notes
- Batch numbers use a flat, uniform object with: `_id` (ObjectId), `createdAt` (Date), `active` (boolean), `name` (string), `score` (number), `re` (RegExp), a `dist` custom type, and an 8-byte binary column, repeated 1000 times.
- Results vary with hardware and data shape. Run `npm run benchmark` to reproduce on your machine.
- JSON serves as a baseline, but it does less work (no type restoration). Batch compares EJSON vs EJSON in a realistic uniform-array setting.

### Batch Encoding (Uniform Arrays)

For arrays of flat objects with the same keys, batch encoding drastically reduces size by:
- Writing the schema once (keys and column types).
- Storing per-column arrays of values instead of full objects per row.
- Lifting EJSON typing to columns (for example, Date/ObjectId) instead of per-value wrappers.
- Optionally packing fixed-width types (ObjectId) into a compact hex blob.

Usage

```ts
import { EJSON, ObjectId } from "@bluelibs/ejson";

// Optional: register a custom type for richer rows
class Distance {
  constructor(public value: number, public unit: string) {}
  typeName() { return "Distance"; }
  toJSONValue() { return { value: this.value, unit: this.unit }; }
}
EJSON.addType("Distance", (json: any) => new Distance(json.value, json.unit));

const rows = [
  { _id: new ObjectId(), createdAt: new Date(), active: true, name: "A", score: 10, re: /abc/gi, dist: new Distance(100, "km"), bin: new Uint8Array([1,2,3,4,5,6,7,8]) },
  { _id: new ObjectId(), createdAt: new Date(), active: false, name: "B", score: 20, re: /abc/gi, dist: new Distance(101, "km"), bin: new Uint8Array([2,3,4,5,6,7,8,9]) },
  // ... (uniform keys)
];

// Encode as batch
const s = EJSON.stringifyBatch(rows, { preferPackedObjectId: true });

// Decode
const back = EJSON.parseBatch(s);
```

Behavior
- Auto-detects schema from the first element’s keys and each column’s first non-null value.
- Requires flat, uniform objects (same keys); otherwise `stringifyBatch` falls back to classic EJSON.stringify.
- Supported column types: string, number, boolean, null, date, objectId, regexp, binary (values), and custom (via EJSON.addType factory).

Options
- `preferPackedObjectId` (default: true): packs ObjectIds into a hex blob (smaller and faster to parse back).
- `minArrayLength` (default: 1): threshold to consider batch encoding (future heuristic hook).
- `dictionary`, `deltaForDates`: reserved for future improvements (dictionary and delta encoding).

Run the benchmarks locally
```bash
npm run benchmark
```

_Numbers shown are from a standard development machine and the example dataset above. Your results may vary._

The overhead for `EJSON.stringify` and `EJSON.parse` is the price for handling custom types, but as you can see, the performance is still excellent for real-world applications.

You can run the benchmarks yourself:

```bash
npm run benchmark
```

---

## Contributing

Contributions are welcome! If you have a feature request, bug report, or pull request, please open an issue on our [GitHub repository](https://github.com/bluelibs/bluelibs).

### Local Development

1.  Clone the repository.
2.  Run `npm install`.
3.  Run `npm test` to execute the test suite.
4.  Run `npm run benchmark` to see performance metrics.

---

## License

This package is licensed under the [MIT License](LICENSE.md).

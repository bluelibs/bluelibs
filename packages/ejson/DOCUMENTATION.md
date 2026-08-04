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
```

---

## API & Examples

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

We take performance seriously. `@bluelibs/ejson` is optimized for common use cases, and our `EJSON.parse` method is significantly faster than other EJSON libraries that rely on deep cloning.

Here are the results from our benchmark suite, comparing against the native `JSON` methods. The benchmark uses a complex, nested object with various EJSON types. (Higher ops/sec is better).

| Operation         | ops/sec            |
| ----------------- | ------------------ |
| `JSON.stringify`  | ~272,000 ops/s     |
| `EJSON.stringify` | ~110,000 ops/s     |
| `JSON.parse`      | ~483,000 ops/s     |
| `EJSON.parse`     | **~112,000 ops/s** |

_These benchmarks were run on a standard development machine. Results may vary based on hardware and data structure complexity._

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

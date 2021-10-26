EJSON is a great way to use JSON to pass binaries and serialize/deserialize any type of data with ease. We use it to easily serialise/deserialise our objects while maintaining important objects such as dates, object ids, regexp etc.

## Install

```bash
npm install --save @bluelibs/ejson
```

```ts
import { EJSON } from "@bluelibs/ejson";

const result = EJSON.stringify({ a: 1 }); // string: {"a": 1}
const parsed = EJSON.parse(result); // object: {a: 1}
```

Works with complex objects such as `Date`, `RegExp`, `NaN`, `Inf, -Inf`:

```ts
const result = EJSON.stringify({ now: new Date() }); // string: {"now": { "$date": 100000000 }}
```

## [Official EJSON Documentation](https://docs.meteor.com/api/ejson.html)

This has been done by Meteor, we migrated it to TypeScript and added some extra flavors. Follow the official and complete documentation here, our implementation is a superset of it:
https://docs.meteor.com/api/ejson.html

## Custom Objects

Works with customly defined objects for easy serialisastion and deserialisation:

```ts
class Distance {
  constructor(value, unit) {
    this.value = value;
    this.unit = unit;
  }

  // Convert our type to JSON.
  toJSONValue() {
    return {
      value: this.value,
      unit: this.unit,
    };
  }

  // Unique type name.
  typeName() {
    return "Distance";
  }
}

EJSON.addType("Distance", function fromJSONValue(json) {
  return new Distance(json.value, json.unit);
});

EJSON.stringify(new Distance(10, "m"));
// Returns '{"$type":"Distance","$value":{"value":10,"unit":"m"}}'
```

## Models

An easy way to transform an object into a class instance.

```ts
import { toModel } from "@bluelibs/ejson";

class Person {
  firstname: string;
  lastname: string;

  get fullname() {
    return `${this.firstname} ${this.lastname}`;
  }
}

const person = toModel(Person, {
  firstname: "John",
  lastname: "Smith",
});
```

Note that this `toModel` function is very primitive. It won't work with nested functions. For a more robust alternative feel free to use [class-transformer](https://github.com/typestack/class-transformer) as it gives you with a stable and fully-featured way to transform plain objects into models.

Another solution which focuses on speed but also Developer Experience is [Type from DeepKit](https://deepkit.io/library/type). We recommend that you take a look at it as well.

## Meta

### Summary

EJSON is JSON + some flavors. It allows us to easily communicate with external JSON APIs and removes the headache of handling Dates, RegExps when they are comming as a client request.

### Challenges

- Try serialising with `EJSON` the following object: `{ date: new Date(), }` (1p)

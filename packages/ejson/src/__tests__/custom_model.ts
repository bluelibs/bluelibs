import { EJSON } from "../ejson";

export class Address {
  city: any;
  state: any;

  constructor(city, state) {
    this.city = city;
    this.state = state;
  }

  typeName() {
    return "Address";
  }

  toJSONValue() {
    return {
      city: this.city,
      state: this.state,
    };
  }
}

EJSON.addType("Address", (value) => new Address(value.city, value.state));

export class Person {
  name: any;
  dob: any;
  address: any;

  constructor(name, dob, address) {
    this.name = name;
    this.dob = dob;
    this.address = address;
  }

  typeName() {
    return "Person";
  }

  toJSONValue() {
    return {
      name: this.name,
      dob: EJSON.toJSONValue(this.dob),
      address: EJSON.toJSONValue(this.address),
    };
  }
}

EJSON.addType(
  "Person",
  (value) =>
    new Person(
      value.name,
      EJSON.fromJSONValue(value.dob),
      EJSON.fromJSONValue(value.address)
    )
);

export class Holder {
  content: any;

  constructor(content) {
    this.content = content;
  }

  typeName() {
    return "Holder";
  }

  toJSONValue() {
    return this.content;
  }
}

EJSON.addType("Holder", (value) => new Holder(value));

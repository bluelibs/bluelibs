import { EJSON } from "../ejson";
import type { JsonValue } from "../types";

export class Address {
  city: string;
  state: string;

  constructor(city: string, state: string) {
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

interface AddressJSON {
  city: string;
  state: string;
}

EJSON.addType("Address", (value: unknown) => {
  const json = value as AddressJSON;
  return new Address(json.city, json.state);
});

export class Person {
  name: string;
  dob: unknown;
  address: unknown;

  constructor(name: string, dob: unknown, address: unknown) {
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

interface PersonJSON {
  name: string;
  dob: JsonValue;
  address: JsonValue;
}

EJSON.addType("Person", (value: unknown) => {
  const json = value as PersonJSON;
  return new Person(
    json.name,
    EJSON.fromJSONValue(json.dob),
    EJSON.fromJSONValue(json.address)
  );
});

export class Holder {
  content: unknown;

  constructor(content: unknown) {
    this.content = content;
  }

  typeName() {
    return "Holder";
  }

  toJSONValue() {
    return this.content;
  }
}

EJSON.addType("Holder", (value: unknown) => new Holder(value));

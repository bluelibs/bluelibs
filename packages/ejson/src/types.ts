// Type-only helpers for EJSON. No runtime exports.

/** JSON-compatible primitives. */
export type JsonPrimitive = string | number | boolean | null;

/** A JSON object. */
export interface JsonObject {
  [key: string]: JsonValue;
}

/** A JSON array. */
export interface JsonArray extends Array<JsonValue> {}

/** A JSON-compatible value (https://json.org). */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** An object that EJSON recognizes as a custom type. */
export interface EJSONable {
  toJSONValue(): JsonValue;
  typeName(): string;
}

/** An object that implements its own equality semantics for EJSON.equals. */
export interface EJSONEquals {
  equals(other: unknown, options?: { keyOrderSensitive?: boolean }): boolean;
}

/** A converter between a runtime value and its EJSON JSON representation. */
export interface EJSONConverter {
  matchJSONValue(value: unknown): boolean;
  matchObject(value: unknown): boolean;
  toJSONValue(value: unknown): unknown;
  fromJSONValue(value: unknown): unknown;
}

/** The EJSON instance surface used by builtin converters. */
export interface EJSONConverterContext {
  toJSONValue(value: unknown): unknown;
  fromJSONValue(value: unknown): unknown;
  _isCustomType(value: unknown): boolean;
  customTypes: Map<string, (value: JsonValue) => unknown>;
}

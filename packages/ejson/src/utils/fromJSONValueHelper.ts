import { isObject, keysOf } from "../utilities";
// Either return the argument changed to have the non-json
// rep of itself (the Object version) or the argument itself.
// DOES NOT RECURSE.  For actually getting the fully-changed value, use
// EJSON.fromJSONValue
export const fromJSONValueHelper = (value, converters) => {
  if (isObject(value) && value !== null) {
    const keys = keysOf(value);
    if (
      keys.length <= 2 &&
      keys.every((k) => typeof k === "string" && k.substr(0, 1) === "$")
    ) {
      for (let i = 0; i < converters.length; i++) {
        const converter = converters[i];
        if (converter.matchJSONValue(value)) {
          return converter.fromJSONValue(value);
        }
      }
    }
  }
  return value;
};

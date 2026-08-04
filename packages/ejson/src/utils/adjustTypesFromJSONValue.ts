import { isObject, keysOf } from "../utilities";
import { fromJSONValueHelper } from "./fromJSONValueHelper";
// for both arrays and objects. Tries its best to just
// use the object you hand it, but may return something
// different if the object you hand it itself needs changing.
export const adjustTypesFromJSONValue = (obj, converters?) => {
  if (obj === null) {
    return null;
  }

  const maybeChanged = fromJSONValueHelper(obj, converters);
  if (maybeChanged !== obj) {
    return maybeChanged;
  }

  // Other atoms are unchanged.
  if (!isObject(obj)) {
    return obj;
  }

  keysOf(obj).forEach((key) => {
    const value = obj[key];
    if (isObject(value)) {
      const changed = fromJSONValueHelper(value, converters);
      if (value !== changed) {
        obj[key] = changed;
        return;
      }
      // if we get here, value is an object but not adjustable
      // at this level.  recurse.
      adjustTypesFromJSONValue(value, converters);
    }
  });
  return obj;
};

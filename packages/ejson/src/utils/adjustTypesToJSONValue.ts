import { isObject, keysOf, isInfOrNaN } from "../utilities";
import { toJSONValueHelper } from "./toJSONValueHelper";
// for both arrays and objects, in-place modification.
export const adjustTypesToJSONValue = (obj) => {
  // Is it an atom that we need to adjust?
  if (obj === null) {
    return null;
  }

  const maybeChanged = toJSONValueHelper(obj);
  if (maybeChanged !== undefined) {
    return maybeChanged;
  }

  // Other atoms are unchanged.
  if (!isObject(obj)) {
    return obj;
  }

  // Iterate over array or object structure.
  keysOf(obj).forEach((key) => {
    const value = obj[key];
    if (!isObject(value) && value !== undefined && !isInfOrNaN(value)) {
      return; // continue
    }

    const changed = toJSONValueHelper(value);
    if (changed) {
      obj[key] = changed;
      return; // on to the next key
    }
    // if we get here, value is an object but not adjustable
    // at this level.  recurse.
    adjustTypesToJSONValue(value);
  });
  return obj;
};

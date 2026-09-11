import { ObjectId } from "../objectid/ObjectId";
import { isObject, keysOf, isInfOrNaN } from "../utilities";
import { toJSONValueHelper } from "./toJSONValueHelper";
import { EJSONConverter } from "../types";
// for both arrays and objects, in-place modification.
export const adjustTypesToJSONValue = (
  obj: unknown,
  converters: EJSONConverter[]
): unknown => {
  // Is it an atom that we need to adjust?
  if (obj === null) {
    return null;
  }

  const maybeChanged = toJSONValueHelper(obj, converters);
  if (maybeChanged !== undefined) {
    return maybeChanged;
  }

  // Other atoms are unchanged.
  if (!isObject(obj)) {
    return obj;
  }

  // Iterate over array or object structure.
  keysOf(obj as object).forEach((key) => {
    const value = (obj as Record<string, unknown>)[key];
    if (
      !isObject(value) &&
      value !== undefined &&
      !isInfOrNaN(value) &&
      !(value instanceof ObjectId)
    ) {
      return; // continue
    }

    const changed = toJSONValueHelper(value, converters);

    if (changed) {
      (obj as Record<string, unknown>)[key] = changed;
      return; // on to the next key
    }
    // if we get here, value is an object but not adjustable
    // at this level.  recurse.
    adjustTypesToJSONValue(value, converters);
  });
  return obj;
};

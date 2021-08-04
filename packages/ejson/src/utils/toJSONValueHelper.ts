import { builtinConverters } from "./builtinConverters";
// Either return the JSON-compatible version of the argument, or undefined (if
// the item isn't itself replaceable, but maybe some fields in it are)
export const toJSONValueHelper = (item) => {
  for (let i = 0; i < builtinConverters.length; i++) {
    const converter = builtinConverters[i];
    if (converter.matchObject(item)) {
      return converter.toJSONValue(item);
    }
  }
  return undefined;
};

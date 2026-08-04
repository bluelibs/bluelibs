// Either return the JSON-compatible version of the argument, or undefined (if
// the item isn't itself replaceable, but maybe some fields in it are)
export const toJSONValueHelper = (item, converters) => {
  for (let i = 0; i < converters.length; i++) {
    const converter = converters[i];
    if (converter.matchObject(item)) {
      return converter.toJSONValue(item);
    }
  }
  return undefined;
};

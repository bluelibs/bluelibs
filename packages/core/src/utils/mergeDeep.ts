/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return (
    item &&
    typeof item === "object" &&
    !isClassInstance(item) &&
    !Array.isArray(item)
  );
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (target[key] === null || target[key] === undefined) {
          Object.assign(target, { [key]: source[key] });
        } else if (!isObject(target[key])) {
          Object.assign(target, { [key]: source[key] });
        } else {
          mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * Check to see if value is an instance of a constructor class to be able to avoid deep merging
 *
 * @param value
 * @returns
 */
export function isClassInstance(value: any) {
  return (
    typeof value?.constructor === "function" && value.constructor !== Object
  );
}

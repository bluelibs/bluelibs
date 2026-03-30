/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(item: any): boolean {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeDeep(target: any, ...sources: any[]): any {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isClassInstance(value: any): boolean {
  return (
    typeof value?.constructor === "function" && value.constructor !== Object
  );
}

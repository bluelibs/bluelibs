/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return (
    !!item &&
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
export function mergeDeep<T>(target: T, ...sources: unknown[]): T {
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
export function isClassInstance(value: unknown): boolean {
  const constructor = (value as { constructor?: unknown } | null | undefined)
    ?.constructor;
  return typeof constructor === "function" && constructor !== Object;
}

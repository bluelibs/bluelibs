import { ObjectId } from "./objectid";

export const isFunction = (fn: unknown) => typeof fn === "function";

export const isObject = (fn: unknown) =>
  typeof fn === "object" && !(fn instanceof ObjectId);

export const keysOf = (obj: object) => Object.keys(obj);

export const lengthOf = (obj: object) => Object.keys(obj).length;

export const hasOwn = (obj: object, prop: string) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

export const convertMapToObject = (map: Map<string, unknown>) =>
  Array.from(map).reduce<Record<string, unknown>>((acc, [key, value]) => {
    // reassign to not create new object
    acc[key] = value;
    return acc;
  }, {});

export const isArguments = (obj: object) => obj != null && hasOwn(obj, "callee");

export const isInfOrNaN = (obj: unknown) =>
  Number.isNaN(obj) || obj === Infinity || obj === -Infinity;

export const checkError = {
  maxStack: (msgError: string) =>
    new RegExp("Maximum call stack size exceeded", "g").test(msgError),
};

export const handleError =
  (fn: (...args: unknown[]) => unknown) =>
  function (this: unknown, ...args: unknown[]) {
    try {
      return fn.apply(this, args);
    } catch (error: unknown) {
      const isMaxStack = checkError.maxStack((error as Error).message);
      if (isMaxStack) {
        throw new Error("Converting circular structure to JSON");
      }
      throw error;
    }
  };

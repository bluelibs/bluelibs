import {
  isFunction,
  isObject,
  keysOf,
  hasOwn,
  convertMapToObject,
  isArguments,
  handleError,
  checkError,
} from "./utilities";
import canonicalStringify from "./stringify";
import { fromJSONValueHelper } from "./utils/fromJSONValueHelper";
import { adjustTypesFromJSONValue } from "./utils/adjustTypesFromJSONValue";
import { toJSONValueHelper } from "./utils/toJSONValueHelper";
import { adjustTypesToJSONValue } from "./utils/adjustTypesToJSONValue";
import { builtinConverters } from "./utils/builtinConverters";
import ObjectId from "bson-objectid";

export class EJSON {
  static customTypes = new Map();

  // Add a custom type, using a method of your choice to get to and
  // from a basic JSON-able representation.  The factory argument
  // is a function of JSON-able --> your object
  // The type you add must have:
  // - A toJSONValue() method, so that Meteor can serialize it
  // - a typeName() method, to show how to look it up in our type table.
  // It is okay if these methods are monkey-patched on.
  // EJSON.clone will use toJSONValue and the given factory to produce
  // a clone, but you may specify a method clone() that will be
  // used instead.
  // Similarly, EJSON.equals will use toJSONValue to make comparisons,
  // but you may provide a method equals() instead.
  /**
   * @summary Add a custom datatype to EJSON.
   * @locus Anywhere
   * @param {String} name A tag for your custom type; must be unique among
   *                      custom data types defined in your project, and must
   *                      match the result of your type's `typeName` method.
   * @param {Function} factory A function that deserializes a JSON-compatible
   *                           value into an instance of your type.  This should
   *                           match the serialization performed by your
   *                           type's `toJSONValue` method.
   */
  static addType(name, factory) {
    if (EJSON.customTypes.has(name)) {
      throw new Error(`Type ${name} already present`);
    }
    EJSON.customTypes.set(name, factory);
  }

  static _isCustomType(obj) {
    return (
      obj &&
      isFunction(obj.toJSONValue) &&
      isFunction(obj.typeName) &&
      EJSON.customTypes.has(obj.typeName())
    );
  }

  static _getTypes(isOriginal = false) {
    return isOriginal
      ? EJSON.customTypes
      : convertMapToObject(EJSON.customTypes);
  }

  static _getConverters = () => builtinConverters;

  static _adjustTypesToJSONValue = adjustTypesToJSONValue;

  /**
   * @summary Serialize an EJSON-compatible value into its plain JSON
   *          representation.
   * @locus Anywhere
   * @param {EJSON} val A value to serialize to plain JSON.
   */
  static toJSONValue(item) {
    const changed = toJSONValueHelper(item);
    if (changed !== undefined) {
      return changed;
    }

    let newItem = item;
    if (isObject(item)) {
      newItem = EJSON.clone(item);
      adjustTypesToJSONValue(newItem);
    }
    return newItem;
  }

  static _adjustTypesFromJSONValue = adjustTypesFromJSONValue;

  /**
   * @summary Deserialize an EJSON value from its plain JSON representation.
   * @locus Anywhere
   * @param {JSONCompatible} val A value to deserialize into EJSON.
   */
  static fromJSONValue(item) {
    let changed = fromJSONValueHelper(item);
    if (changed === item && isObject(item)) {
      changed = EJSON.clone(item);
      adjustTypesFromJSONValue(changed);
    }
    return changed;
  }

  /**
   * @summary Serialize a value to a string. For EJSON values, the serialization
   *          fully represents the value. For non-EJSON values, serializes the
   *          same way as `JSON.stringify`.
   * @locus Anywhere
   * @param {EJSON} val A value to stringify.
   * @param {Object} [options]
   * @param {Boolean | Integer | String} options.indent Indents objects and
   * arrays for easy readability.  When `true`, indents by 2 spaces; when an
   * integer, indents by that number of spaces; and when a string, uses the
   * string as the indentation pattern.
   * @param {Boolean} options.canonical When `true`, stringifies keys in an
   *                                    object in sorted order.
   */
  static stringify(item, options?) {
    try {
      let serialized;
      const json = EJSON.toJSONValue(item);
      if (options && (options.canonical || options.indent)) {
        serialized = canonicalStringify(json, options);
      } else {
        serialized = JSON.stringify(json);
      }
      return serialized;
    } catch (error) {
      const isMaxStack = checkError.maxStack(error.message);
      if (isMaxStack) {
        throw new Error("Converting circular structure to JSON");
      }
      throw error;
    }
  }

  /**
   * @summary Parse a string into an EJSON value. Throws an error if the string
   *          is not valid EJSON.
   * @locus Anywhere
   * @param {String} str A string to parse into an EJSON value.
   */
  static parse(item) {
    if (typeof item !== "string") {
      throw new Error("EJSON.parse argument should be a string");
    }
    return EJSON.fromJSONValue(JSON.parse(item));
  }

  /**
   * @summary Returns true if `x` is a buffer of binary data, as returned from
   *          [`EJSON.newBinary`](#ejson_new_binary).
   * @param {Object} x The variable to check.
   * @locus Anywhere
   */
  static isBinary(obj) {
    return !!(
      (typeof Uint8Array !== "undefined" && obj instanceof Uint8Array) ||
      (obj && obj.$Uint8ArrayPolyfill)
    );
  }

  /**
   * @summary Return true if `a` and `b` are equal to each other.  Return false
   *          otherwise.  Uses the `equals` method on `a` if present, otherwise
   *          performs a deep comparison.
   * @locus Anywhere
   * @param {EJSON} a
   * @param {EJSON} b
   * @param {Object} [options]
   * @param {Boolean} options.keyOrderSensitive Compare in key sensitive order,
   * if supported by the JavaScript implementation.  For example, `{a: 1, b: 2}`
   * is equal to `{b: 2, a: 1}` only when `keyOrderSensitive` is `false`.  The
   * default is `false`.
   */
  static equals(a, b, options?) {
    let i;
    const keyOrderSensitive = !!(options && options.keyOrderSensitive);
    if (a === b) {
      return true;
    }

    // This differs from the IEEE spec for NaN equality, b/c we don't want
    // anything ever with a NaN to be poisoned from becoming equal to anything.
    if (Number.isNaN(a) && Number.isNaN(b)) {
      return true;
    }

    // if either one is falsy, they'd have to be === to be equal
    if (!a || !b) {
      return false;
    }

    if (!(isObject(a) && isObject(b))) {
      return false;
    }

    if (a instanceof Date && b instanceof Date) {
      return a.valueOf() === b.valueOf();
    }

    if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }

    if (isFunction(a.equals)) {
      return a.equals(b, options);
    }

    if (isFunction(b.equals)) {
      return b.equals(a, options);
    }

    if (a instanceof Array) {
      if (!(b instanceof Array)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      for (i = 0; i < a.length; i++) {
        if (!EJSON.equals(a[i], b[i], options)) {
          return false;
        }
      }
      return true;
    }

    // fallback for custom types that don't implement their own equals
    let sum = 0;
    if (EJSON._isCustomType(a)) sum++;
    if (EJSON._isCustomType(b)) sum++;

    switch (sum) {
      case 1:
        return false;
      case 2:
        return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));
      default: // Do nothing
    }

    // fall back to structural equality of objects
    let ret;
    const aKeys = keysOf(a);
    const bKeys = keysOf(b);
    if (keyOrderSensitive) {
      i = 0;
      ret = aKeys.every((key) => {
        if (i >= bKeys.length) {
          return false;
        }
        if (key !== bKeys[i]) {
          return false;
        }
        if (!EJSON.equals(a[key], b[bKeys[i]], options)) {
          return false;
        }
        i++;
        return true;
      });
    } else {
      i = 0;
      ret = aKeys.every((key) => {
        if (!hasOwn(b, key)) {
          return false;
        }
        if (!EJSON.equals(a[key], b[key], options)) {
          return false;
        }
        i++;
        return true;
      });
    }
    return ret && i === bKeys.length;
  }

  /**
   * @summary Return a deep copy of `val`.
   * @locus Anywhere
   * @param {EJSON} val A value to copy.
   */
  static clone(v) {
    let ret;
    if (!isObject(v)) {
      return v;
    }

    if (v === null) {
      return null; // null has typeof "object"
    }

    if (v instanceof Date) {
      return new Date(v.getTime());
    }

    // RegExps are not really EJSON elements (eg we don't define a serialization
    // for them), but they're immutable anyway, so we can support them in clone.
    if (v instanceof RegExp) {
      return v;
    }

    if (ObjectId.isValid(v)) {
      return v;
    }

    if (EJSON.isBinary(v)) {
      ret = EJSON.newBinary(v.length);
      for (let i = 0; i < v.length; i++) {
        ret[i] = v[i];
      }
      return ret;
    }

    if (Array.isArray(v)) {
      return v.map(EJSON.clone);
    }

    if (isArguments(v)) {
      return Array.from(v).map(EJSON.clone);
    }

    // handle general user-defined typed Objects if they have a clone method
    if (isFunction(v.clone)) {
      return v.clone();
    }

    // handle other custom types
    if (EJSON._isCustomType(v)) {
      return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)));
    }

    // handle other objects
    ret = {};
    keysOf(v).forEach((key) => {
      ret[key] = EJSON.clone(v[key]);
    });
    return ret;
  }

  /**
   * @summary Allocate a new buffer of binary data that EJSON can serialize.
   * @locus Anywhere
   * @param {Number} size The number of bytes of binary data to allocate.
   */
  static newBinary(len) {
    if (
      typeof Uint8Array === "undefined" ||
      typeof ArrayBuffer === "undefined"
    ) {
      const ret: any = [];
      for (let i = 0; i < len; i++) {
        ret.push(0);
      }

      ret.$Uint8ArrayPolyfill = true;
      return ret;
    }
    return new Uint8Array(new ArrayBuffer(len));
  }
}

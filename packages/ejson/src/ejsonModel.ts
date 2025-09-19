import {
  isFunction,
  isObject,
  keysOf,
  hasOwn,
  convertMapToObject,
  isArguments,
  checkError,
} from "./utilities";
import canonicalStringify from "./stringify";
import { fromJSONValueHelper } from "./utils/fromJSONValueHelper";
import { adjustTypesFromJSONValue } from "./utils/adjustTypesFromJSONValue";
import { toJSONValueHelper } from "./utils/toJSONValueHelper";
import { adjustTypesToJSONValue } from "./utils/adjustTypesToJSONValue";
import { buildBuiltinConvertersFor } from "./utils/builtinConverters";
import { ObjectId } from "./objectid";

export class EJSONModule {
  customTypes = new Map<string, (value: any) => any>();
  private _converters = buildBuiltinConvertersFor(this);

  // ----- Custom types -----
  addType(name: string, factory: (value: any) => any) {
    if (this.customTypes.has(name)) {
      throw new Error(`Type ${name} already present`);
    }
    this.customTypes.set(name, factory);
  }

  _isCustomType(obj: any) {
    return (
      obj &&
      isFunction(obj.toJSONValue) &&
      isFunction(obj.typeName) &&
      this.customTypes.has(obj.typeName())
    );
  }

  _getTypes(isOriginal = false) {
    return isOriginal ? this.customTypes : convertMapToObject(this.customTypes);
  }

  // ----- Converters access -----
  _getConverters() {
    return this._converters;
  }

  _adjustTypesToJSONValue(obj: any) {
    return adjustTypesToJSONValue(obj, this._converters);
  }

  // ----- Serialization -----
  toJSONValue(item: any) {
    const changed = toJSONValueHelper(item, this._converters);
    if (changed !== undefined) {
      return changed;
    }

    let newItem = item;
    if (isObject(item)) {
      newItem = this.clone(item);
      adjustTypesToJSONValue(newItem, this._converters);
    }
    return newItem;
  }

  _adjustTypesFromJSONValue(obj: any) {
    return adjustTypesFromJSONValue(obj, this._converters);
  }

  _fromJSONValueInPlace(item: any) {
    let changed = fromJSONValueHelper(item, this._converters);
    if (changed === item && isObject(item)) {
      adjustTypesFromJSONValue(changed, this._converters);
    }
    return changed;
  }

  fromJSONValue(item: any) {
    let changed = fromJSONValueHelper(item, this._converters);
    if (changed === item && isObject(item)) {
      changed = this.clone(item);
      adjustTypesFromJSONValue(changed, this._converters);
    }
    return changed;
  }

  stringify(item: any, options?: { indent?: boolean | number | string; canonical?: boolean }) {
    try {
      let serialized: string;
      const json = this.toJSONValue(item);
      if (options && (options.canonical || options.indent)) {
        serialized = canonicalStringify(json, options);
      } else {
        serialized = JSON.stringify(json);
      }
      return serialized;
    } catch (error: any) {
      const isMaxStack = checkError.maxStack(error.message);
      if (isMaxStack) {
        throw new Error("Converting circular structure to JSON");
      }
      throw error;
    }
  }

  parse(item: string) {
    if (typeof item !== "string") {
      throw new Error("EJSON.parse argument should be a string");
    }
    return this._fromJSONValueInPlace(JSON.parse(item));
  }

  // ----- Helpers -----
  isBinary(obj: any) {
    return !!(
      (typeof Uint8Array !== "undefined" && obj instanceof Uint8Array) ||
      (obj && obj.$Uint8ArrayPolyfill)
    );
  }

  equals(a: any, b: any, options?: { keyOrderSensitive?: boolean }) {
    let i: number;
    const keyOrderSensitive = !!(options && options.keyOrderSensitive);
    if (a === b) {
      return true;
    }
    if (Number.isNaN(a) && Number.isNaN(b)) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    if (!(isObject(a) && isObject(b))) {
      return false;
    }
    if (a instanceof Date && b instanceof Date) {
      return a.valueOf() === b.valueOf();
    }
    if (this.isBinary(a) && this.isBinary(b)) {
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
        if (!this.equals(a[i], b[i], options)) {
          return false;
        }
      }
      return true;
    }
    // fallback for custom types that don't implement their own equals
    let sum = 0;
    if (this._isCustomType(a)) sum++;
    if (this._isCustomType(b)) sum++;
    switch (sum) {
      case 1:
        return false;
      case 2:
        return this.equals(this.toJSONValue(a), this.toJSONValue(b));
      default:
      // Do nothing
    }
    // fall back to structural equality of objects
    let ret: boolean;
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
        if (!this.equals(a[key], b[bKeys[i]], options)) {
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
        if (!this.equals(a[key], b[key], options)) {
          return false;
        }
        i++;
        return true;
      });
    }
    return ret && i === bKeys.length;
  }

  clone(v: any) {
    let ret: any;
    if (!isObject(v)) {
      return v;
    }
    if (v === null) {
      return null;
    }
    if (v instanceof Date) {
      return new Date(v.getTime());
    }
    if (v instanceof RegExp) {
      return v;
    }
    if (ObjectId.isValid(v) || v._bsontype === "ObjectID") {
      return new ObjectId(v.toString());
    }
    if (this.isBinary(v)) {
      ret = this.newBinary(v.length);
      for (let i = 0; i < v.length; i++) {
        ret[i] = v[i];
      }
      return ret;
    }
    if (Array.isArray(v)) {
      return v.map((x) => this.clone(x));
    }
    if (isArguments(v)) {
      return Array.from(v).map((x) => this.clone(x));
    }
    if (isFunction((v as any).clone)) {
      return (v as any).clone();
    }
    if (this._isCustomType(v)) {
      return this.fromJSONValue(this.clone(this.toJSONValue(v)));
    }
    ret = {} as any;
    keysOf(v).forEach((key) => {
      ret[key] = this.clone(v[key]);
    });
    return ret;
  }

  newBinary(len: number) {
    if (
      typeof Uint8Array === "undefined" ||
      typeof ArrayBuffer === "undefined"
    ) {
      const ret: any = [];
      for (let i = 0; i < len; i++) {
        ret.push(0);
      }
      (ret as any).$Uint8ArrayPolyfill = true;
      return ret;
    }
    return new Uint8Array(new ArrayBuffer(len));
  }
}

// Backward-compatible alias (if anyone used the previous name in this session)
export const EJSONModel = EJSONModule;

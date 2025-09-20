import { isObject, keysOf, isInfOrNaN, hasOwn, lengthOf } from "../utilities";
import { Base64 } from "../base64";
import { ObjectId } from "../objectid";

// Build a set of builtin converters bound to a given context.
// The context must expose: toJSONValue, fromJSONValue, _isCustomType, customTypes
export const buildBuiltinConvertersFor = (ctx: any) => {
  // indirection to reference the list while it is being built
  const holder: { current: any[] | null } = { current: null };
  const converters = [
  {
    // ObjectId
    matchJSONValue(obj) {
      return hasOwn(obj, "$objectId") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      if (obj instanceof ObjectId) {
        return true;
      }
      if (obj?._bsontype === "ObjectID") {
        return true;
      }
      return false;
    },
    toJSONValue(obj: ObjectId) {
      return { $objectId: obj.toString() };
    },
    fromJSONValue(obj) {
      return new ObjectId(obj.$objectId);
    },
  },
  {
    // Date
    matchJSONValue(obj) {
      return hasOwn(obj, "$date") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      return obj instanceof Date;
    },
    toJSONValue(obj) {
      return { $date: obj.getTime() };
    },
    fromJSONValue(obj) {
      return new Date(obj.$date);
    },
  },
  {
    // RegExp
    matchJSONValue(obj) {
      return (
        hasOwn(obj, "$regexp") && hasOwn(obj, "$flags") && lengthOf(obj) === 2
      );
    },
    matchObject(obj) {
      return obj instanceof RegExp;
    },
    toJSONValue(regexp) {
      return {
        $regexp: regexp.source,
        $flags: regexp.flags,
      };
    },
    fromJSONValue(obj) {
      // Replaces duplicate / invalid flags.
      return new RegExp(
        obj.$regexp,
        obj.$flags
          // Cut off flags at 50 chars to avoid abusing RegExp for DOS.
          .slice(0, 50)
          .replace(/[^gimuy]/g, "")
          .replace(/(.)(?=.*\1)/g, "")
      );
    },
  },
  {
    // NaN, Inf, -Inf. (These are the only objects with typeof !== 'object'
    // which we match.)
    matchJSONValue(obj) {
      return hasOwn(obj, "$InfNaN") && lengthOf(obj) === 1;
    },
    matchObject: isInfOrNaN,
    toJSONValue(obj) {
      let sign;
      if (Number.isNaN(obj)) {
        sign = 0;
      } else if (obj === Infinity) {
        sign = 1;
      } else {
        sign = -1;
      }
      return { $InfNaN: sign };
    },
    fromJSONValue(obj) {
      return obj.$InfNaN / 0;
    },
  },
  {
    // Binary
    matchJSONValue(obj) {
      return hasOwn(obj, "$binary") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      return (
        (typeof Uint8Array !== "undefined" && obj instanceof Uint8Array) ||
        (obj && hasOwn(obj, "$Uint8ArrayPolyfill"))
      );
    },
    toJSONValue(obj) {
      if (typeof Uint8Array !== "undefined" && obj instanceof Uint8Array) {
        return { $binary: Base64.encodeU8(obj) };
      }
      return { $binary: Base64.encode(obj) };
    },
    fromJSONValue(obj) {
      return Base64.decode(obj.$binary);
    },
  },
  {
    // Escaping one level
    matchJSONValue(obj) {
      return hasOwn(obj, "$escape") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      let match = false;
      if (obj) {
        const keyCount = lengthOf(obj);
        if (keyCount === 1 || keyCount === 2) {
          const list = holder.current || [];
          match = list.some((converter) => converter.matchJSONValue(obj));
        }
      }
      return match;
    },
    toJSONValue(obj) {
      const newObj = {};
      keysOf(obj).forEach((key) => {
        newObj[key] = ctx.toJSONValue(obj[key]);
      });
      return { $escape: newObj };
    },
    fromJSONValue(obj) {
      const newObj = {};
      keysOf(obj.$escape).forEach((key) => {
        newObj[key] = ctx.fromJSONValue(obj.$escape[key]);
      });
      return newObj;
    },
  },
  {
    // Custom
    matchJSONValue(obj) {
      return (
        hasOwn(obj, "$type") && hasOwn(obj, "$value") && lengthOf(obj) === 2
      );
    },
    matchObject(obj) {
      return ctx._isCustomType(obj);
    },
    toJSONValue(obj) {
      const jsonValue = obj.toJSONValue();
      return { $type: obj.typeName(), $value: jsonValue };
    },
    fromJSONValue(obj) {
      const typeName = obj.$type;
      if (!ctx.customTypes.has(typeName)) {
        throw new Error(`Custom EJSON type ${typeName} is not defined`);
      }
      const converter = ctx.customTypes.get(typeName);
      return converter(obj.$value);
    },
  },
  ];
  holder.current = converters;
  return converters;
};

// Default, global converters bound to static EJSON
// Static/global converters used by the static EJSON API. This version
// references EJSON directly and avoids early binding to prevent issues
// with circular imports during module initialization.
export const builtinConverters = [
  {
    // ObjectId
    matchJSONValue(obj) {
      return hasOwn(obj, "$objectId") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      if (obj instanceof ObjectId) {
        return true;
      }
      if (obj?._bsontype === "ObjectID") {
        return true;
      }
      return false;
    },
    toJSONValue(obj: ObjectId) {
      return { $objectId: obj.toString() };
    },
    fromJSONValue(obj) {
      return new ObjectId(obj.$objectId);
    },
  },
  {
    // Date
    matchJSONValue(obj) {
      return hasOwn(obj, "$date") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      return obj instanceof Date;
    },
    toJSONValue(obj) {
      return { $date: obj.getTime() };
    },
    fromJSONValue(obj) {
      return new Date(obj.$date);
    },
  },
  {
    // RegExp
    matchJSONValue(obj) {
      return (
        hasOwn(obj, "$regexp") && hasOwn(obj, "$flags") && lengthOf(obj) === 2
      );
    },
    matchObject(obj) {
      return obj instanceof RegExp;
    },
    toJSONValue(regexp) {
      return {
        $regexp: regexp.source,
        $flags: regexp.flags,
      };
    },
    fromJSONValue(obj) {
      // Replaces duplicate / invalid flags.
      return new RegExp(
        obj.$regexp,
        obj.$flags
          // Cut off flags at 50 chars to avoid abusing RegExp for DOS.
          .slice(0, 50)
          .replace(/[^gimuy]/g, "")
          .replace(/(.)(?=.*\1)/g, "")
      );
    },
  },
  {
    // NaN, Inf, -Inf. (These are the only objects with typeof !== 'object'
    // which we match.)
    matchJSONValue(obj) {
      return hasOwn(obj, "$InfNaN") && lengthOf(obj) === 1;
    },
    matchObject: isInfOrNaN,
    toJSONValue(obj) {
      let sign;
      if (Number.isNaN(obj)) {
        sign = 0;
      } else if (obj === Infinity) {
        sign = 1;
      } else {
        sign = -1;
      }
      return { $InfNaN: sign };
    },
    fromJSONValue(obj) {
      return obj.$InfNaN / 0;
    },
  },
  {
    // Binary
    matchJSONValue(obj) {
      return hasOwn(obj, "$binary") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      return (
        (typeof Uint8Array !== "undefined" && obj instanceof Uint8Array) ||
        (obj && hasOwn(obj, "$Uint8ArrayPolyfill"))
      );
    },
    toJSONValue(obj) {
      if (typeof Uint8Array !== "undefined" && obj instanceof Uint8Array) {
        return { $binary: Base64.encodeU8(obj) };
      }
      return { $binary: Base64.encode(obj) };
    },
    fromJSONValue(obj) {
      return Base64.decode(obj.$binary);
    },
  },
  {
    // Escaping one level
    matchJSONValue(obj) {
      return hasOwn(obj, "$escape") && lengthOf(obj) === 1;
    },
    matchObject(obj) {
      let match = false;
      if (obj) {
        const keyCount = lengthOf(obj);
        if (keyCount === 1 || keyCount === 2) {
          match = builtinConverters.some((converter) =>
            converter.matchJSONValue(obj)
          );
        }
      }
      return match;
    },
    toJSONValue(obj) {
      const newObj = {};
      keysOf(obj).forEach((key) => {
        // Placeholder, this global list is intended only for simple matches.
        // In instance-bound lists, ctx handles recursion.
        newObj[key] = obj[key];
      });
      return { $escape: newObj };
    },
    fromJSONValue(obj) {
      const newObj = {};
      keysOf(obj.$escape).forEach((key) => {
        newObj[key] = obj.$escape[key];
      });
      return newObj;
    },
  },
  {
    // Custom
    matchJSONValue(obj) {
      return (
        hasOwn(obj, "$type") && hasOwn(obj, "$value") && lengthOf(obj) === 2
      );
    },
    matchObject(obj) {
      // The global list cannot resolve custom types without an instance.
      return false;
    },
    toJSONValue(obj) {
      // Unused in the global list; custom types are handled by instances.
      return obj;
    },
    fromJSONValue(obj) {
      // Unused in the global list.
      return obj;
    },
  },
];

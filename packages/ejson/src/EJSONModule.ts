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
import { Base64 } from "./base64";
import {
  EJSONBatchDecodeOptions,
  EJSONBatchEncodeOptions,
  EJSONBatchJSON,
  EJSONBatchPayload,
  EJSONBatchSchema,
  EJSONBatchColumnSchema,
} from "./batch";

export class EJSONModule {
  customTypes = new Map<string, (value: any) => any>();
  private _converters = buildBuiltinConvertersFor(this);
  // Lazily created fast JSON replacer/reviver for default stringify/parse paths
  private _fastReplacer?: (this: any, key: string, value: any) => any;
  private _fastReviver?: (this: any, key: string, value: any) => any;

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
      // Preserve EJSON semantics by pre-transforming to JSON value
      const json = this.toJSONValue(item);
      if (options && (options.canonical || options.indent)) {
        return canonicalStringify(json, options);
      }
      return JSON.stringify(json);
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
    // Use the established, optimized post-pass to avoid heavy per-node reviver overhead
    return this._fromJSONValueInPlace(JSON.parse(item));
  }

  // ----- Batch (Uniform Arrays, Columnar) -----
  /**
   * Convert an array of uniform, flat objects to a batch EJSON JSON value.
   * The encoder is schema-aware and may choose column encodings based on options.
   */
  toBatchJSONValue<T = any>(rows: ReadonlyArray<T>, options?: EJSONBatchEncodeOptions): EJSONBatchJSON {
    const opts: EJSONBatchEncodeOptions = {
      preferPackedObjectId: true,
      minArrayLength: 1,
      dictionary: false,
      deltaForDates: false,
      ...(options || {}),
    };

    if (!Array.isArray(rows)) {
      throw new Error("toBatchJSONValue expects an array");
    }
    const count = rows.length;
    if (count === 0) {
      throw new Error("toBatchJSONValue cannot encode an empty array");
    }

    // Infer keys and ensure uniform, flat objects
    const first = rows[0] as any;
    if (typeof first !== "object" || first === null || Array.isArray(first)) {
      throw new Error("toBatchJSONValue expects array of flat objects");
    }
    const keys = keysOf(first);
    // Ensure every row has same keys and flat values (O(n*k) without extra arrays)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as any;
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        throw new Error("toBatchJSONValue expects array of flat objects");
      }
      for (let j = 0; j < keys.length; j++) {
        const k = keys[j];
        if (!hasOwn(row, k)) {
          throw new Error("toBatchJSONValue requires uniform keys across rows");
        }
      }
    }

    // Type inference helper
    const inferType = (k: string): { schema: EJSONBatchColumnSchema; encoder: (values: any[]) => any } => {
      // find first non-null/undefined value
      let firstVal: any = undefined;
      for (let i = 0; i < rows.length; i++) {
        const v = (rows[i] as any)[k];
        if (v !== null && v !== undefined) {
          firstVal = v;
          break;
        }
      }
      let optional = rows.some((r: any) => r[k] === null || r[k] === undefined);
      const makeValues = (arr: any[]) => ({ v: arr });

      // If everything is null/undefined, type is null
      if (firstVal === undefined) {
        return {
          schema: { type: "null", optional: true },
          encoder: (values: any[]) => ({ v: values.map(() => null) }),
        };
      }

      // Primitive types
      const t = typeof firstVal;
      if (t === "string" || t === "number" || t === "boolean") {
        const type = t as "string" | "number" | "boolean";
        return { schema: { type, optional }, encoder: makeValues };
      }

      // Objects and special cases
      if (firstVal instanceof Date) {
        return {
          schema: { type: "date", optional },
          encoder: (values: any[]) => ({ v: values.map((v) => (v == null ? null : (v as Date).getTime())) }),
        };
      }
      if (this.isBinary(firstVal)) {
        // store as base64 strings per value
        return {
          schema: { type: "binary", optional },
          encoder: (values: any[]) => ({
            v: values.map((v) => (v == null ? null : Base64.encodeU8(v))),
          }),
        };
      }
      if (firstVal instanceof RegExp) {
        return {
          schema: { type: "regexp", optional },
          encoder: (values: any[]) => ({
            v: values.map((v) => (v == null ? null : { source: (v as RegExp).source, flags: (v as RegExp).flags })),
          }),
        };
      }
      if (ObjectId.isValid(firstVal) || (firstVal && firstVal._bsontype === "ObjectID")) {
        const usePacked = !!opts.preferPackedObjectId;
        if (usePacked) {
          return {
            schema: { type: "objectId", optional, encoding: "packed" },
            encoder: (values: any[]) => packObjectIds(values),
          };
        }
        return {
          schema: { type: "objectId", optional },
          encoder: (values: any[]) => ({ v: values.map((v) => (v == null ? null : new ObjectId(v).toString())) }),
        };
      }
      if (this._isCustomType(firstVal)) {
        const typeName = (firstVal as any).typeName();
        return {
          schema: { type: "custom", optional, customTypeName: typeName },
          encoder: (values: any[]) => ({ v: values.map((v) => (v == null ? null : (v as any).toJSONValue())) }),
        };
      }

      // Not supported (nested object/array)
      throw new Error(`Unsupported value for batch column '${k}'`);
    };

    // Byte helpers
    const u8ToString = (u8: Uint8Array): string => {
      let s = "";
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return s;
    };

    const toHex = (u8: Uint8Array) => {
      if (typeof Buffer !== "undefined" && Buffer.from) {
        return Buffer.from(u8).toString("hex");
      }
      const LUT = EJSONModule._hexLUT || EJSONModule._buildHexLUT();
      let out = "";
      for (let i = 0; i < u8.length; i++) out += LUT[u8[i]];
      return out;
    };

    const packObjectIds = (values: any[]) => {
      const nulls: number[] = [];
      // Count non-nulls to pre-allocate once
      let nn = 0;
      for (let i = 0; i < values.length; i++) nn += values[i] == null ? 0 : 1;
      const bytes = new Uint8Array(nn * 12);
      let p = 0;
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v == null) {
          nulls.push(i);
        } else {
          const oid = v instanceof ObjectId ? v : new ObjectId(v);
          // copy 12 bytes
          bytes.set(oid.id, p);
          p += 12;
        }
      }
      const hex = toHex(bytes);
      const payload: any = { packed: { hex, width: 12 } };
      if (nulls.length) payload.nulls = nulls;
      return payload;
    };

    const schema: EJSONBatchSchema = { columns: {}, order: keys.slice() };
    const data: Record<string, any> = {};

    for (const k of keys) {
      const { schema: colSchema, encoder } = inferType(k);
      schema.columns[k] = colSchema;
      // Build column values in a single pass
      const colValues: any[] = new Array(count);
      for (let i = 0; i < count; i++) colValues[i] = (rows[i] as any)[k];
      const payload = encoder(colValues);
      if (colSchema.optional && (!colSchema.encoding || colSchema.encoding === "values")) {
        // compute nulls in the same pass
        const nulls: number[] = [];
        for (let i = 0; i < count; i++) if (colValues[i] == null) nulls.push(i);
        if (nulls.length) payload.nulls = nulls;
      }
      data[k] = payload;
    }

    const payload: EJSONBatchPayload = {
      version: 1,
      schema,
      count,
      data,
    };
    return { $batch: payload };
  }

  /**
   * Convert a batch EJSON JSON value back into an array of objects.
   */
  fromBatchJSONValue<T = any>(value: EJSONBatchJSON, options?: EJSONBatchDecodeOptions): T[] {
    if (!value || typeof value !== "object" || !("$batch" in value)) {
      throw new Error("fromBatchJSONValue expects a {$batch: ...} object");
    }
    const { schema, count, data } = (value as any).$batch as EJSONBatchPayload;
    const order = schema.order || Object.keys(schema.columns);
    const rows: any[] = new Array(count);
    for (let i = 0; i < count; i++) rows[i] = {};

    const fromHexBulk = (hex: string): Uint8Array => {
      if (typeof Buffer !== "undefined" && Buffer.from) {
        const buf = Buffer.from(hex, "hex");
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      }
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
      return out;
    };

    for (const k of order) {
      const colSchema = schema.columns[k] as EJSONBatchColumnSchema;
      const colData = data[k];
      const nullsSet: Set<number> = new Set(colData && colData.nulls ? colData.nulls : []);
      switch (colSchema.type) {
        case "string":
        case "number":
        case "boolean":
        case "null": {
          const v = colData && "v" in colData ? (colData as any).v : new Array(count).fill(null);
          for (let i = 0; i < count; i++) rows[i][k] = v[i];
          break;
        }
        case "date": {
          const v: Array<number | null> = colData && "v" in colData ? (colData as any).v : new Array(count).fill(null);
          for (let i = 0; i < count; i++) rows[i][k] = v[i] == null ? null : new Date(v[i] as number);
          break;
        }
        case "regexp": {
          const v: Array<{ source: string; flags: string } | null> = colData && "v" in colData ? (colData as any).v : new Array(count).fill(null);
          for (let i = 0; i < count; i++) {
            const entry: any = v[i];
            rows[i][k] = entry == null ? null : new RegExp(entry.source, entry.flags);
          }
          break;
        }
        case "objectId": {
          if (colSchema.encoding === "packed") {
            const packed = colData && "packed" in colData ? (colData as any).packed : undefined;
            const width = packed?.width || 12;
            const hex: string = packed && packed.hex ? packed.hex : "";
            const all = fromHexBulk(hex);
            let ptr = 0;
            // Use pointer over sorted array of nulls to avoid Set overhead
            const nullsArr: number[] = colData && colData.nulls ? (colData.nulls as number[]) : [];
            let np = 0;
            for (let i = 0; i < count; i++) {
              if (np < nullsArr.length && nullsArr[np] === i) {
                rows[i][k] = null;
                np++;
              } else {
                const slice = all.subarray(ptr, ptr + width);
                rows[i][k] = new ObjectId(slice);
                ptr += width;
              }
            }
          } else {
            const v: Array<string | null> = colData && "v" in colData ? (colData as any).v : new Array(count).fill(null);
            for (let i = 0; i < count; i++) rows[i][k] = v[i] == null ? null : new ObjectId(v[i] as string);
          }
          break;
        }
        case "binary": {
          const v: Array<string | null> = colData && "v" in colData ? (colData as any).v : new Array(count).fill(null);
          for (let i = 0; i < count; i++) {
            const s = v[i];
            rows[i][k] = s == null ? null : Base64.decodeToU8(s);
          }
          break;
        }
        case "custom": {
          const typeName = colSchema.customTypeName;
          if (!typeName) throw new Error(`Missing customTypeName for column ${k}`);
          if (!this.customTypes.has(typeName)) {
            throw new Error(`Custom EJSON type ${typeName} is not defined`);
          }
          const factory = this.customTypes.get(typeName)!;
          const v: Array<any | null> = colData && "v" in colData ? (colData as any).v : new Array(count).fill(null);
          for (let i = 0; i < count; i++) rows[i][k] = v[i] == null ? null : factory(v[i]);
          break;
        }
        default:
          throw new Error(`Unsupported column type for ${k}`);
      }
    }

    return rows as T[];
  }

  /**
   * Stringify a uniform array using batch encoding.
   */
  stringifyBatch<T = any>(rows: ReadonlyArray<T>, options?: EJSONBatchEncodeOptions): string {
    try {
      const batch = this.toBatchJSONValue(rows, options);
      return JSON.stringify(batch);
    } catch (e) {
      // Fallback to regular EJSON for non-uniform/non-flat arrays
      return this.stringify(rows);
    }
  }

  /**
   * Parse a previously batch-encoded string back into an array of objects.
   */
  parseBatch<T = any>(item: string, options?: EJSONBatchDecodeOptions): T[] {
    if (typeof item !== "string") {
      throw new Error("EJSON.parseBatch argument should be a string");
    }
    const parsed = JSON.parse(item);
    if (parsed && typeof parsed === "object" && parsed.$batch) {
      return this.fromBatchJSONValue(parsed, options);
    }
    // Fallback for non-batch payloads
    const val = this._fromJSONValueInPlace(parsed);
    if (!Array.isArray(val)) {
      throw new Error("parseBatch expected a batch or array payload");
    }
    return val as T[];
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

  // Build a monomorphic fast replacer that performs EJSON conversions inline.
  private _buildFastReplacer() {
    const self = this;
    const isBin = (obj: any) => !!(
      (typeof Uint8Array !== "undefined" && obj instanceof Uint8Array) ||
      (obj && obj.$Uint8ArrayPolyfill)
    );
    const shouldEscape = (obj: any) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
      const ks = Object.keys(obj);
      if (ks.length === 0 || ks.length > 2) return false;
      for (let i = 0; i < ks.length; i++) if (ks[i].charCodeAt(0) !== 36 /* '$' */) return false;
      return true; // conservative: escape any 1-2 key $-object
    };
    return function (_key: string, value: any) {
      if (value === null || value === undefined) return value;
      const t = typeof value;
      if (t === "number") {
        if (Number.isNaN(value)) return { $InfNaN: 0 };
        if (value === Infinity) return { $InfNaN: 1 };
        if (value === -Infinity) return { $InfNaN: -1 };
        return value;
      }
      if (t !== "object") return value;
      if (value instanceof Date) return { $date: value.getTime() };
      if (value instanceof RegExp) return { $regexp: value.source, $flags: value.flags };
      if (ObjectId.isValid(value) || (value && value._bsontype === "ObjectID")) {
        const oid = value instanceof ObjectId ? value : new ObjectId(value);
        return { $objectId: oid.toString() };
      }
      if (isBin(value)) {
        // Encode to base64 using optimized path
        return { $binary: Base64.encodeU8(value) } as any;
      }
      // Custom
      if (
        value &&
        isFunction((value as any).toJSONValue) &&
        isFunction((value as any).typeName) &&
        self.customTypes.has((value as any).typeName())
      ) {
        const typeName = (value as any).typeName();
        const jsonValue = (value as any).toJSONValue();
        return { $type: typeName, $value: jsonValue };
      }
      if (shouldEscape(value)) {
        return { $escape: value };
      }
      return value;
    };
  }

  // Build a monomorphic fast reviver for parse
  private _buildFastReviver() {
    const self = this;
    return function (_key: string, value: any) {
      if (!value || typeof value !== "object") return value;
      const ks = Object.keys(value);
      if (ks.length === 1) {
        const k = ks[0];
        switch (k) {
          case "$date":
            return new Date(value.$date);
          case "$objectId":
            return new ObjectId(value.$objectId);
          case "$InfNaN":
            return value.$InfNaN / 0;
          case "$binary":
            // Keep compatibility: decode to string of bytes for non-batch use? historically returns string.
            // Use Uint8Array for better perf; most callers can accept it. Fallback: return decodeToU8.
            return Base64.decodeToU8(value.$binary);
          case "$escape": {
            const inner = value.$escape;
            // JSON.parse will already have revived children; simply unwrap
            return inner;
          }
          default:
            break;
        }
      }
      if (ks.length === 2 && "$regexp" in value && "$flags" in value) {
        const flags = String(value.$flags).slice(0, 50).replace(/[^gimuy]/g, "").replace(/(.)(?=.*\1)/g, "");
        return new RegExp(value.$regexp, flags);
      }
      if (ks.length === 2 && "$type" in value && "$value" in value) {
        const typeName = value.$type;
        if (!self.customTypes.has(typeName)) {
          throw new Error(`Custom EJSON type ${typeName} is not defined`);
        }
        const factory = self.customTypes.get(typeName)!;
        return factory(value.$value);
      }
      return value;
    };
  }

  // Shared hex LUT for browser hex encoding
  private static _hexLUT: string[] | null = null;
  private static _buildHexLUT() {
    const lut: string[] = new Array(256);
    for (let i = 0; i < 256; i++) lut[i] = i.toString(16).padStart(2, "0");
    EJSONModule._hexLUT = lut;
    return lut;
  }
}

// Backward-compatible alias (if anyone used the previous name in this session)
export const EJSONModel = EJSONModule;

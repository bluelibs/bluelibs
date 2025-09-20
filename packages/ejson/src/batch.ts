// Interfaces for EJSON Batch encoding (uniform arrays in columnar form)

/** Version of the batch format. */
export type EJSONBatchVersion = 1;

/** Scalar JSON types supported in batch columns. */
export type EJSONScalarType = "string" | "number" | "boolean" | "null";

/** Extended EJSON types supported in batch columns. */
export type EJSONExtendedType = "date" | "objectId" | "binary" | "regexp" | "custom";

/** Column type for a batch schema. */
export type EJSONBatchColumnType = EJSONScalarType | EJSONExtendedType;

/** Encoding hints for a column. */
export type EJSONBatchColumnEncoding =
  | "values" // regular array of values
  | "packed" // packed binary blob (for fixed-width like objectId)
  | "delta" // delta encoding (e.g., for dates)
  | "dictionary"; // dictionary + indices (strings/enums)

/** Column schema metadata. */
export interface EJSONBatchColumnSchema {
  type: EJSONBatchColumnType;
  optional?: boolean; // indicates column can contain nulls
  encoding?: EJSONBatchColumnEncoding; // optional hint
  customTypeName?: string; // when type === 'custom'
}

/** Batch schema describing all columns. */
export interface EJSONBatchSchema {
  columns: Record<string, EJSONBatchColumnSchema>;
  order?: string[]; // stable column order (optional)
}

/** Generic "values" payload for a column. Length should equal batch count. */
export interface EJSONBatchColumnValues<T = any> {
  v: T[];
  /** Indexes where value is null (optional helper). */
  nulls?: number[];
}

/** Packed payload for fixed-width binary data (e.g., ObjectId 12 bytes). */
export interface EJSONBatchColumnPacked {
  packed: {
    /** Base64 of concatenated fixed-width values. Prefer hex for binary safety in this build. */
    b64?: string;
    /** Hex of concatenated fixed-width values. */
    hex?: string;
    /** Width in bytes of a single value (e.g., 12 for ObjectId). */
    width: number;
  };
  /** Indexes where value is null (optional helper). */
  nulls?: number[];
}

/** Union of possible per-column data encodings. */
export type EJSONBatchColumnData = EJSONBatchColumnValues | EJSONBatchColumnPacked;

/** The payload for a batch-encoded value. */
export interface EJSONBatchPayload {
  version: EJSONBatchVersion;
  schema: EJSONBatchSchema;
  count: number; // number of rows
  data: Record<string, EJSONBatchColumnData>;
}

/** Top-level EJSON value representing a batch. */
export interface EJSONBatchJSON {
  $batch: EJSONBatchPayload;
}

/** Options for encoding a batch. */
export interface EJSONBatchEncodeOptions {
  /** Prefer packed objectId encoding where possible. */
  preferPackedObjectId?: boolean;
  /** Minimum array length to consider batch encoding. */
  minArrayLength?: number;
  /** Enable dictionary encoding for low-cardinality strings. */
  dictionary?: boolean;
  /** Enable delta encoding for monotonic timestamps. */
  deltaForDates?: boolean;
}

/** Options for decoding a batch. */
export interface EJSONBatchDecodeOptions {
  // Reserved for future controls (e.g., validation levels)
}

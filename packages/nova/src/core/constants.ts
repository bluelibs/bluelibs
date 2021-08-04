import { ILinkCollectionOptions } from "./defs";

export const LINK_STORAGE = Symbol("linkStorage");
export const REDUCER_STORAGE = Symbol("reducerStorage");
export const SCHEMA_STORAGE = Symbol("schemaStorage");
export const SCHEMA_AGGREGATE_STORAGE = Symbol("schemaAggregateStorage");
export const SCHEMA_BSON_AGGREGATE_DECODER_STORAGE = Symbol(
  "schemaBsonAggregateDecoderStorage"
);
export const SCHEMA_BSON_OBJECT_DECODER_STORAGE = Symbol(
  "schemaBsonObjectDecoderStorage"
);
export const SCHEMA_BSON_DOCUMENT_SERIALIZER = Symbol(
  "schemaBsonDocuemtnerializerStorage"
);
export const EXPANDER_STORAGE = Symbol("expandersStorage");
export const SPECIAL_PARAM_FIELD = "$";
export const ALIAS_FIELD = "$alias";
export const SCHEMA_FIELD = "$schema";
export const ALL_FIELDS = "$all";

export const SPECIAL_FIELDS = [
  SPECIAL_PARAM_FIELD,
  ALIAS_FIELD,
  SCHEMA_FIELD,
  ALL_FIELDS,
];

export const LINK_COLLECTION_OPTIONS_DEFAULTS: Partial<ILinkCollectionOptions> = {
  many: false,
  index: true,
};

import { ILinkCollectionOptions } from "./defs";

export const LINK_STORAGE = Symbol("linkStorage");
export const REDUCER_STORAGE = Symbol("reducerStorage");
export const EXPANDER_STORAGE = Symbol("expandersStorage");
export const SPECIAL_PARAM_FIELD = "$";
export const ALIAS_FIELD = "$alias";
export const CONTEXT_FIELD = "$context";
export const ALL_FIELDS = "$all";

export const SPECIAL_FIELDS = [SPECIAL_PARAM_FIELD, ALIAS_FIELD, ALL_FIELDS];

export const LINK_COLLECTION_OPTIONS_DEFAULTS: Partial<ILinkCollectionOptions> = {
  many: false,
  index: true,
};

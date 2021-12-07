import {
  IExpanderOptions,
  ILinkOptions,
  QueryBodyType,
  IReducerOption,
  IReducerOptions,
  IAstToQueryOptions,
  IQueryContext,
} from "./defs";

import {
  EXPANDER_STORAGE,
  LINK_STORAGE,
  REDUCER_STORAGE,
  SCHEMA_STORAGE,
  LINK_COLLECTION_OPTIONS_DEFAULTS,
  SCHEMA_AGGREGATE_STORAGE,
  SCHEMA_BSON_OBJECT_DECODER_STORAGE,
  SCHEMA_BSON_AGGREGATE_DECODER_STORAGE,
  SCHEMA_BSON_DOCUMENT_SERIALIZER,
} from "./constants";
import * as _ from "lodash";
import Linker from "./query/Linker";
import Query from "./query/Query";
import astToQuery, { secureBody } from "./graphql/astToQuery";
import { IGetLookupOperatorOptions } from "./query/Linker";
import { Collection } from "mongodb";
import { ClassSchema } from "@deepkit/type";
import CollectionNode from "./query/nodes/CollectionNode";
import { getBSONDecoder } from "@deepkit/bson";
import { ISecureOptions } from "./defs";

export { secureBody, Linker };

export function query<T>(
  collection: Collection,
  body: QueryBodyType,
  context?: IQueryContext
) {
  return new Query(collection, body, context);
}

query.securely = (
  config: ISecureOptions,
  collection: Collection,
  body: QueryBodyType,
  context?: IQueryContext
) => {
  return query(collection, secureBody(body, config), context);
};

query.graphql = (
  collection: Collection,
  ast: any,
  options: ISecureOptions,
  context?: IQueryContext
) => {
  return astToQuery(collection, ast, options, context);
};

export function clear(collection: Collection) {
  collection[LINK_STORAGE] = {};
  collection[REDUCER_STORAGE] = {};
  collection[EXPANDER_STORAGE] = {};
  collection[SCHEMA_STORAGE] = null;
}

export function addSchema(collection: Collection, schema: ClassSchema) {
  collection[SCHEMA_STORAGE] = schema;
  collection[SCHEMA_AGGREGATE_STORAGE] =
    CollectionNode.getAggregateSchema(schema);
  collection[SCHEMA_BSON_AGGREGATE_DECODER_STORAGE] = getBSONDecoder(
    collection[SCHEMA_AGGREGATE_STORAGE]
  );
  collection[SCHEMA_BSON_OBJECT_DECODER_STORAGE] = getBSONDecoder(schema);
  collection[SCHEMA_BSON_DOCUMENT_SERIALIZER] =
    CollectionNode.getSchemaSerializer(schema);
}

export function addLinks(collection: Collection, data: ILinkOptions) {
  if (!collection[LINK_STORAGE]) {
    collection[LINK_STORAGE] = {};
  }

  _.forEach(data, (linkConfig, linkName) => {
    if (collection[LINK_STORAGE][linkName]) {
      throw new Error(
        `You cannot add the link with name: ${linkName} because it was already added to ${this.collectionName} collection`
      );
    }

    const linker = new Linker(collection, linkName, {
      ...LINK_COLLECTION_OPTIONS_DEFAULTS,
      ...linkConfig,
    });

    Object.assign(collection[LINK_STORAGE], {
      [linkName]: linker,
    });
  });
}

export function addExpanders(collection: Collection, data: IExpanderOptions) {
  if (!collection[EXPANDER_STORAGE]) {
    collection[EXPANDER_STORAGE] = {};
  }

  _.forEach(data, (expanderConfig, expanderName) => {
    if (collection[EXPANDER_STORAGE][expanderName]) {
      throw new Error(`This expander was already added.`);
    }

    Object.assign(collection[EXPANDER_STORAGE], {
      [expanderName]: expanderConfig,
    });
  });
}

export function getLinker(collection: Collection, name: string): Linker {
  if (collection[LINK_STORAGE] && collection[LINK_STORAGE][name]) {
    return collection[LINK_STORAGE][name];
  } else {
    throw new Error(
      `Link "${name}" is not found in collection: "${collection.collectionName}"`
    );
  }
}

export function hasLinker(collection: Collection, name: string): boolean {
  if (collection[LINK_STORAGE]) {
    return Boolean(collection[LINK_STORAGE][name]);
  } else {
    return false;
  }
}

/**
 * This returns the correct aggregation pipeline operator
 * This is useful for complex searching and filtering
 */
export function lookup(
  collection: Collection,
  linkName: string,
  options?: IGetLookupOperatorOptions
) {
  return getLinker(collection, linkName).getLookupAggregationPipeline(options);
}

export function getReducerConfig(
  collection: Collection,
  name: string
): IReducerOption {
  if (collection[REDUCER_STORAGE]) {
    return collection[REDUCER_STORAGE][name];
  }
}

export function getExpanderConfig(
  collection: Collection,
  name: string
): QueryBodyType {
  if (collection[EXPANDER_STORAGE]) {
    return collection[EXPANDER_STORAGE][name];
  }
}

export function addReducers(collection: Collection, data: IReducerOptions) {
  if (!collection[REDUCER_STORAGE]) {
    collection[REDUCER_STORAGE] = {};
  }

  Object.keys(data).forEach((reducerName) => {
    const reducerConfig = data[reducerName];

    if (hasLinker(collection, reducerName)) {
      throw new Error(
        `You cannot add the reducer with name: ${reducerName} because it is already defined as a link in ${collection.collectionName} collection`
      );
    }

    if (collection[REDUCER_STORAGE][reducerName]) {
      throw new Error(
        `You cannot add the reducer with name: ${reducerName} because it was already added to ${collection.collectionName} collection`
      );
    }

    Object.assign(collection[REDUCER_STORAGE], {
      [reducerName]: reducerConfig,
    });
  });
}

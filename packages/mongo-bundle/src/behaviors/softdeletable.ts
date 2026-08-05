import { IAstToQueryOptions, QueryBodyType } from "@bluelibs/nova";
import type { DocumentNode } from "graphql";
import * as MongoDB from "mongodb";
import {
  BehaviorType,
  IContextAware,
  IExecutionContext,
  ISoftdeletableBehaviorOptions,
} from "../defs";
import { AfterDeleteEvent, BeforeDeleteEvent } from "../events";
import { Collection } from "../models/Collection";

const overridableMethods = [
  "find",
  "findOne",
  "findOneAndDelete",
  "findOneAndUpdate",
  "updateOne",
  "updateMany",
  "count",
];

export default function softdeletable(
  options: ISoftdeletableBehaviorOptions = {}
): BehaviorType {
  options.fields = Object.assign(
    {
      isDeleted: "isDeleted",
      deletedAt: "deletedAt",
      deletedBy: "deletedBy",
    },
    options.fields
  );
  const { fields } = options;

  // why: this behavior rewrites methods with heterogeneous signatures (find returns
  // a cursor, findOne a document, ...) on collections of arbitrary document types,
  // and sets dynamic field names not present on the schema; a generic collection
  // type cannot express that without losing the cursor/document return shapes.
  return (collection: Collection<any>) => {
    collection.onInit(async () => {
      await collection.collection.createIndex({
        [fields.isDeleted]: 1,
      });
    });

    collection.deleteOne = async (filter, _options) => {
      return emulateDeletion(collection, filter, _options, options, false);
    };

    collection.deleteMany = async (filter, _options) => {
      return emulateDeletion(collection, filter, _options, options, true);
    };

    // For all of them the filter field is the first argument
    overridableMethods.forEach((override) => {
      const old = collection[override];
      collection[override] = (
        filter: MongoDB.Filter<MongoDB.Document>,
        ...args: unknown[]
      ) => {
        return old.call(
          collection,
          getPreparedFiltersForSoftdeletion(filter, fields.isDeleted),
          ...args
        );
      };
    });

    const oldAggregate = collection.aggregate;
    collection.aggregate = (
      pipeline: MongoDB.Document[],
      options?: MongoDB.AggregateOptions
    ) => {
      // Search for pipeline a $match containing the isDeleted field
      let containsIsDeleted = false;
      for (const pipe of pipeline) {
        if (pipe.$match && pipe.$match[fields.isDeleted] !== undefined) {
          containsIsDeleted = true;
          break;
        }
      }
      if (!containsIsDeleted) {
        pipeline = [
          {
            $match: { isDeleted: { $ne: true } },
          },
          ...pipeline,
        ];
      }

      return oldAggregate.call(collection, pipeline, options);
    };

    const oldQuery = collection.query;
    collection.query = (
      request: QueryBodyType<MongoDB.Document>
    ): Promise<Array<Partial<MongoDB.Document>>> => {
      prepareQueryOptions(request, options);

      return oldQuery.call(collection, request);
    };

    const oldQueryOne = collection.queryOne;
    collection.queryOne = (
      request: QueryBodyType<MongoDB.Document>
    ): Promise<Partial<MongoDB.Document>> => {
      prepareQueryOptions(request, options);

      return oldQueryOne.call(collection, request);
    };

    const oldQueryGraphQL = collection.queryGraphQL;
    collection.queryGraphQL = <U = null>(
      ast: DocumentNode,
      config?: IAstToQueryOptions
    ): Promise<Array<Partial<U>>> => {
      config = prepareQueryGraphQLOptions(config || {}, options);

      return oldQueryGraphQL.call(collection, ast, config) as Promise<
        Array<Partial<U>>
      >;
    };

    const oldQueryOneGraphQL = collection.queryOneGraphQL;
    collection.queryOneGraphQL = <T = null>(
      ast: DocumentNode,
      config?: IAstToQueryOptions
    ): Promise<Partial<T>> => {
      config = prepareQueryGraphQLOptions(config || {}, options);

      return oldQueryOneGraphQL.call(collection, ast, config);
    };
  };
}

function prepareQueryGraphQLOptions(
  config: IAstToQueryOptions<null>,
  options: ISoftdeletableBehaviorOptions
) {
  const { fields } = options;
  if (!config) {
    config = {};
  }
  if (!config.filters) {
    config.filters = {};
  }
  config.filters = getPreparedFiltersForSoftdeletion(
    config.filters as MongoDB.Filter<MongoDB.Document>,
    fields.isDeleted
  );
  return config;
}

function prepareQueryOptions(
  request: QueryBodyType<MongoDB.Document>,
  options: ISoftdeletableBehaviorOptions
) {
  const { fields } = options;
  if (!request.$) {
    request.$ = {};
  } else {
    if (!request.$.filters) {
      request.$.filters = {};
    }
  }
  request.$.filters = getPreparedFiltersForSoftdeletion(
    request.$.filters as MongoDB.Filter<MongoDB.Document>,
    fields.isDeleted
  );
}

function getPreparedFiltersForSoftdeletion(
  filter: MongoDB.Filter<MongoDB.Document>,
  isDeletedField: string
) {
  filter = Object.assign({}, filter);
  if (filter[isDeletedField] === undefined) {
    filter = Object.assign({}, filter);
    filter[isDeletedField] = {
      $ne: true,
    };
  }

  return filter;
}

function extractUserID(context: IExecutionContext | null) {
  if (!context) {
    return null;
  }

  return context.userId || null;
}

/**
 * This function is responsible of marking an update and simulating an actual delete
 *
 * @param filter
 * @param options
 * @param collection
 * @param settings
 * @returns
 */
async function emulateDeletion(
  collection: Collection<any>,
  filter: MongoDB.Filter<MongoDB.Document>,
  options: IContextAware & MongoDB.OperationOptions,
  softdeleteOptions: ISoftdeletableBehaviorOptions,
  isMany: boolean
): Promise<MongoDB.DeleteResult> {
  await collection.emit(
    new BeforeDeleteEvent({
      filter,
      isMany,
      context: options?.context,
      options,
    })
  );

  const mongoCollection = collection.collection;

  // We do it directly on the collection to avoid event dispatching
  const { fields } = softdeleteOptions;
  const result = (await mongoCollection[
    isMany ? "updateMany" : "updateOne"
  ].call(
    mongoCollection,
    getPreparedFiltersForSoftdeletion(filter, fields.isDeleted),
    {
      $set: {
        [softdeleteOptions.fields.isDeleted]: true,
        [fields.deletedAt]: new Date(),
        [fields.deletedBy]: extractUserID(options?.context),
      },
    },
    options
  )) as MongoDB.UpdateResult;

  await collection.emit(
    new AfterDeleteEvent({
      filter,
      isMany,
      context: options?.context,
      result: {
        ...result,
        deletedCount: result.modifiedCount,
      },
      options,
    })
  );

  return {
    ...result,
    deletedCount: result.modifiedCount,
  };
}

import { IAstToQueryOptions, QueryBodyType } from "@bluelibs/nova";
import * as MongoDB from "mongodb";
import {
  BehaviorType,
  IContextAware,
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

  return (collection: Collection<any>) => {
    collection.deleteOne = async (filter, _options) => {
      return emulateDeletion(collection, filter, _options, options, false);
    };

    collection.deleteMany = async (filter, _options) => {
      return emulateDeletion(collection, filter, _options, options, true);
    };

    // For all of them the filter field is the first argument
    overridableMethods.forEach((override) => {
      const old = collection[override];
      collection[override] = (filter: MongoDB.Filter<any>, ...args: any[]) => {
        return old.call(
          collection,
          getPreparedFiltersForSoftdeletion(filter, fields.isDeleted),
          ...args
        );
      };
    });

    const oldAggregate = collection.aggregate;
    collection.aggregate = (
      pipeline: any[],
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
    collection.query = (request: QueryBodyType<any>): Promise<any[]> => {
      prepareQueryOptions(request, options);

      return oldQuery.call(collection, request);
    };

    const oldQueryOne = collection.queryOne;
    collection.queryOne = (request: QueryBodyType<any>): Promise<any> => {
      prepareQueryOptions(request, options);

      return oldQueryOne.call(collection, request);
    };

    const oldQueryGraphQL = collection.queryGraphQL;
    collection.queryGraphQL = (
      ast: any,
      config?: IAstToQueryOptions
    ): Promise<any[]> => {
      config = prepareQueryGraphQLOptions(config || {}, options);

      return oldQueryGraphQL.call(collection, ast, config);
    };

    const oldQueryOneGraphQL = collection.queryOneGraphQL;
    collection.queryOneGraphQL = (
      ast: any,
      config?: IAstToQueryOptions
    ): Promise<any[]> => {
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
    config.filters,
    fields.isDeleted
  );
  return config;
}

function prepareQueryOptions(
  request: QueryBodyType<any>,
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
    request.$.filters,
    fields.isDeleted
  );
}

function getPreparedFiltersForSoftdeletion(
  filter: MongoDB.Filter<any>,
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

function extractUserID(context: any) {
  if (!context) {
    return null;
  }

  return context["userId"] || null;
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
  filter: MongoDB.Filter<any>,
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

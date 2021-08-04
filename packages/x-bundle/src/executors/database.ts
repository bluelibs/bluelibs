import { Collection, DocumentNotFoundException } from "@bluelibs/mongo-bundle";
import { getResult } from "@bluelibs/graphql-bundle";
import { IAstToQueryOptions } from "@bluelibs/nova";
import { Constructor, ContainerInstance } from "@bluelibs/core";
import { FilterQuery, UpdateQuery } from "mongodb";
import { detectPipelineInSideBody } from "./utils/detectPipelineInSideBody";
import { performRelationalSorting } from "./utils/performRelatinalSorting";

type GraphQLToNovaOptionsResolverType<T> = (
  _,
  args,
  ctx,
  ast
) => IAstToQueryOptions<T> | Promise<IAstToQueryOptions<T>>;

const prepareForExecution = (
  collectionClass,
  astToQueryOptions: IAstToQueryOptions,
  container: ContainerInstance
): void => {
  let { sideBody, ...cleanedOptions } = astToQueryOptions.options || {};
  if (!sideBody) {
    sideBody = {};
    astToQueryOptions.sideBody = sideBody;
  } else {
    // This ensures we don't have any pipeline
    detectPipelineInSideBody(sideBody);
  }

  if (!sideBody.$) {
    sideBody.$ = {};
  }

  // The sort from options takes owning
  const sort = cleanedOptions?.sort || sideBody.$.options?.sort;

  if (sort && Object.keys(sort).length > 0) {
    const pipeline = performRelationalSorting(container, collectionClass, sort);
    if (pipeline.length) {
      if (sideBody.$.pipeline) {
        sideBody.$.pipeline.push(...pipeline);
      } else {
        sideBody.$.pipeline = pipeline;
      }
    }
  }
};

const defaultNovaOptionsResolver: GraphQLToNovaOptionsResolverType<any> = async (
  _,
  args
) => {
  const { query } = args;
  return {
    filters: query?.filters || {},
    options: query?.options || {},
  };
};

/**
 * If your input is of "QueryInput" it will automatically apply the filters and options
 * @param collectionClass
 * @param optionsResolver
 */
export function ToNova<T>(
  collectionClass: Constructor<Collection<T>>,
  optionsResolver?: GraphQLToNovaOptionsResolverType<T>
) {
  if (!optionsResolver) {
    optionsResolver = defaultNovaOptionsResolver;
  }

  return async function (_, args, ctx, ast) {
    const options = await optionsResolver(_, args, ctx, ast);
    prepareForExecution(collectionClass, options, ctx.container);

    const collection = ctx.container.get(collectionClass);

    return collection.queryGraphQL(ast, options);
  };
}

export function ToNovaOne<T>(
  collectionClass: Constructor<Collection<T>>,
  optionsResolver?: GraphQLToNovaOptionsResolverType<T>
) {
  if (!optionsResolver) {
    optionsResolver = defaultNovaOptionsResolver;
  }

  return async function (_, args, ctx, ast) {
    const options = await optionsResolver(_, args, ctx, ast);
    prepareForExecution(collectionClass, options, ctx.container);

    const collection = ctx.container.get(collectionClass);

    return collection.queryOneGraphQL(ast, options);
  };
}

export function ToNovaByResultID<T>(
  collectionClass: Constructor<Collection<T>>,
  optionsResolver?: GraphQLToNovaOptionsResolverType<T>
) {
  if (!optionsResolver) {
    optionsResolver = async (_, args, ctx, ast) => {
      const graphqlOptions = {
        filters: {
          _id: getResult(ctx),
        },
      };

      return graphqlOptions;
    };
  }
  return async function (_, args, ctx, ast) {
    const collection = ctx.container.get(collectionClass);
    const options = await optionsResolver(_, args, ctx, ast);

    prepareForExecution(collectionClass, options, ctx.container);

    return collection.queryOneGraphQL(ast, options);
  };
}

export function ToCollectionCount<T>(
  collectionClass: Constructor<Collection<T>>,
  filterResolver?: (
    _,
    args,
    ctx,
    ast
  ) => FilterQuery<T> | Promise<FilterQuery<T>>
) {
  if (!filterResolver) {
    filterResolver = (_, args) => {
      if (args.filters) {
        return args.filters;
      }

      return args.query?.filters || {};
    };
  }

  return async function (_, args, ctx, ast) {
    const filters = await filterResolver(_, args, ctx, ast);
    const collection = ctx.container.get(collectionClass);

    return collection.find(filters).count();
  };
}

/**
 * This executor will throw an error if the document is not found
 * @param collectionClass
 * @param idResolver
 */
export function CheckDocumentExists(
  collectionClass: Constructor<Collection<any>>,
  idResolver?: (args: any) => any | Promise<any>
) {
  if (!idResolver) {
    idResolver = (args) => args._id;
  }

  return async function (_, args, ctx, ast) {
    const collection = ctx.container.get(collectionClass);

    const document = await collection.findOne(
      { _id: await idResolver(args) },
      { projection: { _id: 1 } }
    );

    if (!document) {
      throw new DocumentNotFoundException();
    }
  };
}

export function ToDocumentInsert(
  collectionClass: Constructor<Collection<any>>,
  field = "document"
) {
  return async function (_, args, ctx, ast) {
    const collection: Collection = ctx.container.get(collectionClass);
    const result = await collection.insertOne(args[field], {
      context: {
        userId: ctx.userId,
      },
    });

    return result.insertedId;
  };
}

/**
 * @param collectionClass
 * @param idArgumentResolver How to get the _id based on the arguments?
 * @param mutateResolver This should return the update query. {$set: something}
 */
export function ToDocumentUpdateByID<T>(
  collectionClass: Constructor<Collection<T>>,
  idArgumentResolver?: (args) => any | Promise<any>,
  mutateResolver?: (args) => UpdateQuery<T> | Promise<UpdateQuery<T>>
) {
  if (!idArgumentResolver) {
    idArgumentResolver = (args) => args._id;
  }
  if (!mutateResolver) {
    mutateResolver = (args) => {
      return args.modifier;
    };
  }

  return async function (_, args, ctx, ast) {
    const collection: Collection = ctx.container.get(collectionClass);
    const _id = await idArgumentResolver(args);

    await collection.updateOne({ _id }, await mutateResolver(args), {
      context: {
        userId: ctx.userId,
      },
    });

    return _id;
  };
}

export function ToDocumentDeleteByID(
  collectionClass: Constructor<Collection<any>>,
  idArgumentResolver?: (args) => any | Promise<any>
) {
  if (!idArgumentResolver) {
    idArgumentResolver = (args) => args._id;
  }

  return async function (_, args, ctx, ast) {
    const collection: Collection<any> = ctx.container.get(collectionClass);
    const _id = await idArgumentResolver(args);

    await collection.deleteOne({ _id });

    return true;
  };
}

import { Collection, DocumentNotFoundException } from "@bluelibs/mongo-bundle";
import { getResult, IGraphQLContext } from "@bluelibs/graphql-bundle";
import { Constructor } from "@bluelibs/core";
import { Filter, UpdateFilter } from "mongodb";
import { prepareForExecution } from "./utils/prepareForExecution";
import { GraphQLToNovaOptionsResolverType } from "./utils/GraphQLToNovaOptionsResolverType";
import { NOVA_AST_TO_QUERY_OPTIONS } from "./security";
import { IAstToQueryOptions, AnyifyFieldsWithIDs as Clean } from "@bluelibs/nova";

const defaultNovaOptionsResolver: GraphQLToNovaOptionsResolverType<
  any
> = async (_, args) => {
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
    let options = await optionsResolver(_, args, ctx, ast);
    options = prepareForExecution(
      ctx,
      collectionClass,
      options
    ) as IAstToQueryOptions<T>;

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
    let options = await optionsResolver(_, args, ctx, ast);
    options = prepareForExecution(
      ctx,
      collectionClass,
      options
    ) as IAstToQueryOptions<T>;

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
      } as any;

      return graphqlOptions;
    };
  }
  return async function (_, args, ctx, ast) {
    const collection = ctx.container.get(collectionClass);
    let options = await optionsResolver(_, args, ctx, ast);
    options = prepareForExecution(
      ctx,
      collectionClass,
      options
    ) as IAstToQueryOptions<T>;

    return collection.queryOneGraphQL(ast, options);
  };
}

export function ToCollectionCount<T>(
  collectionClass: Constructor<Collection<T>>,
  filterResolver?: (_, args, ctx, ast) => Filter<Clean<T>> | Promise<Filter<Clean<T>>>
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
    if (ctx[NOVA_AST_TO_QUERY_OPTIONS]?.filters) {
      Object.assign(filters, ctx[NOVA_AST_TO_QUERY_OPTIONS]?.filters);
    }
    const collection = ctx.container.get(collectionClass);

    return collection.find(filters).count();
  };
}

/**
 * This executor will throw an error if the document is not found
 * @param collectionClass
 * @param idResolver
 */
export function CheckDocumentExists<T>(
  collectionClass: Constructor<Collection<T>>,
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

/**
 * Inserts the document in the required collection.
 * @param collectionClass
 * @param field The field from GRAPHQL arguments
 * @param extend Possibly extend the document, such as adding additional fields like a userId or whatever you wish.
 * @returns
 */
export function ToDocumentInsert<T>(
  collectionClass: Constructor<Collection<T>>,
  field = "document",
  extend?: (document: any, ctx: IGraphQLContext) => void | Promise<void>
) {
  return async function (_, args, ctx, ast) {
    const collection: Collection = ctx.container.get(collectionClass);
    const document = args[field];
    if (extend) {
      await extend(document, ctx);
    }

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
  mutateResolver?: (args) => UpdateFilter<Clean<T>> | Promise<UpdateFilter<Clean<T>>>
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

export function ToDocumentDeleteByID<T>(
  collectionClass: Constructor<Collection<T>>,
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

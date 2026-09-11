// import intersectDeep from "../../core/query/lib/intersectDeep";
import * as _ from "lodash";
import graphqlFields from "graphql-fields";
import { SPECIAL_PARAM_FIELD } from "../constants";
import Query from "../query/Query";
import intersectBody from "./intersectBody";
import {
  QueryBodyType,
  IAstToQueryOptions,
  IQueryContext,
  IQueryOptions,
  ISecureOptions,
} from "../defs";
import { mergeDeep } from "./mergeDeep";
import { Collection } from "mongodb";
import type {
  DocumentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  SelectionNode,
} from "graphql";

export const ArgumentStore = Symbol("GraphQLArgumentStore");

const Errors = {
  MAX_DEPTH: "The maximum depth of this request exceeds the depth allowed.",
};

type QueryBodyWithArguments = QueryBodyType & { [ArgumentStore]?: Record<string, unknown> };

/**
 * The GraphQL query input accepted by the body builders: either a parsed
 * document node, or the fieldNodes/fragments projection produced by
 * `astQueryToInfo` (the resolve-info shape consumed by graphql-fields).
 */
export type GraphqlQueryInput =
  | DocumentNode
  | {
      fieldNodes: readonly SelectionNode[];
      fragments: Record<string, FragmentDefinitionNode>;
    };

export function astToBody(ast: GraphqlQueryInput): QueryBodyType {
  const body = graphqlFields(ast, {}, { processArguments: true, excludedFields: ["__typename"] });

  replaceArgumentsWithOurs(body);

  return body;
}

function replaceArgumentsWithOurs(body: Record<string, unknown>) {
  _.forEach(body, (value, key) => {
    if (key === "__arguments") {
      const args: Record<string, unknown> = {};
      (value as Array<Record<string, { value: unknown }>>).forEach((argument) => {
        _.forEach(argument, (value, key) => {
          args[key] = value.value;
        });
      });

      (body as QueryBodyWithArguments)[ArgumentStore] = args;
      delete body[key];

      return;
    }

    if (_.isObject(value)) {
      replaceArgumentsWithOurs(value as Record<string, unknown>);
    }
  });
}

export default function astToQuery<T = Document>(
  collection: Collection<T>,
  ast: GraphqlQueryInput,
  config: IAstToQueryOptions = {},
  context?: IQueryContext
) {
  // get the body
  let body = astToBody(ast);
  body = secureBody(body, config);

  if (config.embody) {
    const getArguments = createGetArguments(body);
    config.embody.call(null, body, getArguments);
  }

  // we return the query
  return new Query(collection, body, context);
}

/**
 * Used to secure and apply limits to your body graph
 * @param body
 * @param config
 * @returns
 */
export function secureBody<T = null>(body: QueryBodyType<T>, config: ISecureOptions<T> = {}) {
  body = Object.assign({}, body) as QueryBodyType<T>;

  if (!body.$) {
    body.$ = {};
  }

  if (typeof body.$ !== "function") {
    if (config.filters) {
      body.$.filters = config.filters;
    }

    if (config.options) {
      body.$.options = config.options;
    }
  } else {
    if (config.options || config.filters) {
      throw new Error(
        `You tried to apply filters and options on a functionable parameterable object.`
      );
    }
  }

  if (config.sideBody) {
    mergeDeep(body, config.sideBody);
  }

  // figure out depth based
  if (config.maxDepth) {
    const currentMaxDepth = getMaxDepth(body);
    if (currentMaxDepth > config.maxDepth) {
      throw new Error(Errors.MAX_DEPTH);
    }
  }

  if (config.deny) {
    deny(body, config.deny);
  }

  if (config.intersect) {
    body = intersectBody(body, config.intersect) as QueryBodyType<T>;
  }

  // enforce the maximum amount of data we allow to retrieve
  if (config.maxLimit) {
    enforceMaxLimit(body[SPECIAL_PARAM_FIELD], config.maxLimit);
  }

  return body;
}

export function getMaxDepth(body: QueryBodyType) {
  const depths: number[] = [];
  for (const key in body) {
    if (key !== SPECIAL_PARAM_FIELD && _.isObject(body[key])) {
      depths.push(getMaxDepth(body[key] as QueryBodyType));
    }
  }

  if (depths.length === 0) {
    return 1;
  }

  return Math.max(...depths) + 1;
}

/**
 * This function performs modifications and alterations on the body
 * By removing the fields that are denied.
 *
 * @param body
 * @param fields
 */
export function deny(body: QueryBodyType, fields: string[]) {
  fields.forEach((field) => {
    const parts = field.split(".");
    let accessor: Record<string, unknown> = body as Record<string, unknown>;
    while (parts.length !== 0) {
      if (parts.length === 1) {
        delete accessor[parts[0]];
      } else {
        if (!_.isObject(accessor)) {
          break;
        }
        accessor = accessor[parts[0]] as Record<string, unknown>;
      }
      parts.shift();
    }
  });

  return clearEmptyObjects(body as Record<string, unknown>);
}

export function clearEmptyObjects(body: Record<string, unknown>) {
  // clear empty nodes then back-propagate
  for (const key in body) {
    if (_.isObject(body[key])) {
      const shouldDelete = clearEmptyObjects(body[key] as Record<string, unknown>);
      if (shouldDelete) {
        delete body[key];
      }
    }
  }

  return Object.keys(body).length === 0;
}

/**
 * Ensures that there is a limit for the data you want to receive
 * @param props
 * @param maxLimit
 */
export function enforceMaxLimit(props: { options?: IQueryOptions }, maxLimit: number) {
  if (!props.options) {
    props.options = {};
  }

  const options = props.options;

  if (maxLimit === undefined) {
    return;
  }

  if (options.limit) {
    if (options.limit > maxLimit) {
      options.limit = maxLimit;
    }
  } else {
    options.limit = maxLimit;
  }
}

// The converter function
export function astQueryToInfo(astToInfo: DocumentNode): {
  fieldNodes: readonly SelectionNode[];
  fragments: Record<string, FragmentDefinitionNode>;
} {
  const operation = astToInfo.definitions.find(
    (def): def is OperationDefinitionNode => def.kind === "OperationDefinition"
  );
  const fragments = astToInfo.definitions
    .filter((def): def is FragmentDefinitionNode => def.kind === "FragmentDefinition")
    .reduce<Record<string, FragmentDefinitionNode>>(
      (result, current) => ({
        ...result,
        [current.name.value]: current,
      }),
      {}
    );

  return {
    fieldNodes: operation.selectionSet.selections,
    fragments,
  };
}

export function createGetArguments(body: QueryBodyType) {
  return function (path: string): Record<string, unknown> {
    const parts = path.split(".");
    let stopped = false;
    let accessor: Record<string, unknown> = body as Record<string, unknown>;
    for (let i = 0; i < parts.length; i++) {
      if (!accessor) {
        stopped = true;
        break;
      }

      if (accessor[parts[i]]) {
        accessor = accessor[parts[i]] as Record<string, unknown>;
      }
    }

    if (stopped) {
      return {};
    }

    // accessor is guaranteed non-null here: the loop above breaks with stopped
    // set whenever accessor becomes falsy.
    return (accessor as QueryBodyWithArguments)[ArgumentStore] || {};
  };
}

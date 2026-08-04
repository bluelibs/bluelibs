import { IResolverMap, IFunctionMap, GraphQLResolverType } from "./defs";

/**
 * This is the symbol in which we store the result that can be used by the next resolver plugin
 */
export const ResultSymbol = Symbol("GraphQLResolverResult");

/**
 * Get the value stored in an object
 */
export function getResult(object: any) {
  return object[ResultSymbol];
}

export function execute(map: IFunctionMap): IFunctionMap {
  const newMap: IFunctionMap = {};

  for (const key in map) {
    newMap[key] = craftFunction(map[key]);
  }

  return newMap;
}

export function group(
  before: GraphQLResolverType[] = [],
  map: IFunctionMap = {},
  after: GraphQLResolverType[] = []
): IResolverMap {
  const newMap: IFunctionMap = {};
  for (const key in map) {
    newMap[key] = craftFunction(map[key], before, after);
  }

  return newMap as unknown as IResolverMap;
}

export function craftFunction(
  definition: GraphQLResolverType | GraphQLResolverType[],
  before: GraphQLResolverType[] = [],
  after: GraphQLResolverType[] = []
) {
  if (typeof definition === "function") {
    if (before.length === 0 && after.length === 0) {
      // Nothing to do here, no need to wrap this function with another function for no reason.
      return definition;
    }
  }

  if (!Array.isArray(definition)) {
    definition = [definition];
  }

  const defs = [...before, ...definition, ...after];

  return async (...resolverArguments: any[]) => {
    let result;
    for (const i in defs) {
      const index = Number(i);
      result = await (defs[index] as (...args: any[]) => any)(...resolverArguments);
      // Adapt the context and store the result inside ResultSymbol
      if (result) {
        resolverArguments[2] && (resolverArguments[2][ResultSymbol] = result);
      }
    }

    return result;
  };
}

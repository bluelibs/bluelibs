import { GraphQLScalarType, GraphQLTypeResolver, GraphQLFieldResolver } from "graphql";
import { IGraphQLContext } from "./";

export type InputType<T> = {
  input: T;
};

export type OneOrMore<T> = T | T[];
// why: constructors may take any number of arguments of any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = { new (...args: any[]): T };

// why: the resolver `source` (parent) type is dynamic by GraphQL convention
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GraphQLResolverType =
  GraphQLFieldResolver<any, IGraphQLContext> | GraphQLTypeResolver<any, IGraphQLContext>;

export type SubscriptionResolver = {
  subscribe: GraphQLResolverType | GraphQLResolverType[];
  // why: subscription payloads are arbitrary; typing them as unknown would break consumer resolve functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve?: (payload: any) => any;
};

export interface IFunctionMapSimple {
  // why: the resolver `source` (parent) type is dynamic by GraphQL convention
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]:
    GraphQLTypeResolver<any, IGraphQLContext> | GraphQLFieldResolver<any, IGraphQLContext>;
}

export interface IFunctionMap {
  [key: string]: OneOrMore<GraphQLResolverType>;
}

export interface ISchemaDirectiveMap {
  // why: schema directives hold arbitrary configuration and may be passed as arrays of maps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ILoadOptions {
  typeDefs?: OneOrMore<string>;
  resolvers?: OneOrMore<IResolverMap>;
  schemaDirectives?: ISchemaDirectiveMap;
  contextReducers?: OneOrMore<IContextReducer>;
}

export interface ISubscriptionFunctionMap {
  [key: string]: OneOrMore<SubscriptionResolver>;
}

// why: the GraphQL context shape is extended by every bundle and is dynamic at the reducer boundary
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IContextReducer = (context: any) => any;

/**
 * The resolver map contains chaining at resolver level, but you can also add previous and after chains by specifying them as arrays
 */
export type GroupedResolvers = [GraphQLResolverType[], IFunctionMap, Array<GraphQLResolverType>?];

// why: scalar field resolvers receive dynamic resolver arguments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrimitiveType = string | number | boolean | ((...args: any[]) => any);

export interface IResolverMap {
  Query?: IFunctionMap | GroupedResolvers;
  Mutation?: IFunctionMap | GroupedResolvers;
  Subscription?: ISubscriptionFunctionMap;
  [entityResolver: string]:
    | IFunctionMap
    | ISubscriptionFunctionMap
    | GraphQLScalarType
    | {
        [key: string]: PrimitiveType;
      }
    | GroupedResolvers
    | undefined;
}

export interface IGraphQLModule {
  typeDefs?: string | string[];
  resolvers?: IResolverMap;
  schemaDirectives?: ISchemaDirectiveMap;
  contextReducers: IContextReducer[];
}

export interface ISchemaResult {
  typeDefs?: string;
  resolvers?: IFunctionMapSimple;
  schemaDirectives?: ISchemaDirectiveMap;
  contextReducers: IContextReducer[];
}

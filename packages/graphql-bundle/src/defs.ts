import {
  GraphQLScalarType,
  GraphQLTypeResolver,
  GraphQLFieldResolver,
} from "graphql";
import { IGraphQLContext } from "./";

export type InputType<T> = {
  input: T;
};

export type OneOrMore<T> = T | T[];
export type Constructor<T> = { new (...args: any[]): T };

export type GraphQLResolverType =
  | GraphQLFieldResolver<any, IGraphQLContext>
  | GraphQLTypeResolver<any, IGraphQLContext>;

export type SubscriptionResolver = {
  subscribe: GraphQLResolverType | GraphQLResolverType[];
  resolve?: (payload: any) => any;
};

export interface IFunctionMapSimple {
  [key: string]:
    | GraphQLTypeResolver<any, IGraphQLContext>
    | GraphQLFieldResolver<any, IGraphQLContext>;
}

export interface IFunctionMap {
  [key: string]: OneOrMore<GraphQLResolverType>;
}

export interface ISchemaDirectiveMap {
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

export type IContextReducer = (context: any) => any;

/**
 * The resolver map contains chaining at resolver level, but you can also add previous and after chains by specifying them as arrays
 */
export type GroupedResolvers = [
  GraphQLResolverType[],
  IFunctionMap,
  Array<GraphQLResolverType>?
];

type PrimitiveType = string | number | boolean | Function;

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
    | GroupedResolvers;
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

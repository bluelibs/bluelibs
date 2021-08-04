import {
  IContextReducer,
  ILoadOptions,
  ISchemaDirectiveMap,
  IGraphQLModule,
  IResolverMap,
  ISchemaResult,
  IFunctionMapSimple,
} from "./defs";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { OneOrMore, SubscriptionResolver } from "./defs";
import { group, execute, craftFunction } from "./executor";
import { Service } from "@bluelibs/core";

@Service()
export class Loader {
  protected typeDefs: string[] = [];
  protected resolvers: IResolverMap[] = [];
  protected schemas: any[] = [];
  protected schemaDirectives: ISchemaDirectiveMap[] = [];
  protected contextReducers: IContextReducer[] = [];

  /**
   * Loads GraphQL stuff
   * @param options
   */
  load(options: OneOrMore<ILoadOptions>): void {
    if (Array.isArray(options)) {
      return options.forEach((option) => this.load(option));
    }

    for (const key in options) {
      if (this[key]) {
        const value = this.getAsArray(options[key]);
        this[key].push(...value);
      }
    }
  }

  /**
   * Returns the loaded schema
   */
  getSchema(): ISchemaResult {
    const resolvers = this.getTransformedResolvers();

    return {
      typeDefs: mergeTypeDefs(this.typeDefs, {
        throwOnConflict: true,
        commentDescriptions: true,
        reverseDirectives: true,
      }),
      resolvers: (mergeResolvers(resolvers) as unknown) as IFunctionMapSimple,
      schemaDirectives: this.mergeSchemaDirectives(),
      contextReducers: this.contextReducers,
    };
  }

  protected getTransformedResolvers(): IResolverMap[] {
    // Transform resolvers for Query/Mutation
    const newResolvers: IResolverMap[] = [];
    this.resolvers.forEach((resolverMap) => {
      for (const rootType in resolverMap) {
        if (["Query", "Mutation"].includes(rootType)) {
          const aliasedRootType = rootType as "Query" | "Mutation";
          const resolverMapRootType = resolverMap[aliasedRootType];

          let newRootResolver;
          if (Array.isArray(resolverMapRootType)) {
            newRootResolver = { [rootType]: group(...resolverMapRootType) };
          } else {
            newRootResolver = { [rootType]: execute(resolverMapRootType) };
          }

          newResolvers.push(newRootResolver);
        } else if (rootType === "Subscription") {
          // Subscriptions resolvers are composed of two parts, resolve & subscribe
          // We only need to allow subscribe to work well
          const newResolverMap = {};
          for (const key in resolverMap[rootType]) {
            let newResolver: Partial<SubscriptionResolver> = Object.assign(
              {
                resolve: (payload) => payload,
              },
              resolverMap[rootType][key]
            );

            newResolver.subscribe = craftFunction(newResolver.subscribe);
            newResolverMap[key] = newResolver;
          }
          newResolvers.push({ Subscription: newResolverMap });
        } else {
          newResolvers.push(resolverMap);
        }
      }
    });

    return newResolvers;
  }

  /**
   * Goes one by one in the schema directives
   */
  protected mergeSchemaDirectives() {
    const final = {};
    this.schemaDirectives.forEach((directives) => {
      Object.assign(final, directives);
    });

    return final;
  }

  /**
   * If the object is not array it returns you the object as array
   * @param obj
   */
  protected getAsArray(obj) {
    if (!obj) {
      return [];
    }

    return Array.isArray(obj) ? obj : [obj];
  }
}

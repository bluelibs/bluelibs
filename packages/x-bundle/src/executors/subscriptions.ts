import { Constructor } from "@bluelibs/core";
import { Collection } from "@bluelibs/mongo-bundle";
import { SubscriptionStore } from "../services/SubscriptionStore";
import { IGraphQLContext } from "@bluelibs/graphql-bundle";
import { QueryBodyType } from "@bluelibs/nova";
import { Filter } from "mongodb";
import { SubscriptionProcessorOptionsType } from "../models/SubscriptionProcessor";

type ResolverType<T> = (_, args, ctx: IGraphQLContext, ast) => T | Promise<T>;

export function ToSubscription<T>(
  collectionClass: Constructor<Collection<T>>,
  bodyResolver?: ResolverType<QueryBodyType<T>> | null,
  subscriptionOptionsResolver?: ResolverType<SubscriptionProcessorOptionsType>
) {
  if (!bodyResolver) {
    bodyResolver = async (_, args, ctx: IGraphQLContext, ast) => args.body;
  }
  return async function (_, args, ctx: IGraphQLContext, ast) {
    const { container } = ctx;
    const collection = container.get(collectionClass);
    const subscriptionStore = container.get(SubscriptionStore);
    const body = await bodyResolver(_, args, ctx, ast);

    return subscriptionStore.createAsyncIterator(
      collection,
      body,
      subscriptionOptionsResolver
        ? await subscriptionOptionsResolver(_, args, ctx, ast)
        : {}
    );
  };
}

export function ToSubscriptionCount<T>(
  collectionClass: Constructor<Collection<T>>,
  filtersResolver?: ResolverType<Filter<T>> | null,
  subscriptionOptionsResolver?: ResolverType<SubscriptionProcessorOptionsType>
) {
  if (!filtersResolver) {
    filtersResolver = async (_, args, ctx: IGraphQLContext, ast) =>
      args.filters;
  }
  return async function (_, args, ctx: IGraphQLContext, ast) {
    const { container } = ctx;
    const collection = container.get(collectionClass);
    const subscriptionStore = container.get(SubscriptionStore);
    const filters = await filtersResolver(_, args, ctx, ast);

    return subscriptionStore.createAsyncIteratorForCounting(
      collection,
      filters,
      subscriptionOptionsResolver
        ? await subscriptionOptionsResolver(_, args, ctx, ast)
        : {}
    );
  };
}

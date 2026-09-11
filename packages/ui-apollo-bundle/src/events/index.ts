import { GraphQLRequest } from "@apollo/client/link/core";
import { Event } from "@bluelibs/core";

export class ApolloBeforeOperationEvent extends Event<{
  context: {
    [key: string]: unknown;
  };
  operation: GraphQLRequest;
}> {}

export class ApolloSubscriptionOnConnectionParamsSetEvent extends Event<{
  params: Record<string, unknown>;
}> {}

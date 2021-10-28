<<<<<<< HEAD
import { GraphQLRequest } from "@apollo/client/link/core";
=======
>>>>>>> 047d18a ((initial changes))
import { Event } from "@bluelibs/core";
import { ConnectionParams } from "subscriptions-transport-ws";

export class ApolloBeforeOperationEvent extends Event<{
<<<<<<< HEAD
  context: {
    [key: string]: any;
  };
  operation: GraphQLRequest;
}> {}

export class ApolloSubscriptionOnConnectionParamsSetEvent extends Event<{
  params: ConnectionParams;
=======
  headers?: Record<string, any>;
  subscriptionConnectionParams?: ConnectionParams;
  isSubscription?: boolean;
>>>>>>> 047d18a ((initial changes))
}> {}

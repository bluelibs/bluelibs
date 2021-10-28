import { Event } from "@bluelibs/core";
import { ConnectionParams } from "subscriptions-transport-ws";

export class ApolloBeforeOperationEvent extends Event<{
  headers?: Record<string, any>;
  subscriptionConnectionParams?: ConnectionParams;
  isSubscription?: boolean;
}> {}

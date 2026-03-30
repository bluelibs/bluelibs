import { ApolloLink, GraphQLRequest, split } from "@apollo/client/core";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { EventManager } from "@bluelibs/core";
import { setContext } from "apollo-link-context";
import { Client, createClient } from "graphql-ws";
import {
  ApolloBeforeOperationEvent,
  ApolloSubscriptionOnConnectionParamsSetEvent,
} from "../../events";
import createUploadLink from "../uploads/createUploadLink";

const createContextLink = (eventManager: EventManager) => {
  return setContext(async (operation: GraphQLRequest, prevContext: any) => {
    const newContext = Object.assign({}, prevContext);

    await eventManager.emit(
      new ApolloBeforeOperationEvent({ context: newContext, operation })
    );

    return newContext;
  });
};

type CreateLinkOptions = {
  subscriptions: boolean;
};

export function createApolloLink(
  eventManager: EventManager,
  uri: string,
  options: CreateLinkOptions = {
    subscriptions: true,
  }
): {
  httpLink: ApolloLink;
  finalLink: ApolloLink;
  wsLink?: GraphQLWsLink;
  subscriptionClient?: Client;
} {
  const uploadLink = createUploadLink({
    uri,
  });
  const enhancedHttpLink = ApolloLink.from([
    createContextLink(eventManager) as any,
    uploadLink,
  ]);

  let wsLink = null,
    subscriptionClient = null,
    finalLink = enhancedHttpLink;

  if (options.subscriptions) {
    subscriptionClient = createClient({
      url: uri.replace("http://", "ws://").replace("https://", "wss://"),
      connectionParams: async () => {
        const params: Record<string, any> = {};

        await eventManager.emit(
          new ApolloSubscriptionOnConnectionParamsSetEvent({
            params,
          })
        );

        return params;
      },
    });
    wsLink = new GraphQLWsLink(subscriptionClient);
    // The split function takes three parameters:
    //
    // * A function that's called for each operation to execute
    // * The Link to use for an operation if the function returns a "truthy" value
    // * The Link to use for an operation if the function returns a "falsy" value
    finalLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      enhancedHttpLink
    );
  }

  return {
    finalLink,
    wsLink,
    subscriptionClient,
    httpLink: enhancedHttpLink,
  };
}

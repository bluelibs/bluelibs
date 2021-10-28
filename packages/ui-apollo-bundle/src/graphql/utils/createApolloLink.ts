<<<<<<< HEAD:packages/ui-apollo-bundle/src/graphql/utils/createApolloLink.ts
import { split, ApolloLink, GraphQLRequest } from "@apollo/client/core";
=======
import { split, ApolloLink } from "@apollo/client/core";
>>>>>>> 047d18a ((initial changes)):packages/x-ui/src/graphql/utils/createApolloLink.ts
import { createUploadLink } from "apollo-upload-client";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";
import {
  ConnectionParams,
  SubscriptionClient,
} from "subscriptions-transport-ws";
import { setContext } from "apollo-link-context";
import { EventManager } from "@bluelibs/core";
<<<<<<< HEAD:packages/ui-apollo-bundle/src/graphql/utils/createApolloLink.ts
import {
  ApolloBeforeOperationEvent,
  ApolloSubscriptionOnConnectionParamsSetEvent,
} from "../../events";

const createContextLink = (eventManager: EventManager) => {
  return setContext(async (operation: GraphQLRequest, prevContext: any) => {
    const newContext = Object.assign({}, prevContext);

    await eventManager.emit(
      new ApolloBeforeOperationEvent({ context: newContext, operation })
    );

    return newContext;
  });
};
=======
import { ApolloBeforeOperationEvent } from "../../events";

const createHeadersMiddlewareLink = (eventManager: EventManager) =>
  setContext(async () => {
    const headers = {};

    await eventManager.emit(new ApolloBeforeOperationEvent({ headers }));

    return {
      headers,
    };
  });
>>>>>>> 047d18a ((initial changes)):packages/x-ui/src/graphql/utils/createApolloLink.ts

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
  wsLink?: WebSocketLink;
  subscriptionClient?: SubscriptionClient;
} {
  const uploadLink = createUploadLink({
    uri,
  });
  const enhancedHttpLink = ApolloLink.from([
<<<<<<< HEAD:packages/ui-apollo-bundle/src/graphql/utils/createApolloLink.ts
    createContextLink(eventManager) as any,
=======
    createHeadersMiddlewareLink(eventManager) as any,
>>>>>>> 047d18a ((initial changes)):packages/x-ui/src/graphql/utils/createApolloLink.ts
    uploadLink,
  ]);

  let wsLink = null,
    subscriptionClient = null,
    finalLink = enhancedHttpLink;

  if (options.subscriptions) {
    subscriptionClient = new SubscriptionClient(
      uri.replace("http://", "ws://").replace("https://", "wss://"),
      {
        reconnect: true,
        connectionParams: async () => {
<<<<<<< HEAD:packages/ui-apollo-bundle/src/graphql/utils/createApolloLink.ts
          const params: ConnectionParams = {};

          await eventManager.emit(
            new ApolloSubscriptionOnConnectionParamsSetEvent({
              params,
            })
          );

          return params;
=======
          const subscriptionConnectionParams: ConnectionParams = {};

          await eventManager.emit(
            new ApolloBeforeOperationEvent({
              isSubscription: true,
              subscriptionConnectionParams,
            })
          );

          return subscriptionConnectionParams;
>>>>>>> 047d18a ((initial changes)):packages/x-ui/src/graphql/utils/createApolloLink.ts
        },
      }
    );
    wsLink = new WebSocketLink(subscriptionClient);
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

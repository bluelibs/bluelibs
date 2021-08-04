import { split, ApolloLink } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { LOCAL_STORAGE_TOKEN_KEY } from "../../constants";

const authenticationTokenLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);

  operation.setContext(() => {
    if (!token) {
      return {};
    } else {
      return {
        headers: {
          [LOCAL_STORAGE_TOKEN_KEY]: token,
        },
      };
    }
  });

  return forward(operation);
});

type CreateLinkOptions = {
  subscriptions: boolean;
};

export function createApolloLink(
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
  const enhancedHttpLink = ApolloLink.concat(
    authenticationTokenLink,
    uploadLink
  );

  let wsLink = null,
    subscriptionClient = null,
    finalLink = enhancedHttpLink;
  if (options.subscriptions) {
    subscriptionClient = new SubscriptionClient(
      uri.replace("http://", "ws://").replace("https://", "wss://"),
      {
        reconnect: true,
        connectionParams: () => {
          return {
            [LOCAL_STORAGE_TOKEN_KEY]: localStorage.getItem(
              LOCAL_STORAGE_TOKEN_KEY
            ),
          };
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

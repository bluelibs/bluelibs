import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import { ApolloLink } from "apollo-link";
import { WebSocketLink } from "apollo-link-ws";
import * as fetch from "isomorphic-fetch";
import { split } from "apollo-link";
import { getMainDefinition } from "apollo-utilities";
import * as ws from "ws";

export default function getClient(port: number = 6000): ApolloClient<any> {
  const wsLink = new WebSocketLink({
    uri: `ws://localhost:${port}/graphql`,
    options: {
      reconnect: true,
    },
    webSocketImpl: ws,
  });

  const httpLink = new HttpLink({
    uri: `http://localhost:${port}/graphql`,
    credentials: "same-origin",
    fetch,
  });

  return new ApolloClient({
    link: ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path }) =>
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          );
        if (networkError) console.log(`[Network error]:`, networkError);
      }),
      split(
        // split based on operation type
        ({ query }) => {
          const definition = getMainDefinition(query);

          return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
          );
        },
        wsLink,
        httpLink
      ),
    ]),
    cache: new InMemoryCache(),
  });
}

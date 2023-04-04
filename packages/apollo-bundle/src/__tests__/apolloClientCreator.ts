import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  HttpLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { split } from "@apollo/client/link/core";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

import * as fetch from "isomorphic-fetch";
import * as ws from "ws";

export default function getClient(port: number = 6000): ApolloClient<any> {
  const wsLink = new GraphQLWsLink(
    createClient({
      url: `ws://localhost:${port}/graphql`,
      retryAttempts: 5,
      webSocketImpl: ws,
    })
  );

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

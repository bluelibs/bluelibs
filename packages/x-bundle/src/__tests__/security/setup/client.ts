import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import fetch from "node-fetch";
import { PORT } from "../../cache/createEcosystem";

export const authStorage = {
  value: "",
};

const httpLink = new HttpLink({
  uri: `http://localhost:${PORT}/graphql`,
  // @ts-ignore
  fetch,
});

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  operation.setContext(({ headers = {} }) => {
    const newHeaders = { ...headers };
    if (authStorage.value) {
      newHeaders["bluelibs-token"] = authStorage.value;
    }

    return {
      headers: newHeaders,
    };
  });

  return forward(operation);
});

export function createClient(): ApolloClient<any> {
  return new ApolloClient({
    uri: `http://localhost:${PORT}/graphql`,
    cache: new InMemoryCache(),
    link: ApolloLink.from([authMiddleware, httpLink]),
    defaultOptions: {
      query: {
        fetchPolicy: "network-only",
      },
    },
  });
}

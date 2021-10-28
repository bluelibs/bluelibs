import { InMemoryCache } from "@apollo/client/core";
import { Bundle } from "@bluelibs/core";
import { ApolloClient } from ".";
import { IUIApolloBundleConfig } from "./defs";

export class UIApolloBundle extends Bundle<IUIApolloBundleConfig> {
  protected defaultConfig = {
    client: {
      uri: "http://localhost:3000",
      cache: new InMemoryCache(),
    },
    enableSubscriptions: false,
  } as IUIApolloBundleConfig;

  async validate(config: IUIApolloBundleConfig) {
    if (!config.client?.uri) {
      throw new Error(
        `You have to provide a valid 'graphql.uri' for it to connect to the GraphQL API`
      );
    }
  }

  async prepare() {
    if (!this.config.client.cache) {
      this.config.client.cache = new InMemoryCache({
        dataIdFromObject: (object) => (object?._id as string) || null,
      }).restore((window as any).__APOLLO_STATE__ || {});
    }

    this.container.set(
      ApolloClient,
      new ApolloClient(this.container, this.config)
    );
  }
}

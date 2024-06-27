import { ApolloClient as BaseApolloClient } from "@apollo/client/core";
import { ContainerInstance, EventManager, Service } from "@bluelibs/core";
import { Client } from "graphql-ws";
import { IUIApolloBundleConfig } from "../defs";
import { createApolloLink } from "./utils/createApolloLink";

@Service()
export class ApolloClient extends BaseApolloClient<any> {
  public subscriptionClient?: Client;

  constructor(container: ContainerInstance, options: IUIApolloBundleConfig) {
    const { finalLink, subscriptionClient } = createApolloLink(
      container.get(EventManager),
      options.client.uri as string,
      {
        subscriptions: options.enableSubscriptions,
      }
    );

    super({
      link: finalLink,
      ...options.client,
    });

    this.subscriptionClient = subscriptionClient;
  }
}

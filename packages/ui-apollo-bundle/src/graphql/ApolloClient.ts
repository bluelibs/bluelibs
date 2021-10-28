import { ApolloClient as BaseApolloClient } from "@apollo/client/core";
import { EventManager, Service } from "@bluelibs/core";
<<<<<<< HEAD
import { ContainerInstance } from "@bluelibs/core";
=======
import { ContainerInstance } from "@bluelibs/core/node_modules/typedi";
>>>>>>> 047d18a ((initial changes))
import { SubscriptionClient } from "subscriptions-transport-ws";
import { IUIApolloBundleConfig } from "../defs";
import { createApolloLink } from "./utils/createApolloLink";

@Service()
export class ApolloClient extends BaseApolloClient<any> {
  public subscriptionClient?: SubscriptionClient;

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

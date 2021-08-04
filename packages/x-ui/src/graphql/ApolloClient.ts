import {
  ApolloClient as BaseApolloClient,
  ApolloClientOptions,
} from "@apollo/client/core";
import { Service, Inject, EventManager } from "@bluelibs/core";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { APOLLO_CLIENT_OPTIONS_TOKEN, XUI_CONFIG_TOKEN } from "../constants";
import { createApolloLink } from "./utils/createApolloLink";
import { IXUIBundleConfig } from "../defs";
import {
  UserLoggedInEvent,
  UserLoggedOutEvent,
} from "../events/UserSecurityEvents";

@Service()
export class ApolloClient extends BaseApolloClient<any> {
  protected subscriptionClient?: SubscriptionClient;
  protected eventManager: EventManager;

  constructor(
    eventManager: EventManager,
    @Inject(APOLLO_CLIENT_OPTIONS_TOKEN)
    options: ApolloClientOptions<any>,
    @Inject(XUI_CONFIG_TOKEN)
    xuiConfig: IXUIBundleConfig
  ) {
    const { finalLink, subscriptionClient } = createApolloLink(
      options.uri as string,
      {
        subscriptions: xuiConfig.enableSubscriptions,
      }
    );

    super({
      link: finalLink,
      ...options,
    });

    this.eventManager = eventManager;

    if (!options.link) {
      this.eventManager.addListener(UserLoggedInEvent, (e) => {
        subscriptionClient.close();
      });
      this.eventManager.addListener(UserLoggedOutEvent, (e) => {
        subscriptionClient.close();
      });
    }
  }
}

import { Bundle } from "@bluelibs/core";
import {
  ApolloBeforeOperationEvent,
<<<<<<< HEAD
  ApolloSubscriptionOnConnectionParamsSetEvent,
=======
>>>>>>> 047d18a ((initial changes))
  ApolloClient,
  UIApolloBundle,
} from "@bluelibs/ui-apollo-bundle";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { GuardianSmart } from "./react/smarts/GuardianSmart";
import { GUARDIAN_SMART_TOKEN, LOCAL_STORAGE_TOKEN_KEY } from "./constants";
import { IXUIGuardianBundleConfigType } from "./defs";
import { setDefaults } from "@bluelibs/smart";
import { Protect } from "./react/components/Protect";
import { UserLoggedInEvent, UserLoggedOutEvent } from "./events";

export class XUIGuardianBundle extends Bundle<IXUIGuardianBundleConfigType> {
  protected defaultConfig = {
    guardianClass: GuardianSmart,
  } as IXUIGuardianBundleConfigType;

  async extend() {
    await this.addDependency(UIApolloBundle);
    await this.addDependency(XUIReactBundle);
  }

  async hook() {
    this.eventManager.addListener(ApolloBeforeOperationEvent, (e) => {
      const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);

      if (!token) return;

<<<<<<< HEAD
      const {
        data: { context },
      } = e;

      context.headers = context.headers || {};
      context.headers[LOCAL_STORAGE_TOKEN_KEY] = token;
    });

    this.eventManager.addListener(
      ApolloSubscriptionOnConnectionParamsSetEvent,
      (e) => {
        const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);

        e.data.params[LOCAL_STORAGE_TOKEN_KEY] = token;
      }
    );
=======
      const { data } = e;

      const objectToModify = data.isSubscription
        ? data.subscriptionConnectionParams
        : data.headers;

      objectToModify[LOCAL_STORAGE_TOKEN_KEY] = token;
    });

    // FIXME: this is how it was before, in ApolloClient, for the next two listeners. do we need this condition?
    // if (!options.client.link)
>>>>>>> 047d18a ((initial changes))

    this.eventManager.addListener(
      UserLoggedInEvent,
      this.userAuthenticationSubscriptionClientHandler.bind(this)
    );
    this.eventManager.addListener(
      UserLoggedOutEvent,
      this.userAuthenticationSubscriptionClientHandler.bind(this)
    );
  }

  protected userAuthenticationSubscriptionClientHandler() {
    const subscriptionClient =
      this.container.get(ApolloClient).subscriptionClient;

    if (!subscriptionClient) return;

    subscriptionClient.close();
  }

  async prepare() {
    this.container.get(XUIReactBundle).updateComponents({
      Protect,
    });
  }

  async init() {
    this.container.set(GUARDIAN_SMART_TOKEN, this.config.guardianClass);

    const container = this.container;

    setDefaults({
      factory(targetType) {
        return container.get(targetType);
      },
    });
  }
}

import { Bundle } from "@bluelibs/core";
import {
  ApolloBeforeOperationEvent,
  ApolloSubscriptionOnConnectionParamsSetEvent,
  ApolloClient,
  UIApolloBundle,
} from "@bluelibs/ui-apollo-bundle";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { GuardianSmart } from "./react/smarts/GuardianSmart";
import {
  GUARDIAN_IS_MULTIPLEFACTOR_AUTH,
  GUARDIAN_SMART_TOKEN,
  LOCAL_STORAGE_TOKEN_KEY,
} from "./constants";
import { IXUIGuardianBundleConfigType } from "./defs";
import { Protect } from "./react/components/Protect";
import { UserLoggedInEvent, UserLoggedOutEvent } from "./events";
import { XUIGuardianProvider } from "./react/provider/XUIGuardianProvider";

export class XUIGuardianBundle extends Bundle<IXUIGuardianBundleConfigType> {
  protected defaultConfig = {
    multipleFactorAuth: false,
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
    const xuiReactBundle = this.container.get(XUIReactBundle);

    xuiReactBundle.updateComponents({
      Protect,
    });

    xuiReactBundle.addWrapper({
      component: XUIGuardianProvider,
      props: () => ({
        loadingComponent: this.config.loadingComponent,
      }),
      order: 20,
    });
  }

  async init() {
    this.container.set(
      GUARDIAN_IS_MULTIPLEFACTOR_AUTH,
      this.config.multipleFactorAuth
    );
    this.container.set(GUARDIAN_SMART_TOKEN, this.config.guardianClass);
  }
}
